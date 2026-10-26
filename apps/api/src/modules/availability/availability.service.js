import { Op } from 'sequelize';
import sequelize from '../../config/database/database.js';
import AvailabilitySession from './availability.model.js';
import Invite from '../invites/invite.model.js';
import PlayerProfile from '../profiles/profile.model.js';
import User from '../auth/auth.model.js';
import { toPublicProfile } from '../profiles/profile.service.js';
import { blockService } from '../trust/block.service.js';
import { notificationService } from '../notifications/notification.service.js';
import { AppError } from '../../errors/appError.js';
import {
  areRolesComplementary,
  computeNowScore,
  maxRankDistance,
  rankDistance,
} from '../matching/matching.utils.js';
import DuoConnection from '../matching/duoConnection.model.js';

const USER_ATTRIBUTES = [
  'id',
  'username',
  'role',
  'status',
  'emailVerified',
  'lastActiveAt',
  'createdAt',
];

export class AvailabilityService {
  async expireOldSessions() {
    await AvailabilitySession.update(
      {
        status: 'closed',
        endedAt: new Date(),
        closedReason: 'expired',
      },
      {
        where: {
          status: 'active',
          expiresAt: { [Op.lte]: new Date() },
        },
      }
    );
  }

  async getViewerProfile(userId) {
    const profile = await PlayerProfile.findOne({
      where: {
        userId,
        isDeleted: false,
        profileCompletedAt: { [Op.ne]: null },
      },
    });

    if (!profile) {
      throw new AppError('Completá tu perfil antes de usar Disponible ya.', 403);
    }

    return profile;
  }

  async getTargetData(userId) {
    const profile = await PlayerProfile.findOne({
      where: {
        userId,
        isDeleted: false,
        profileCompletedAt: { [Op.ne]: null },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: USER_ATTRIBUTES,
          where: { isDeleted: false, status: 'active', emailVerified: true },
          required: true,
        },
      ],
    });

    if (!profile) {
      throw new AppError('No encontramos a ese jugador.', 404);
    }

    return profile;
  }

  async getActiveConnectionIds(userId) {
    const connections = await DuoConnection.findAll({
      where: {
        status: 'active',
        [Op.or]: [{ userLowId: userId }, { userHighId: userId }],
      },
      attributes: ['userLowId', 'userHighId'],
    });

    return new Set(
      connections.map((connection) =>
        connection.userLowId === userId ? connection.userHighId : connection.userLowId
      )
    );
  }

  async create(userId, { roles, queue, note, ttlMinutes }) {
    await this.expireOldSessions();

    return sequelize.transaction(async (transaction) => {
      const now = new Date();

      await AvailabilitySession.update(
        { status: 'closed', endedAt: now, closedReason: 'manual' },
        {
          where: { userId, status: 'active' },
          transaction,
        }
      );

      return AvailabilitySession.create(
        {
          userId,
          roles,
          queue,
          note: note?.trim() || null,
          status: 'active',
          startedAt: now,
          expiresAt: new Date(now.getTime() + ttlMinutes * 60 * 1000),
        },
        { transaction }
      );
    });
  }

  async close(userId) {
    await AvailabilitySession.update(
      {
        status: 'closed',
        endedAt: new Date(),
        closedReason: 'manual',
      },
      {
        where: { userId, status: 'active' },
      }
    );
  }

  async getMine(userId) {
    const session = await AvailabilitySession.findOne({
      where: { userId, status: 'active' },
    });

    if (!session) return null;

    if (new Date(session.expiresAt) <= new Date()) {
      await session.update({
        status: 'closed',
        endedAt: new Date(),
        closedReason: 'expired',
      });
      return null;
    }

    return session;
  }

  async list(viewerId, { queue, role, limit }) {
    await this.expireOldSessions();

    const viewer = await this.getViewerProfile(viewerId);
    const [blockedIds, connectionIds] = await Promise.all([
      blockService.getBlockedIds(viewerId),
      this.getActiveConnectionIds(viewerId),
    ]);

    const where = {
      status: 'active',
      expiresAt: { [Op.gt]: new Date() },
      userId: { [Op.ne]: viewerId },
    };

    if (queue) where.queue = queue;
    if (blockedIds.length) where.userId[Op.notIn] = blockedIds;
    if (connectionIds.size) {
      where.userId[Op.notIn] = [...(where.userId[Op.notIn] || []), ...connectionIds];
    }

    const sessions = await AvailabilitySession.findAll({
      where,
      order: [['expiresAt', 'ASC']],
      limit: 100,
    });

    if (!sessions.length) return [];

    const profiles = await PlayerProfile.findAll({
      where: {
        userId: { [Op.in]: sessions.map((session) => session.userId) },
        isDeleted: false,
        profileCompletedAt: { [Op.ne]: null },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: USER_ATTRIBUTES,
          where: { isDeleted: false, status: 'active', emailVerified: true },
          required: true,
        },
      ],
    });

    const profilesByUser = new Map(profiles.map((profile) => [profile.userId, profile]));
    const items = [];

    for (const session of sessions) {
      if (role && !session.roles.includes(role)) continue;

      const profile = profilesByUser.get(session.userId);
      if (!profile) continue;

      const tolerance = maxRankDistance(session.queue);
      if (rankDistance(viewer, profile) > tolerance) continue;

      const sessionRoles = {
        primaryRole: session.roles[0],
        secondaryRole: session.roles[1],
      };
      if (!areRolesComplementary(viewer, sessionRoles)) continue;

      const score = computeNowScore(viewer, profile, {
        queue: session.queue,
      });

      items.push({
        session: {
          id: session.id,
          roles: session.roles,
          queue: session.queue,
          note: session.note,
          expiresAt: session.expiresAt,
          startedAt: session.startedAt,
        },
        profile: {
          ...toPublicProfile(profile, profile.user),
          availabilityActive: true,
        },
        score: score.score,
        breakdown: score.breakdown,
      });
    }

    items.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const reputationDiff =
        (b.profile.reputation?.score || 0) - (a.profile.reputation?.score || 0);
      if (reputationDiff !== 0) return reputationDiff;
      return a.session.expiresAt.getTime() - b.session.expiresAt.getTime();
    });

    return items.slice(0, limit);
  }

  async invite(viewerId, availabilityId, { role, message }) {
    if (!availabilityId) {
      throw new AppError('No encontramos esa disponibilidad.', 404);
    }

    await this.getViewerProfile(viewerId);
    const viewerUser = await User.findByPk(viewerId, { attributes: ['id', 'username'] });

    const session = await AvailabilitySession.findOne({
      where: { id: availabilityId, status: 'active' },
    });

    if (!session) {
      throw new AppError('Esa disponibilidad ya no está activa.', 409);
    }

    if (new Date(session.expiresAt) <= new Date()) {
      await session.update({
        status: 'closed',
        endedAt: new Date(),
        closedReason: 'expired',
      });
      throw new AppError('Esa disponibilidad expiró.', 409);
    }

    if (session.userId === viewerId) {
      throw new AppError('No podés invitarte a vos mismo.', 400);
    }

    if (!session.roles.includes(role)) {
      throw new AppError('Ese jugador no está disponible para ese rol.', 422);
    }

    const target = await this.getTargetData(session.userId);

    if (await blockService.isBlockedEither(viewerId, session.userId)) {
      throw new AppError('No podés interactuar con este usuario.', 403);
    }

    const activeConnection = await DuoConnection.findOne({
      where: {
        status: 'active',
        [Op.or]: [
          { userLowId: viewerId, userHighId: session.userId },
          { userLowId: session.userId, userHighId: viewerId },
        ],
      },
    });

    if (activeConnection) {
      throw new AppError('Ya tienen un match activo.', 409);
    }

    const pending = await Invite.findOne({
      where: {
        fromUserId: viewerId,
        toUserId: session.userId,
        status: 'pending',
      },
    });

    if (pending) {
      if (new Date(pending.expiresAt) > new Date()) {
        throw new AppError('Ya le enviaste una invitación a este jugador.', 409);
      }

      await pending.update({ status: 'expired', respondedAt: new Date() });
    }

    const invite = await Invite.create({
      fromUserId: viewerId,
      toUserId: session.userId,
      availabilityId: session.id,
      role,
      message: message?.trim() || null,
      status: 'pending',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await notificationService.create({
      userId: session.userId,
      type: 'invite_received',
      title: 'Nueva invitación',
      message: `${viewerUser?.username || 'Un jugador'} te invitó a jugar como ${role}.`,
      data: { inviteId: invite.id, url: '/invitaciones' },
    });

    return { invite, target };
  }
}

export const availabilityService = new AvailabilityService();

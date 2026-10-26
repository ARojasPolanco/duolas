import { Op } from 'sequelize';
import sequelize from '../../config/database/database.js';
import Invite from './invite.model.js';
import AvailabilitySession from '../availability/availability.model.js';
import PlayerProfile from '../profiles/profile.model.js';
import User from '../auth/auth.model.js';
import { toPublicProfile } from '../profiles/profile.service.js';
import { blockService } from '../trust/block.service.js';
import { connectionService } from '../matching/connection.service.js';
import { notificationService } from '../notifications/notification.service.js';
import { metricsService } from '../metrics/metrics.service.js';
import { AppError } from '../../errors/appError.js';

const USER_ATTRIBUTES = [
  'id',
  'username',
  'role',
  'status',
  'emailVerified',
  'lastActiveAt',
  'createdAt',
];

export class InviteService {
  async expireDueInvites() {
    await Invite.update(
      { status: 'expired', respondedAt: new Date() },
      {
        where: {
          status: 'pending',
          expiresAt: { [Op.lte]: new Date() },
        },
      }
    );
  }

  async list(userId, box) {
    await this.expireDueInvites();

    const where = box === 'outgoing' ? { fromUserId: userId } : { toUserId: userId };

    const invites = await Invite.findAll({
      where,
      include: [
        {
          model: AvailabilitySession,
          as: 'availability',
          attributes: ['roles', 'queue'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    if (!invites.length) return [];

    const counterpartIds = invites.map((invite) =>
      box === 'outgoing' ? invite.toUserId : invite.fromUserId
    );

    const profiles = await PlayerProfile.findAll({
      where: {
        userId: { [Op.in]: counterpartIds },
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

    return invites
      .map((invite) => {
        const counterpartId = box === 'outgoing' ? invite.toUserId : invite.fromUserId;
        const profile = profilesByUser.get(counterpartId);
        if (!profile) return null;

        return {
          id: invite.id,
          box,
          status: invite.status,
          role: invite.role,
          message: invite.message,
          expiresAt: invite.expiresAt,
          respondedAt: invite.respondedAt,
          createdAt: invite.createdAt,
          counterpart: toPublicProfile(profile, profile.user),
          availability: invite.availability
            ? { roles: invite.availability.roles, queue: invite.availability.queue }
            : null,
        };
      })
      .filter(Boolean);
  }

  async accept(userId, inviteId) {
    await this.expireDueInvites();

    const invite = await Invite.findOne({ where: { id: inviteId, toUserId: userId } });

    if (!invite) {
      throw new AppError('No encontramos esa invitación.', 404);
    }

    if (invite.status !== 'pending') {
      throw new AppError('La invitación ya fue resuelta o expiró.', 409);
    }

    if (await blockService.isBlockedEither(userId, invite.fromUserId)) {
      throw new AppError('No podés aceptar esta invitación.', 403);
    }

    const sender = await PlayerProfile.findOne({
      where: {
        userId: invite.fromUserId,
        isDeleted: false,
        profileCompletedAt: { [Op.ne]: null },
      },
    });

    if (!sender) {
      throw new AppError('El jugador que te invitó ya no está disponible.', 404);
    }

    return sequelize.transaction(async (transaction) => {
      const locked = await Invite.findOne({
        where: { id: inviteId, toUserId: userId, status: 'pending' },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!locked) {
        throw new AppError('La invitación ya fue resuelta.', 409);
      }

      const now = new Date();
      await locked.update({ status: 'accepted', respondedAt: now }, { transaction });

      const { connection } = await connectionService.createConnection({
        userIds: [locked.fromUserId, locked.toUserId],
        source: 'availability',
        transaction,
      });

      await metricsService.track(
        'invite_accepted',
        userId,
        { inviteId: locked.id, connectionId: connection.id },
        transaction
      );

      const user = await User.findByPk(userId, { attributes: ['id', 'username'] });

      await notificationService.create(
        {
          userId: locked.fromUserId,
          type: 'invite_accepted',
          title: 'Invitación aceptada',
          message: `${user?.username || 'Un jugador'} aceptó tu invitación.`,
          data: { inviteId: locked.id, connectionId: connection.id, url: '/matches' },
        },
        transaction
      );

      return {
        connection,
        contact: {
          riotId: sender.riotId,
          discordTag: sender.discordTag,
        },
      };
    });
  }

  async decline(userId, inviteId) {
    await this.expireDueInvites();

    const invite = await Invite.findOne({ where: { id: inviteId, toUserId: userId } });

    if (!invite) {
      throw new AppError('No encontramos esa invitación.', 404);
    }

    if (invite.status !== 'pending') {
      throw new AppError('La invitación ya fue resuelta o expiró.', 409);
    }

    await invite.update({ status: 'declined', respondedAt: new Date() });

    const user = await User.findByPk(userId, { attributes: ['id', 'username'] });
    await notificationService.create({
      userId: invite.fromUserId,
      type: 'invite_declined',
      title: 'Invitación rechazada',
      message: `${user?.username || 'El jugador'} rechazó tu invitación.`,
      data: { inviteId: invite.id, url: '/invitaciones' },
    });

    return invite;
  }

  async cancel(userId, inviteId) {
    await this.expireDueInvites();

    const invite = await Invite.findOne({ where: { id: inviteId, fromUserId: userId } });

    if (!invite) {
      throw new AppError('No encontramos esa invitación.', 404);
    }

    if (invite.status !== 'pending') {
      throw new AppError('La invitación ya fue resuelta o expiró.', 409);
    }

    await invite.update({ status: 'cancelled', respondedAt: new Date() });

    const user = await User.findByPk(userId, { attributes: ['id', 'username'] });
    await notificationService.create({
      userId: invite.toUserId,
      type: 'invite_cancelled',
      title: 'Invitación cancelada',
      message: `${user?.username || 'El jugador'} canceló su invitación.`,
      data: { inviteId: invite.id, url: '/invitaciones' },
    });

    return invite;
  }
}

export const inviteService = new InviteService();

import { Op, cast, col, where as sqlWhere } from 'sequelize';
import sequelize from '../../config/database/database.js';
import { CANDIDATE_FETCH_LIMIT } from '../../config/matching.js';
import PlayerProfile from '../profiles/profile.model.js';
import User from '../auth/auth.model.js';
import { toPublicProfile } from '../profiles/profile.service.js';
import DuoLike from './duoLike.model.js';
import DuoConnection from './duoConnection.model.js';
import { blockService } from '../trust/block.service.js';
import { notificationService } from '../notifications/notification.service.js';
import { AppError } from '../../errors/appError.js';
import {
  areRolesComplementary,
  computeDuoScore,
  maxRankDistance,
  orderedPair,
  rolesOf,
} from './matching.utils.js';

const USER_ATTRIBUTES = [
  'id',
  'username',
  'role',
  'status',
  'emailVerified',
  'lastActiveAt',
  'createdAt',
];

const ACTIVE_USER_WHERE = {
  isDeleted: false,
  status: 'active',
  emailVerified: true,
};

const toLikeView = (like) => ({
  id: like.id,
  status: like.status,
  createdAt: like.createdAt,
});

const toConnectionView = (connection, contact) => ({
  id: connection.id,
  source: connection.source,
  createdAt: connection.createdAt,
  contact: {
    riotId: contact.riotId,
    discordTag: contact.discordTag,
  },
});

const toMatchView = (connection, profile) => ({
  id: connection.id,
  source: connection.source,
  createdAt: connection.createdAt,
  contact: {
    riotId: profile.riotId,
    discordTag: profile.discordTag,
  },
  other: toPublicProfile(profile, profile.user),
  feedback: {
    mine: 'pending',
    theirs: 'pending',
    revealed: false,
  },
});

const lastActiveMs = (user) => (user?.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0);

export class MatchingService {
  async getViewerProfile(viewerId) {
    const profile = await PlayerProfile.findOne({
      where: {
        userId: viewerId,
        isDeleted: false,
        profileCompletedAt: { [Op.ne]: null },
      },
    });

    if (!profile) {
      throw new AppError('Completá tu perfil antes de buscar duo.', 403);
    }

    return profile;
  }

  async getTargetProfile(targetId) {
    const profile = await PlayerProfile.findOne({
      where: {
        userId: targetId,
        isDeleted: false,
        profileCompletedAt: { [Op.ne]: null },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: USER_ATTRIBUTES,
          where: ACTIVE_USER_WHERE,
          required: true,
        },
      ],
    });

    if (!profile) {
      throw new AppError('No encontramos ese jugador.', 404);
    }

    return profile;
  }

  async getExcludedIds(viewerId) {
    const [blockedIds, connections, outgoingLikes] = await Promise.all([
      blockService.getBlockedIds(viewerId),
      DuoConnection.findAll({
        where: {
          status: 'active',
          [Op.or]: [{ userLowId: viewerId }, { userHighId: viewerId }],
        },
        attributes: ['userLowId', 'userHighId'],
      }),
      DuoLike.findAll({
        where: { fromUserId: viewerId, status: 'pending' },
        attributes: ['toUserId'],
      }),
    ]);

    const excluded = new Set(blockedIds);

    for (const connection of connections) {
      excluded.add(
        connection.userLowId === viewerId ? connection.userHighId : connection.userLowId
      );
    }
    for (const like of outgoingLikes) {
      excluded.add(like.toUserId);
    }

    excluded.delete(viewerId);
    return [...excluded];
  }

  async getCandidates(viewerId, { queue, role, limit }) {
    const viewer = await this.getViewerProfile(viewerId);
    const excluded = await this.getExcludedIds(viewerId);
    const tolerance = maxRankDistance(queue);

    const userFilter = { [Op.ne]: viewerId };
    if (excluded.length) {
      userFilter[Op.notIn] = excluded;
    }

    const candidates = await PlayerProfile.findAll({
      where: {
        server: 'LAS',
        isDeleted: false,
        profileCompletedAt: { [Op.ne]: null },
        userId: userFilter,
        rankIndex: {
          [Op.between]: [viewer.rankIndex - tolerance, viewer.rankIndex + tolerance],
        },
        [Op.and]: [
          sqlWhere(cast(col('schedule_blocks'), 'text[]'), {
            [Op.overlap]: viewer.scheduleBlocks,
          }),
        ],
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: USER_ATTRIBUTES,
          where: ACTIVE_USER_WHERE,
          required: true,
        },
      ],
      order: [[{ model: User, as: 'user' }, 'lastActiveAt', 'DESC']],
      limit: CANDIDATE_FETCH_LIMIT,
    });

    const scored = [];

    for (const candidate of candidates) {
      if (!areRolesComplementary(viewer, candidate)) continue;
      if (role && !rolesOf(candidate).includes(role)) continue;

      const result = computeDuoScore(viewer, candidate, { queue });
      scored.push({ candidate, ...result });
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const reputationDiff =
        (b.candidate.reputationScore || 0) - (a.candidate.reputationScore || 0);
      if (reputationDiff !== 0) return reputationDiff;
      const activeDiff = lastActiveMs(b.candidate.user) - lastActiveMs(a.candidate.user);
      if (activeDiff !== 0) return activeDiff;
      const createdDiff =
        new Date(a.candidate.createdAt).getTime() - new Date(b.candidate.createdAt).getTime();
      if (createdDiff !== 0) return createdDiff;
      return a.candidate.userId.localeCompare(b.candidate.userId);
    });

    const selected = scored.slice(0, limit).map((item) => ({
      profile: toPublicProfile(item.candidate, item.candidate.user),
      score: item.score,
      breakdown: item.breakdown,
      reasons: item.reasons,
    }));

    return {
      candidates: selected,
      total: scored.length,
    };
  }

  async like(viewerId, targetId) {
    if (viewerId === targetId) {
      throw new AppError('No podés dar like a vos mismo.', 400);
    }

    const target = await this.getTargetProfile(targetId);

    if (await blockService.isBlockedEither(viewerId, targetId)) {
      throw new AppError('No podés interactuar con este usuario.', 403);
    }

    const [low, high] = orderedPair(viewerId, targetId);
    const contact = { riotId: target.riotId, discordTag: target.discordTag };

    const existingConnection = await DuoConnection.findOne({
      where: { userLowId: low, userHighId: high },
    });

    if (existingConnection?.status === 'active') {
      const existingLike = await DuoLike.findOne({
        where: { fromUserId: viewerId, toUserId: targetId },
      });

      return {
        created: false,
        matched: true,
        like: existingLike,
        connection: existingConnection,
        contact,
      };
    }

    return sequelize.transaction(async (transaction) => {
      let like = await DuoLike.findOne({
        where: { fromUserId: viewerId, toUserId: targetId },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      let created = false;

      if (!like) {
        like = await DuoLike.create(
          {
            fromUserId: viewerId,
            toUserId: targetId,
            status: 'pending',
          },
          { transaction }
        );
        created = true;
      } else if (like.status === 'cancelled') {
        await like.update({ status: 'pending' }, { transaction });
      }

      const reciprocal = await DuoLike.findOne({
        where: { fromUserId: targetId, toUserId: viewerId },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      const matchable =
        reciprocal &&
        ['pending', 'matched'].includes(reciprocal.status) &&
        ['pending', 'matched'].includes(like.status);

      if (!matchable) {
        return { created, matched: false, like, connection: null, contact: null };
      }

      let connection = await DuoConnection.findOne({
        where: { userLowId: low, userHighId: high },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (connection) {
        if (connection.status === 'archived') {
          await connection.update(
            {
              status: 'active',
              archivedAt: null,
              archivedBy: null,
              contactRevealedAt: new Date(),
            },
            { transaction }
          );
        }
      } else {
        connection = await DuoConnection.create(
          {
            userLowId: low,
            userHighId: high,
            source: 'like',
            status: 'active',
            contactRevealedAt: new Date(),
          },
          { transaction }
        );
      }

      await like.update({ status: 'matched' }, { transaction });
      await reciprocal.update({ status: 'matched' }, { transaction });

      await notificationService.create(
        {
          userId: viewerId,
          type: 'match_created',
          title: 'Es un match',
          message: 'Ya pueden coordinar su duo.',
          data: { connectionId: connection.id, url: '/matches' },
        },
        transaction
      );

      await notificationService.create(
        {
          userId: targetId,
          type: 'match_created',
          title: 'Es un match',
          message: 'Ya pueden coordinar su duo.',
          data: { connectionId: connection.id, url: '/matches' },
        },
        transaction
      );

      return { created, matched: true, like, connection, contact };
    });
  }

  async unlike(viewerId, targetId) {
    const like = await DuoLike.findOne({
      where: { fromUserId: viewerId, toUserId: targetId },
    });

    if (!like) return null;

    if (like.status === 'matched') {
      throw new AppError('Ya tienen un match. Podés archivarlo desde Matches.', 409);
    }

    await like.update({ status: 'cancelled' });
    return like;
  }

  async getOutgoingLikes(viewerId) {
    const likes = await DuoLike.findAll({
      where: { fromUserId: viewerId, status: 'pending' },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    if (!likes.length) return [];

    const profiles = await PlayerProfile.findAll({
      where: {
        userId: { [Op.in]: likes.map((like) => like.toUserId) },
        isDeleted: false,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: USER_ATTRIBUTES,
          where: { isDeleted: false },
          required: true,
        },
      ],
    });

    const profilesByUser = new Map(profiles.map((profile) => [profile.userId, profile]));

    return likes
      .map((like) => {
        const profile = profilesByUser.get(like.toUserId);
        if (!profile) return null;
        return {
          id: like.id,
          createdAt: like.createdAt,
          target: toPublicProfile(profile, profile.user),
        };
      })
      .filter(Boolean);
  }

  async getMatches(viewerId) {
    const connections = await DuoConnection.findAll({
      where: {
        status: 'active',
        [Op.or]: [{ userLowId: viewerId }, { userHighId: viewerId }],
      },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    if (!connections.length) return [];

    const otherIds = connections.map((connection) =>
      connection.userLowId === viewerId ? connection.userHighId : connection.userLowId
    );

    const profiles = await PlayerProfile.findAll({
      where: { userId: { [Op.in]: otherIds }, isDeleted: false },
      include: [
        {
          model: User,
          as: 'user',
          attributes: USER_ATTRIBUTES,
          where: { isDeleted: false },
          required: true,
        },
      ],
    });

    const profilesByUser = new Map(profiles.map((profile) => [profile.userId, profile]));

    return connections
      .map((connection) => {
        const otherId =
          connection.userLowId === viewerId ? connection.userHighId : connection.userLowId;
        const profile = profilesByUser.get(otherId);
        if (!profile) return null;
        return toMatchView(connection, profile);
      })
      .filter(Boolean);
  }

  async getMatchDetail(viewerId, connectionId) {
    const connection = await DuoConnection.findOne({
      where: {
        id: connectionId,
        status: 'active',
        [Op.or]: [{ userLowId: viewerId }, { userHighId: viewerId }],
      },
    });

    if (!connection) {
      throw new AppError('No encontramos ese match.', 404);
    }

    const otherId =
      connection.userLowId === viewerId ? connection.userHighId : connection.userLowId;

    const profile = await PlayerProfile.findOne({
      where: { userId: otherId, isDeleted: false },
      include: [
        {
          model: User,
          as: 'user',
          attributes: USER_ATTRIBUTES,
          where: { isDeleted: false },
          required: true,
        },
      ],
    });

    if (!profile) {
      throw new AppError('No encontramos ese match.', 404);
    }

    return toMatchView(connection, profile);
  }

  async archiveMatch(viewerId, connectionId) {
    const connection = await DuoConnection.findOne({
      where: {
        id: connectionId,
        status: 'active',
        [Op.or]: [{ userLowId: viewerId }, { userHighId: viewerId }],
      },
    });

    if (!connection) {
      throw new AppError('No encontramos ese match.', 404);
    }

    await connection.update({
      status: 'archived',
      archivedAt: new Date(),
      archivedBy: viewerId,
    });

    return connection;
  }
}

export const matchingService = new MatchingService();
export { toLikeView, toConnectionView };

import { Op } from 'sequelize';
import { RANK_TIER_INDEX } from '@duo-las/shared';
import sequelize from '../../config/database/database.js';
import DuoPost from './duoPost.model.js';
import PostApplication from './postApplication.model.js';
import AvailabilitySession from '../availability/availability.model.js';
import PlayerProfile from '../profiles/profile.model.js';
import User from '../auth/auth.model.js';
import DuoConnection from '../matching/duoConnection.model.js';
import { toPublicProfile } from '../profiles/profile.service.js';
import { blockService } from '../trust/block.service.js';
import { connectionService } from '../matching/connection.service.js';
import { notificationService } from '../notifications/notification.service.js';
import { metricsService } from '../metrics/metrics.service.js';
import { AppError } from '../../errors/appError.js';
import { computePostFitScore, rankIndexForQueue } from '../matching/matching.utils.js';

const APEX_TIERS = ['master', 'grandmaster', 'challenger'];
const MAX_ACTIVE_POSTS = 3;
const MAX_PENDING_APPLICATIONS = 10;
const POST_TTL_MS = 2 * 60 * 60 * 1000;
const SUGGESTION_LIMIT = 20;

const USER_ATTRIBUTES = [
  'id',
  'username',
  'role',
  'status',
  'emailVerified',
  'lastActiveAt',
  'createdAt',
];
const ACTIVE_USER_WHERE = { isDeleted: false, status: 'active', emailVerified: true };

const queueLabel = (queue) => (queue === 'flex' ? 'Flex' : 'Solo/Dúo');

const rankRange = (minTier, maxTier) => {
  const minTierIndex = RANK_TIER_INDEX[minTier];
  const maxTierIndex = RANK_TIER_INDEX[maxTier];

  return {
    rankMinIndex: minTierIndex * 4,
    rankMaxIndex: maxTierIndex * 4 + (APEX_TIERS.includes(maxTier) ? 0 : 3),
  };
};

const toPostView = (post, ownerProfile, viewerId, extras = {}) => ({
  id: post.id,
  queue: post.queue,
  rolesNeeded: post.rolesNeeded,
  rankMinTier: post.rankMinTier,
  rankMaxTier: post.rankMaxTier,
  rankMinIndex: post.rankMinIndex,
  rankMaxIndex: post.rankMaxIndex,
  note: post.note,
  status: post.status,
  expiresAt: post.expiresAt,
  createdAt: post.createdAt,
  isMine: post.ownerId === viewerId,
  owner: ownerProfile ? toPublicProfile(ownerProfile, ownerProfile.user) : null,
  applicationsCount: extras.applicationsCount ?? 0,
  pendingApplicationsCount: extras.pendingApplicationsCount ?? 0,
  myApplicationStatus: extras.myApplicationStatus ?? null,
});

export class DuoPostService {
  async expireOldPosts() {
    await DuoPost.update(
      { status: 'expired' },
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
      throw new AppError('Completá tu perfil antes de usar Busco 1.', 403);
    }

    return profile;
  }

  async getProfilesByUserIds(userIds) {
    if (!userIds.length) return new Map();

    const profiles = await PlayerProfile.findAll({
      where: {
        userId: { [Op.in]: userIds },
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

    return new Map(profiles.map((profile) => [profile.userId, profile]));
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

  async getExcludedIds(userId) {
    const [blockedIds, connectionIds] = await Promise.all([
      blockService.getBlockedIds(userId),
      this.getActiveConnectionIds(userId),
    ]);

    return new Set([...blockedIds, ...connectionIds]);
  }

  async notifySuggestions(post, ownerId) {
    const owner = await User.findByPk(ownerId, { attributes: ['id', 'username'] });
    const excluded = await this.getExcludedIds(ownerId);

    const sessions = await AvailabilitySession.findAll({
      where: {
        status: 'active',
        expiresAt: { [Op.gt]: new Date() },
        queue: post.queue,
        userId: { [Op.ne]: ownerId },
      },
      limit: 100,
    });

    if (!sessions.length) return;

    const profilesByUser = await this.getProfilesByUserIds(
      sessions.map((session) => session.userId)
    );

    const suggested = [];

    for (const session of sessions) {
      if (excluded.has(session.userId)) continue;
      const roleMatches =
        session.roles.includes('fill') ||
        post.rolesNeeded.includes('fill') ||
        session.roles.some((role) => post.rolesNeeded.includes(role));
      if (!roleMatches) continue;

      const profile = profilesByUser.get(session.userId);
      if (!profile) continue;
      const candidateRankIndex = rankIndexForQueue(profile, post.queue);
      if (
        candidateRankIndex === null ||
        candidateRankIndex < post.rankMinIndex ||
        candidateRankIndex > post.rankMaxIndex
      ) {
        continue;
      }

      suggested.push(session.userId);
      if (suggested.length >= SUGGESTION_LIMIT) break;
    }

    for (const userId of suggested) {
      await notificationService.create({
        userId,
        type: 'post_suggested',
        title: 'Hay un Busco 1 compatible',
        message: `${owner?.username || 'Un jugador'} busca ${post.rolesNeeded.join('/')} para ${queueLabel(post.queue)}.`,
        data: { postId: post.id, url: '/busco-1' },
      });
    }
  }

  async create(ownerId, data) {
    await this.expireOldPosts();

    const range = rankRange(data.rankMinTier, data.rankMaxTier);

    let post;

    try {
      post = await sequelize.transaction(async (transaction) => {
        const activeCount = await DuoPost.count({
          where: { ownerId, status: 'active' },
          transaction,
        });

        if (activeCount >= MAX_ACTIVE_POSTS) {
          throw new AppError('Ya tenés 3 publicaciones activas.', 409);
        }

        const sameQueue = await DuoPost.findOne({
          where: { ownerId, queue: data.queue, status: 'active' },
          transaction,
        });

        if (sameQueue) {
          throw new AppError('Ya tenés una publicación activa para esa cola.', 409);
        }

        const post = await DuoPost.create(
          {
            ownerId,
            queue: data.queue,
            rolesNeeded: data.rolesNeeded,
            rankMinTier: data.rankMinTier,
            rankMaxTier: data.rankMaxTier,
            rankMinIndex: range.rankMinIndex,
            rankMaxIndex: range.rankMaxIndex,
            note: data.note?.trim() || null,
            status: 'active',
            expiresAt: new Date(Date.now() + POST_TTL_MS),
          },
          { transaction }
        );

        void metricsService.track('post_created', ownerId, {
          postId: post.id,
          queue: post.queue,
          rolesNeeded: post.rolesNeeded,
        });

        return post;
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Ya tenés una publicación activa para esa cola.', 409);
      }
      throw error;
    }

    await this.notifySuggestions(post, ownerId);

    return post;
  }

  async list(viewerId, { queue, role, limit }) {
    await this.expireOldPosts();

    const excluded = await this.getExcludedIds(viewerId);
    excluded.add(viewerId);

    const where = {
      status: 'active',
      expiresAt: { [Op.gt]: new Date() },
      ownerId: { [Op.notIn]: [...excluded] },
    };

    if (queue) where.queue = queue;

    const posts = await DuoPost.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    if (!posts.length) return [];

    const profilesByUser = await this.getProfilesByUserIds([
      ...new Set(posts.map((post) => post.ownerId)),
    ]);

    const myApplications = await PostApplication.findAll({
      where: {
        applicantId: viewerId,
        postId: { [Op.in]: posts.map((post) => post.id) },
      },
      attributes: ['postId', 'status'],
    });

    const myApplicationByPost = new Map(
      myApplications.map((application) => [application.postId, application.status])
    );

    return posts
      .filter(
        (post) => !role || post.rolesNeeded.includes(role) || post.rolesNeeded.includes('fill')
      )
      .map((post) => {
        const ownerProfile = profilesByUser.get(post.ownerId);
        if (!ownerProfile) return null;

        return toPostView(post, ownerProfile, viewerId, {
          myApplicationStatus: myApplicationByPost.get(post.id) || null,
        });
      })
      .filter(Boolean)
      .slice(0, limit);
  }

  async getMine(ownerId) {
    await this.expireOldPosts();

    const posts = await DuoPost.findAll({
      where: { ownerId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    if (!posts.length) return [];

    const ownerProfile = await this.getViewerProfile(ownerId);
    ownerProfile.user = await User.findByPk(ownerId, { attributes: USER_ATTRIBUTES });

    const applications = await PostApplication.findAll({
      where: { postId: { [Op.in]: posts.map((post) => post.id) } },
      attributes: ['postId', 'status'],
    });

    const counts = new Map();
    for (const application of applications) {
      const current = counts.get(application.postId) || { total: 0, pending: 0 };
      current.total += 1;
      if (application.status === 'pending') current.pending += 1;
      counts.set(application.postId, current);
    }

    return posts.map((post) => {
      const count = counts.get(post.id) || { total: 0, pending: 0 };
      return toPostView(post, ownerProfile, ownerId, {
        applicationsCount: count.total,
        pendingApplicationsCount: count.pending,
      });
    });
  }

  async getDetail(viewerId, postId) {
    await this.expireOldPosts();

    const post = await DuoPost.findByPk(postId);
    if (!post) {
      throw new AppError('No encontramos esa publicación.', 404);
    }

    if (post.status !== 'active' && post.ownerId !== viewerId) {
      throw new AppError('No encontramos esa publicación.', 404);
    }

    const profilesByUser = await this.getProfilesByUserIds([post.ownerId]);
    const ownerProfile = profilesByUser.get(post.ownerId);

    if (!ownerProfile) {
      throw new AppError('No encontramos esa publicación.', 404);
    }

    const myApplication = await PostApplication.findOne({
      where: { postId: post.id, applicantId: viewerId },
      attributes: ['status'],
    });

    return toPostView(post, ownerProfile, viewerId, {
      myApplicationStatus: myApplication?.status || null,
    });
  }

  async apply(applicantId, postId, { message }) {
    await this.expireOldPosts();

    const post = await DuoPost.findByPk(postId);

    if (!post || post.status !== 'active') {
      throw new AppError('Esa publicación ya no está activa.', 409);
    }

    if (post.ownerId === applicantId) {
      throw new AppError('No podés postularte a tu propia publicación.', 400);
    }

    if (await blockService.isBlockedEither(applicantId, post.ownerId)) {
      throw new AppError('No podés interactuar con este usuario.', 403);
    }

    const existingConnection = await DuoConnection.findOne({
      where: {
        status: 'active',
        [Op.or]: [
          { userLowId: applicantId, userHighId: post.ownerId },
          { userLowId: post.ownerId, userHighId: applicantId },
        ],
      },
    });

    if (existingConnection) {
      throw new AppError('Ya tienen un match activo.', 409);
    }

    const applicant = await this.getViewerProfile(applicantId);

    const applicantRankIndex = rankIndexForQueue(applicant, post.queue);
    if (
      applicantRankIndex === null ||
      applicantRankIndex < post.rankMinIndex ||
      applicantRankIndex > post.rankMaxIndex
    ) {
      throw new AppError('Tu rango no entra en el rango pedido por la publicación.', 422);
    }

    const roleCompatible =
      post.rolesNeeded.includes('fill') ||
      applicant.primaryRole === 'fill' ||
      applicant.secondaryRole === 'fill' ||
      post.rolesNeeded.includes(applicant.primaryRole) ||
      post.rolesNeeded.includes(applicant.secondaryRole);

    if (!roleCompatible) {
      throw new AppError('Tu rol no es compatible con la publicación.', 422);
    }

    const existing = await PostApplication.findOne({
      where: { postId: post.id, applicantId },
    });

    if (existing) {
      throw new AppError('Ya te postulaste a esta publicación.', 409);
    }

    const pendingCount = await PostApplication.count({
      where: { postId: post.id, status: 'pending' },
    });

    if (pendingCount >= MAX_PENDING_APPLICATIONS) {
      throw new AppError('La publicación ya tiene el máximo de postulaciones pendientes.', 409);
    }

    let application;

    try {
      application = await PostApplication.create({
        postId: post.id,
        applicantId,
        message: message?.trim() || null,
        status: 'pending',
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Ya te postulaste a esta publicación.', 409);
      }
      throw error;
    }

    const user = await User.findByPk(applicantId, { attributes: ['id', 'username'] });

    await notificationService.create({
      userId: post.ownerId,
      type: 'application_received',
      title: 'Nueva postulación',
      message: `${user?.username || 'Un jugador'} se postuló a tu Busco 1.`,
      data: {
        postId: post.id,
        applicationId: application.id,
        url: '/busco-1',
      },
    });

    void metricsService.track('application_sent', applicantId, {
      postId: post.id,
      applicationId: application.id,
    });

    return application;
  }

  async getApplications(ownerId, postId) {
    const post = await DuoPost.findByPk(postId);

    if (!post) {
      throw new AppError('No encontramos esa publicación.', 404);
    }

    if (post.ownerId !== ownerId) {
      throw new AppError('No tenés permisos para ver esas postulaciones.', 403);
    }

    const ownerProfile = await this.getViewerProfile(ownerId);
    const applications = await PostApplication.findAll({
      where: { postId: post.id },
      order: [['createdAt', 'ASC']],
      limit: 50,
    });

    const profilesByUser = await this.getProfilesByUserIds([
      ...new Set(applications.map((application) => application.applicantId)),
    ]);

    return applications
      .map((application) => {
        const profile = profilesByUser.get(application.applicantId);
        if (!profile) return null;

        const fit = computePostFitScore(profile, post, ownerProfile);

        return {
          id: application.id,
          message: application.message,
          status: application.status,
          createdAt: application.createdAt,
          applicant: toPublicProfile(profile, profile.user),
          score: fit.score,
          breakdown: fit.breakdown,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }

  async acceptApplication(ownerId, postId, applicationId) {
    await this.expireOldPosts();

    const post = await DuoPost.findOne({ where: { id: postId, ownerId } });

    if (!post) {
      throw new AppError('No encontramos esa publicación.', 404);
    }

    if (post.status !== 'active') {
      throw new AppError('Esa publicación ya no está activa.', 409);
    }

    const application = await PostApplication.findOne({
      where: { id: applicationId, postId, status: 'pending' },
    });

    if (!application) {
      throw new AppError('No encontramos esa postulación pendiente.', 404);
    }

    const applicantProfiles = await this.getProfilesByUserIds([application.applicantId]);
    const applicant = applicantProfiles.get(application.applicantId);

    if (!applicant) {
      throw new AppError('El postulante ya no está disponible.', 404);
    }

    if (await blockService.isBlockedEither(ownerId, application.applicantId)) {
      throw new AppError('No podés aceptar esta postulación.', 403);
    }

    const result = await sequelize.transaction(async (transaction) => {
      const lockedPost = await DuoPost.findOne({
        where: { id: postId, ownerId, status: 'active' },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!lockedPost) {
        throw new AppError('Esa publicación ya fue resuelta.', 409);
      }

      const lockedApplication = await PostApplication.findOne({
        where: { id: applicationId, postId, status: 'pending' },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!lockedApplication) {
        throw new AppError('Esa postulación ya fue resuelta.', 409);
      }

      await lockedApplication.update({ status: 'accepted' }, { transaction });
      await lockedPost.update({ status: 'filled' }, { transaction });

      const rejected = await PostApplication.findAll({
        where: {
          postId,
          status: 'pending',
          id: { [Op.ne]: applicationId },
        },
        transaction,
      });

      if (rejected.length) {
        await PostApplication.update(
          { status: 'rejected' },
          {
            where: { id: { [Op.in]: rejected.map((item) => item.id) } },
            transaction,
          }
        );
      }

      const { connection } = await connectionService.createConnection({
        userIds: [ownerId, lockedApplication.applicantId],
        source: 'post',
        transaction,
      });

      await metricsService.track(
        'application_accepted',
        ownerId,
        {
          postId,
          applicationId,
          connectionId: connection.id,
        },
        transaction
      );

      await notificationService.create(
        {
          userId: lockedApplication.applicantId,
          type: 'application_accepted',
          title: 'Postulación aceptada',
          message: 'Te aceptaron en un Busco 1. Ya pueden coordinar.',
          data: {
            postId,
            applicationId,
            connectionId: connection.id,
            url: '/matches',
          },
        },
        transaction
      );

      for (const item of rejected) {
        await notificationService.create(
          {
            userId: item.applicantId,
            type: 'application_rejected',
            title: 'Postulación rechazada',
            message: 'La publicación se llenó con otro jugador.',
            data: { postId, applicationId: item.id, url: '/busco-1' },
          },
          transaction
        );
      }

      return connection;
    });

    return {
      connection: result,
      contact: {
        riotId: applicant.riotId,
        discordTag: applicant.discordTag,
      },
    };
  }

  async rejectApplication(ownerId, postId, applicationId) {
    const post = await DuoPost.findOne({ where: { id: postId, ownerId } });

    if (!post) {
      throw new AppError('No encontramos esa publicación.', 404);
    }

    const application = await PostApplication.findOne({
      where: { id: applicationId, postId, status: 'pending' },
    });

    if (!application) {
      throw new AppError('No encontramos esa postulación pendiente.', 404);
    }

    await application.update({ status: 'rejected' });

    await notificationService.create({
      userId: application.applicantId,
      type: 'application_rejected',
      title: 'Postulación rechazada',
      message: 'Tu postulación a un Busco 1 fue rechazada.',
      data: { postId, applicationId, url: '/busco-1' },
    });

    return application;
  }

  async withdrawApplication(applicantId, postId, applicationId) {
    const application = await PostApplication.findOne({
      where: { id: applicationId, postId, applicantId },
    });

    if (!application) {
      throw new AppError('No encontramos esa postulación.', 404);
    }

    if (application.status !== 'pending') {
      throw new AppError('Esa postulación ya fue resuelta.', 409);
    }

    const post = await DuoPost.findByPk(postId);
    if (!post) {
      throw new AppError('No encontramos esa publicación.', 404);
    }

    await application.update({ status: 'withdrawn' });

    await notificationService.create({
      userId: post.ownerId,
      type: 'application_withdrawn',
      title: 'Postulación retirada',
      message: 'Un jugador retiró su postulación a tu Busco 1.',
      data: { postId, applicationId, url: '/busco-1' },
    });

    return application;
  }

  async cancel(ownerId, postId) {
    const post = await DuoPost.findOne({ where: { id: postId, ownerId } });

    if (!post) {
      throw new AppError('No encontramos esa publicación.', 404);
    }

    if (post.status === 'active') {
      await post.update({ status: 'cancelled' });
    }

    return post;
  }
}

export const duoPostService = new DuoPostService();

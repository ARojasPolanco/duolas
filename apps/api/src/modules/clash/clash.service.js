import { Op } from 'sequelize';
import { CLASH_EVENT_ENDS_AT, RANK_TIER_INDEX } from '@duo-las/shared';
import sequelize from '../../config/database/database.js';
import ClashPost from './clashPost.model.js';
import ClashApplication from './clashApplication.model.js';
import User from '../auth/auth.model.js';
import PlayerProfile from '../profiles/profile.model.js';
import { toPublicProfile } from '../profiles/profile.service.js';
import { blockService } from '../trust/block.service.js';
import { connectionService } from '../matching/connection.service.js';
import { notificationService } from '../notifications/notification.service.js';
import { metricsService } from '../metrics/metrics.service.js';
import { rankIndexForQueue } from '../matching/matching.utils.js';
import { AppError } from '../../errors/appError.js';

const APEX_TIERS = ['master', 'grandmaster', 'challenger'];
const MAX_ACTIVE_POSTS = 2;
const MAX_PENDING_APPLICATIONS = 20;
const EVENT_END = new Date(CLASH_EVENT_ENDS_AT);

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

const rankRange = (minTier, maxTier) => ({
  rankMinIndex: RANK_TIER_INDEX[minTier] * 4,
  rankMaxIndex: RANK_TIER_INDEX[maxTier] * 4 + (APEX_TIERS.includes(maxTier) ? 0 : 3),
});

const roleLabel = (role) =>
  ({ top: 'Top', jungle: 'Jungla', mid: 'Mid', adc: 'ADC', support: 'Support' })[role] || role;

const toApplicationView = (application) => ({
  id: application.id,
  role: application.role,
  message: application.message,
  status: application.status,
  createdAt: application.createdAt,
});

const toPostView = (post, ownerProfile, members, viewerId, extras = {}) => {
  const filledRoles = new Set(members.map((member) => member.role));
  const rolesRemaining = post.rolesNeeded.filter((role) => !filledRoles.has(role));

  return {
    id: post.id,
    teamName: post.teamName,
    day: post.day,
    captainRole: post.captainRole,
    rolesNeeded: post.rolesNeeded,
    rolesRemaining,
    rankMinTier: post.rankMinTier,
    rankMaxTier: post.rankMaxTier,
    note: post.note,
    status: post.status,
    expiresAt: post.expiresAt,
    createdAt: post.createdAt,
    isMine: post.ownerId === viewerId,
    owner: ownerProfile ? toPublicProfile(ownerProfile, ownerProfile.user) : null,
    members: members.map((member) => ({
      role: member.role,
      acceptedAt: member.acceptedAt,
      profile: toPublicProfile(member.profile, member.profile.user),
    })),
    teamSize: members.length + 1,
    maxSize: post.rolesNeeded.length + 1,
    applicationsCount: extras.applicationsCount ?? 0,
    pendingApplicationsCount: extras.pendingApplicationsCount ?? 0,
    myApplicationStatus: extras.myApplicationStatus ?? null,
  };
};

export class ClashService {
  async expireOldPosts() {
    await ClashPost.update(
      { status: 'expired' },
      {
        where: {
          status: 'active',
          expiresAt: { [Op.lte]: new Date() },
        },
      }
    );
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

  async getAcceptedMembers(postIds) {
    if (!postIds.length) return new Map();

    const applications = await ClashApplication.findAll({
      where: { postId: { [Op.in]: postIds }, status: 'accepted' },
      order: [['updatedAt', 'ASC']],
    });
    const profilesByUser = await this.getProfilesByUserIds([
      ...new Set(applications.map((application) => application.applicantId)),
    ]);
    const byPost = new Map();

    for (const application of applications) {
      const profile = profilesByUser.get(application.applicantId);
      if (!profile) continue;
      const list = byPost.get(application.postId) || [];
      list.push({
        role: application.role,
        acceptedAt: application.updatedAt,
        profile,
      });
      byPost.set(application.postId, list);
    }

    return byPost;
  }

  async getMyApplicationMap(applicantId, postIds) {
    if (!postIds.length) return new Map();
    const applications = await ClashApplication.findAll({
      where: { applicantId, postId: { [Op.in]: postIds } },
      attributes: ['postId', 'status'],
    });
    return new Map(applications.map((application) => [application.postId, application.status]));
  }

  async list(viewerId, { day, role, limit }) {
    await this.expireOldPosts();

    const blockedIds = await blockService.getBlockedIds(viewerId);
    const where = {
      status: 'active',
      expiresAt: { [Op.gt]: new Date() },
    };
    if (blockedIds.length) where.ownerId = { [Op.notIn]: blockedIds };
    if (day && day !== 'both') {
      where.day = { [Op.in]: [day, 'both'] };
    }
    if (role) {
      where.rolesNeeded = { [Op.contains]: [role] };
    }

    const posts = await ClashPost.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
    if (!posts.length) return [];

    const [profilesByUser, membersByPost, myApplications, applications] = await Promise.all([
      this.getProfilesByUserIds([...new Set(posts.map((post) => post.ownerId))]),
      this.getAcceptedMembers(posts.map((post) => post.id)),
      this.getMyApplicationMap(
        viewerId,
        posts.map((post) => post.id)
      ),
      ClashApplication.findAll({
        where: { postId: { [Op.in]: posts.map((post) => post.id) } },
        attributes: ['postId', 'status'],
      }),
    ]);

    const counts = new Map();
    for (const application of applications) {
      const current = counts.get(application.postId) || { total: 0, pending: 0 };
      current.total += 1;
      if (application.status === 'pending') current.pending += 1;
      counts.set(application.postId, current);
    }

    return posts
      .map((post) => {
        const ownerProfile = profilesByUser.get(post.ownerId);
        if (!ownerProfile) return null;
        const count = counts.get(post.id) || { total: 0, pending: 0 };
        return toPostView(post, ownerProfile, membersByPost.get(post.id) || [], viewerId, {
          myApplicationStatus: myApplications.get(post.id) || null,
          applicationsCount: count.total,
          pendingApplicationsCount: count.pending,
        });
      })
      .filter(Boolean)
      .slice(0, limit);
  }

  async getDetail(viewerId, postId) {
    await this.expireOldPosts();
    const post = await ClashPost.findByPk(postId);
    if (!post) throw new AppError('No encontramos ese equipo Clash.', 404);
    if (post.status !== 'active' && post.ownerId !== viewerId) {
      throw new AppError('No encontramos ese equipo Clash.', 404);
    }

    const [profilesByUser, membersByPost, myApplication] = await Promise.all([
      this.getProfilesByUserIds([post.ownerId]),
      this.getAcceptedMembers([post.id]),
      ClashApplication.findOne({
        where: { postId: post.id, applicantId: viewerId },
        attributes: ['status'],
      }),
    ]);
    const ownerProfile = profilesByUser.get(post.ownerId);
    if (!ownerProfile) throw new AppError('No encontramos ese equipo Clash.', 404);

    return toPostView(post, ownerProfile, membersByPost.get(post.id) || [], viewerId, {
      myApplicationStatus: myApplication?.status || null,
    });
  }

  async create(ownerId, data) {
    await this.expireOldPosts();
    if (EVENT_END <= new Date()) {
      throw new AppError('El evento Clash ya terminó.', 409);
    }

    const range = rankRange(data.rankMinTier, data.rankMaxTier);

    try {
      return await sequelize.transaction(async (transaction) => {
        const activeCount = await ClashPost.count({
          where: { ownerId, status: 'active' },
          transaction,
        });
        if (activeCount >= MAX_ACTIVE_POSTS) {
          throw new AppError(`Ya tenés ${MAX_ACTIVE_POSTS} equipos Clash activos.`, 409);
        }

        const post = await ClashPost.create(
          {
            ownerId,
            teamName: data.teamName,
            day: data.day,
            captainRole: data.captainRole,
            rolesNeeded: data.rolesNeeded,
            rankMinTier: data.rankMinTier,
            rankMaxTier: data.rankMaxTier,
            ...range,
            note: data.note?.trim() || null,
            status: 'active',
            expiresAt: EVENT_END,
          },
          { transaction }
        );

        void metricsService.track('clash_post_created', ownerId, {
          postId: post.id,
          day: post.day,
          rolesNeeded: post.rolesNeeded,
        });

        return post;
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Ya tenés un equipo Clash activo.', 409);
      }
      throw error;
    }
  }

  async apply(applicantId, postId, { role, message }) {
    await this.expireOldPosts();
    const post = await ClashPost.findByPk(postId);

    if (!post || post.status === 'expired') {
      throw new AppError('Ese equipo Clash ya no está disponible.', 409);
    }
    if (post.status !== 'active') {
      throw new AppError('Ese equipo Clash ya está completo o cerrado.', 409);
    }
    if (post.ownerId === applicantId) {
      throw new AppError('No podés postularte a tu propio equipo.', 400);
    }
    if (!post.rolesNeeded.includes(role)) {
      throw new AppError('Ese rol ya no está disponible en el equipo.', 409);
    }
    if (await blockService.isBlockedEither(applicantId, post.ownerId)) {
      throw new AppError('No podés interactuar con este usuario.', 403);
    }

    const acceptedForRole = await ClashApplication.count({
      where: { postId: post.id, role, status: 'accepted' },
    });
    if (acceptedForRole > 0) {
      throw new AppError('Ese rol ya está cubierto por otro jugador.', 409);
    }

    const profilesByUser = await this.getProfilesByUserIds([applicantId]);
    const applicant = profilesByUser.get(applicantId);
    if (!applicant) throw new AppError('Completá tu perfil antes de postularte.', 403);

    const rankIndex = rankIndexForQueue(applicant, 'solo_duo');
    if (rankIndex !== null && (rankIndex < post.rankMinIndex || rankIndex > post.rankMaxIndex)) {
      throw new AppError('Tu rango no entra en el rango que busca el equipo.', 422);
    }

    const existing = await ClashApplication.findOne({
      where: { postId: post.id, applicantId },
    });
    if (existing) {
      throw new AppError('Ya te postulaste a este equipo.', 409);
    }

    const pendingCount = await ClashApplication.count({
      where: { postId: post.id, status: 'pending' },
    });
    if (pendingCount >= MAX_PENDING_APPLICATIONS) {
      throw new AppError('El equipo ya tiene el máximo de postulaciones pendientes.', 409);
    }

    let application;
    try {
      application = await ClashApplication.create({
        postId: post.id,
        applicantId,
        role,
        message: message?.trim() || null,
        status: 'pending',
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Ya te postulaste a este equipo.', 409);
      }
      throw error;
    }

    const user = await User.findByPk(applicantId, { attributes: ['id', 'username'] });
    await notificationService.create({
      userId: post.ownerId,
      type: 'application_received',
      title: 'Nueva postulación Clash',
      message: `${user?.username || 'Un jugador'} quiere jugar como ${roleLabel(role)} en ${post.teamName}.`,
      data: { postId: post.id, applicationId: application.id, url: '/clash' },
    });

    void metricsService.track('clash_application_sent', applicantId, {
      postId: post.id,
      applicationId: application.id,
    });

    return application;
  }

  async getApplications(ownerId, postId) {
    const post = await ClashPost.findByPk(postId);
    if (!post) throw new AppError('No encontramos ese equipo Clash.', 404);
    if (post.ownerId !== ownerId) {
      throw new AppError('No tenés permisos para ver esas postulaciones.', 403);
    }

    const applications = await ClashApplication.findAll({
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
        return {
          ...toApplicationView(application),
          applicant: toPublicProfile(profile, profile.user),
          contact:
            application.status === 'accepted'
              ? {
                  riotId: profile.riotId,
                  discordTag: profile.discordTag,
                  whatsapp: profile.whatsapp,
                }
              : null,
        };
      })
      .filter(Boolean);
  }

  async acceptApplication(ownerId, postId, applicationId) {
    await this.expireOldPosts();

    const result = await sequelize.transaction(async (transaction) => {
      const post = await ClashPost.findOne({
        where: { id: postId, ownerId, status: 'active' },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });
      if (!post) throw new AppError('Ese equipo Clash ya no está activo.', 409);

      const application = await ClashApplication.findOne({
        where: { id: applicationId, postId, status: 'pending' },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });
      if (!application) throw new AppError('No encontramos esa postulación pendiente.', 404);

      const acceptedForRole = await ClashApplication.count({
        where: { postId, role: application.role, status: 'accepted' },
        transaction,
      });
      if (acceptedForRole > 0) {
        throw new AppError('Ese rol ya está cubierto por otro jugador.', 409);
      }

      if (await blockService.isBlockedEither(ownerId, application.applicantId)) {
        throw new AppError('No podés aceptar esta postulación.', 403);
      }

      await application.update({ status: 'accepted' }, { transaction });

      const acceptedCount = await ClashApplication.count({
        where: { postId, status: 'accepted' },
        transaction,
      });
      const isFull = acceptedCount >= post.rolesNeeded.length;
      if (isFull) await post.update({ status: 'filled' }, { transaction });

      const { connection } = await connectionService.createConnection({
        userIds: [ownerId, application.applicantId],
        source: 'clash',
        transaction,
        notify: false,
      });

      const rejected = isFull
        ? await ClashApplication.findAll({
            where: { postId, status: 'pending', id: { [Op.ne]: applicationId } },
            transaction,
          })
        : [];
      if (rejected.length) {
        await ClashApplication.update(
          { status: 'rejected' },
          { where: { id: { [Op.in]: rejected.map((item) => item.id) } }, transaction }
        );
      }

      await notificationService.create(
        {
          userId: application.applicantId,
          type: 'application_accepted',
          title: 'Te sumaron a un equipo Clash',
          message: `${post.teamName} te aceptó como ${roleLabel(application.role)}. Ya pueden coordinar por Matches.`,
          data: { postId, applicationId, connectionId: connection.id, url: '/matches' },
        },
        transaction
      );

      for (const item of rejected) {
        await notificationService.create(
          {
            userId: item.applicantId,
            type: 'application_rejected',
            title: 'Equipo Clash completo',
            message: `${post.teamName} ya completó su equipo.`,
            data: { postId, applicationId: item.id, url: '/clash' },
          },
          transaction
        );
      }

      await metricsService.track(
        'clash_application_accepted',
        ownerId,
        { postId, applicationId, connectionId: connection.id },
        transaction
      );

      return { connection, isFull };
    });

    return { connection: result.connection, isFull: result.isFull };
  }

  async rejectApplication(ownerId, postId, applicationId) {
    const post = await ClashPost.findOne({ where: { id: postId, ownerId } });
    if (!post) throw new AppError('No encontramos ese equipo Clash.', 404);

    const application = await ClashApplication.findOne({
      where: { id: applicationId, postId, status: 'pending' },
    });
    if (!application) throw new AppError('No encontramos esa postulación pendiente.', 404);

    await application.update({ status: 'rejected' });
    await notificationService.create({
      userId: application.applicantId,
      type: 'application_rejected',
      title: 'Postulación Clash rechazada',
      message: `${post.teamName} no te sumó al equipo.`,
      data: { postId, applicationId, url: '/clash' },
    });
    return application;
  }

  async withdrawApplication(applicantId, postId, applicationId) {
    const application = await ClashApplication.findOne({
      where: { id: applicationId, postId, applicantId },
    });
    if (!application) throw new AppError('No encontramos esa postulación.', 404);
    if (application.status !== 'pending') {
      throw new AppError('Esa postulación ya fue resuelta.', 409);
    }

    const post = await ClashPost.findByPk(postId);
    if (!post) throw new AppError('No encontramos ese equipo Clash.', 404);

    await application.update({ status: 'withdrawn' });
    await notificationService.create({
      userId: post.ownerId,
      type: 'application_withdrawn',
      title: 'Postulación Clash retirada',
      message: 'Un jugador retiró su postulación a tu equipo Clash.',
      data: { postId, applicationId, url: '/clash' },
    });
    return application;
  }

  async cancel(ownerId, postId) {
    const post = await ClashPost.findOne({ where: { id: postId, ownerId } });
    if (!post) throw new AppError('No encontramos ese equipo Clash.', 404);
    if (post.status === 'active') await post.update({ status: 'cancelled' });

    const accepted = await ClashApplication.findAll({
      where: { postId, status: 'accepted' },
    });
    for (const application of accepted) {
      await notificationService.create({
        userId: application.applicantId,
        type: 'application_rejected',
        title: 'Equipo Clash cancelado',
        message: `${post.teamName} canceló la búsqueda de equipo.`,
        data: { postId, url: '/clash' },
      });
    }

    return post;
  }

  async getMine(ownerId) {
    await this.expireOldPosts();
    const posts = await ClashPost.findAll({
      where: { ownerId },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    if (!posts.length) return [];

    const [profilesByUser, membersByPost, applications] = await Promise.all([
      this.getProfilesByUserIds([ownerId]),
      this.getAcceptedMembers(posts.map((post) => post.id)),
      ClashApplication.findAll({
        where: { postId: { [Op.in]: posts.map((post) => post.id) } },
        attributes: ['postId', 'status'],
      }),
    ]);
    const ownerProfile = profilesByUser.get(ownerId);
    if (!ownerProfile) return [];

    const counts = new Map();
    for (const application of applications) {
      const current = counts.get(application.postId) || { total: 0, pending: 0 };
      current.total += 1;
      if (application.status === 'pending') current.pending += 1;
      counts.set(application.postId, current);
    }

    return posts.map((post) => {
      const count = counts.get(post.id) || { total: 0, pending: 0 };
      return toPostView(post, ownerProfile, membersByPost.get(post.id) || [], ownerId, {
        applicationsCount: count.total,
        pendingApplicationsCount: count.pending,
      });
    });
  }

  async getMyApplications(applicantId) {
    await this.expireOldPosts();
    const applications = await ClashApplication.findAll({
      where: { applicantId },
      order: [['createdAt', 'DESC']],
      limit: 30,
      include: [{ model: ClashPost, as: 'post', required: true }],
    });
    if (!applications.length) return [];

    const postIds = [...new Set(applications.map((application) => application.postId))];
    const posts = await ClashPost.findAll({ where: { id: { [Op.in]: postIds } } });
    const postsById = new Map(posts.map((post) => [post.id, post]));
    const profilesByUser = await this.getProfilesByUserIds([
      ...new Set(posts.map((post) => post.ownerId)),
    ]);

    return applications
      .map((application) => {
        const post = postsById.get(application.postId);
        const ownerProfile = post ? profilesByUser.get(post.ownerId) : null;
        if (!post || !ownerProfile) return null;
        const accepted = application.status === 'accepted';

        return {
          ...toApplicationView(application),
          post: {
            id: post.id,
            teamName: post.teamName,
            day: post.day,
            status: post.status,
            expiresAt: post.expiresAt,
            owner: toPublicProfile(ownerProfile, ownerProfile.user),
          },
          contact: accepted
            ? {
                riotId: ownerProfile.riotId,
                discordTag: ownerProfile.discordTag,
                whatsapp: ownerProfile.whatsapp,
              }
            : null,
        };
      })
      .filter(Boolean);
  }
}

export const clashService = new ClashService();

import { Op } from 'sequelize';
import sequelize from '../../config/database/database.js';
import AramPost from './aramPost.model.js';
import AramApplication from './aramApplication.model.js';
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
const ACTIVE_USER_WHERE = { isDeleted: false, status: 'active', emailVerified: true };
const NOW_TTL_MS = 60 * 60 * 1000;
const TONIGHT_TTL_MS = 6 * 60 * 60 * 1000;

const windowLabel = (value) => (value === 'tonight' ? 'Esta noche' : 'Ahora');

const toPostView = (post, ownerProfile, viewerId, extras = {}) => ({
  id: post.id,
  mode: post.mode,
  playersPresent: post.playersPresent,
  slotsNeeded: post.slotsNeeded,
  window: post.window,
  windowLabel: windowLabel(post.window),
  hasMic: post.hasMic,
  note: post.note,
  status: post.status,
  expiresAt: post.expiresAt,
  createdAt: post.createdAt,
  isMine: post.ownerId === viewerId,
  owner: ownerProfile ? toPublicProfile(ownerProfile, ownerProfile.user) : null,
  pendingApplicationsCount: extras.pendingApplicationsCount ?? 0,
  myApplicationStatus: extras.myApplicationStatus ?? null,
});

const toApplicationView = (application, applicantProfile) => ({
  id: application.id,
  message: application.message,
  status: application.status,
  createdAt: application.createdAt,
  applicant: applicantProfile ? toPublicProfile(applicantProfile, applicantProfile.user) : null,
});

export class AramService {
  async expireDuePosts() {
    await AramPost.update(
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

  async create(userId, data) {
    await this.expireDuePosts();

    const active = await AramPost.findOne({
      where: { ownerId: userId, status: 'active' },
      attributes: ['id'],
    });

    if (active) {
      throw new AppError('Ya tenés una publicación ARAM activa. Cerrala antes de crear otra.', 409);
    }

    const now = new Date();
    const ttl = data.window === 'tonight' ? TONIGHT_TTL_MS : NOW_TTL_MS;

    try {
      const post = await AramPost.create({
        ownerId: userId,
        mode: data.mode,
        playersPresent: data.playersPresent,
        slotsNeeded: data.slotsNeeded,
        window: data.window,
        hasMic: data.hasMic,
        note: data.note?.trim() || null,
        status: 'active',
        expiresAt: new Date(now.getTime() + ttl),
      });

      void metricsService.track('aram_post_created', userId, {
        mode: data.mode,
        playersPresent: data.playersPresent,
        slotsNeeded: data.slotsNeeded,
      });

      const profiles = await this.getProfilesByUserIds([userId]);
      return toPostView(post, profiles.get(userId), userId, {
        pendingApplicationsCount: 0,
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Ya tenés una publicación ARAM activa.', 409);
      }
      throw error;
    }
  }

  async list(userId, { mode, limit }) {
    await this.expireDuePosts();

    const blockedIds = await blockService.getBlockedIds(userId);
    const where = {
      status: 'active',
      expiresAt: { [Op.gt]: new Date() },
      ownerId: { [Op.ne]: userId },
    };

    if (mode) where.mode = mode;
    if (blockedIds.length) where.ownerId[Op.notIn] = blockedIds;

    const posts = await AramPost.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
    });

    if (!posts.length) return [];

    const postIds = posts.map((post) => post.id);
    const applicantProfiles = await this.getProfilesByUserIds(posts.map((post) => post.ownerId));

    const [applications, myApplications] = await Promise.all([
      AramApplication.findAll({
        where: { postId: { [Op.in]: postIds }, status: 'pending' },
        attributes: ['postId'],
        raw: true,
      }),
      AramApplication.findAll({
        where: { postId: { [Op.in]: postIds }, applicantId: userId },
        attributes: ['postId', 'status'],
        raw: true,
      }),
    ]);

    const pendingCount = new Map();
    for (const application of applications) {
      pendingCount.set(application.postId, (pendingCount.get(application.postId) || 0) + 1);
    }

    const myStatus = new Map(
      myApplications.map((application) => [application.postId, application.status])
    );

    return posts
      .map((post) => {
        const profile = applicantProfiles.get(post.ownerId);
        if (!profile) return null;
        return toPostView(post, profile, userId, {
          pendingApplicationsCount: pendingCount.get(post.id) || 0,
          myApplicationStatus: myStatus.get(post.id) || null,
        });
      })
      .filter(Boolean);
  }

  async getMine(userId) {
    await this.expireDuePosts();

    const post = await AramPost.findOne({
      where: {
        ownerId: userId,
        status: 'active',
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    const profiles = await this.getProfilesByUserIds([userId]);
    const ownerProfile = profiles.get(userId);

    let applications = [];
    if (post) {
      const rows = await AramApplication.findAll({
        where: { postId: post.id, status: { [Op.in]: ['pending', 'accepted'] } },
        order: [['createdAt', 'ASC']],
      });

      const applicantProfiles = await this.getProfilesByUserIds(
        rows.map((application) => application.applicantId)
      );

      applications = rows.map((application) => ({
        ...toApplicationView(application, applicantProfiles.get(application.applicantId)),
        applicantId: application.applicantId,
      }));
    }

    const myApplicationRows = await AramApplication.findAll({
      where: { applicantId: userId },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    const postIds = [...new Set(myApplicationRows.map((application) => application.postId))];
    const posts = postIds.length
      ? await AramPost.findAll({ where: { id: { [Op.in]: postIds } } })
      : [];
    const postsById = new Map(posts.map((item) => [item.id, item]));

    const owners = await this.getProfilesByUserIds([...new Set(posts.map((item) => item.ownerId))]);

    const myApplications = myApplicationRows
      .map((application) => {
        const relatedPost = postsById.get(application.postId);
        if (!relatedPost) return null;
        return {
          id: application.id,
          status: application.status,
          message: application.message,
          createdAt: application.createdAt,
          post: toPostView(relatedPost, owners.get(relatedPost.ownerId), userId, {
            myApplicationStatus: application.status,
          }),
        };
      })
      .filter(Boolean);

    return {
      post: post
        ? toPostView(post, ownerProfile, userId, {
            pendingApplicationsCount: applications.filter(
              (application) => application.status === 'pending'
            ).length,
          })
        : null,
      applications,
      myApplications,
    };
  }

  async apply(userId, postId, message) {
    await this.expireDuePosts();

    const post = await AramPost.findOne({
      where: {
        id: postId,
        status: 'active',
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!post) {
      throw new AppError('No encontramos esa publicación ARAM activa.', 404);
    }

    if (post.ownerId === userId) {
      throw new AppError('No podés postularte a tu propia publicación.', 400);
    }

    if (await blockService.isBlockedEither(userId, post.ownerId)) {
      throw new AppError('No podés postularte a esta publicación.', 403);
    }

    const existing = await AramApplication.findOne({
      where: { postId, applicantId: userId },
    });

    if (existing) {
      throw new AppError('Ya te postulaste a esta publicación.', 409);
    }

    const applicant = await User.findByPk(userId, { attributes: ['id', 'username'] });

    try {
      const application = await AramApplication.create({
        postId,
        applicantId: userId,
        message: message?.trim() || null,
        status: 'pending',
      });

      void metricsService.track('aram_application_sent', userId, {
        postId,
        applicationId: application.id,
      });

      await notificationService.create({
        userId: post.ownerId,
        type: 'aram_application_received',
        title: post.mode === 'solo' ? 'Alguien quiere jugar ARAM' : 'Nueva postulación ARAM',
        message: `${applicant?.username || 'Un jugador'} quiere sumarse.`,
        data: { postId, applicationId: application.id, url: '/aram' },
      });

      return application;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Ya te postulaste a esta publicación.', 409);
      }
      throw error;
    }
  }

  async accept(ownerId, postId, applicationId) {
    await this.expireDuePosts();

    return sequelize.transaction(async (transaction) => {
      const post = await AramPost.findOne({
        where: { id: postId, ownerId, status: 'active' },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!post) {
        throw new AppError('No encontramos esa publicación ARAM activa.', 404);
      }

      const application = await AramApplication.findOne({
        where: { id: applicationId, postId, status: 'pending' },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!application) {
        throw new AppError('Esa postulación ya fue resuelta.', 409);
      }

      if (await blockService.isBlockedEither(ownerId, application.applicantId)) {
        throw new AppError('No podés aceptar esta postulación.', 403);
      }

      const remainingSlots = Math.max(0, post.slotsNeeded - 1);

      await application.update({ status: 'accepted' }, { transaction });
      await post.update(
        {
          slotsNeeded: remainingSlots,
          status: remainingSlots === 0 ? 'filled' : 'active',
        },
        { transaction }
      );

      const { connection } = await connectionService.createConnection({
        userIds: [ownerId, application.applicantId],
        source: 'aram',
        transaction,
        closeAvailability: false,
        notify: false,
      });

      await metricsService.track(
        'aram_application_accepted',
        ownerId,
        { postId, applicationId, connectionId: connection.id },
        transaction
      );

      await notificationService.create(
        {
          userId: application.applicantId,
          type: 'aram_application_accepted',
          title: 'Te aceptaron en ARAM',
          message: 'Ya pueden coordinar. El contacto está en Matches.',
          data: { postId, applicationId, connectionId: connection.id, url: '/matches' },
        },
        transaction
      );

      if (remainingSlots === 0) {
        const pending = await AramApplication.findAll({
          where: { postId, status: 'pending', id: { [Op.ne]: applicationId } },
          transaction,
        });

        if (pending.length) {
          await AramApplication.update(
            { status: 'rejected' },
            { where: { id: { [Op.in]: pending.map((item) => item.id) } }, transaction }
          );

          for (const item of pending) {
            await notificationService.create(
              {
                userId: item.applicantId,
                type: 'aram_application_rejected',
                title: 'Postulación ARAM rechazada',
                message: 'El grupo se completó con otro jugador.',
                data: { postId, applicationId: item.id, url: '/aram' },
              },
              transaction
            );
          }
        }
      }

      return { application, connection, remainingSlots };
    });
  }

  async reject(ownerId, postId, applicationId) {
    await this.expireDuePosts();

    const post = await AramPost.findOne({ where: { id: postId, ownerId } });

    if (!post) {
      throw new AppError('No encontramos esa publicación ARAM.', 404);
    }

    const application = await AramApplication.findOne({
      where: { id: applicationId, postId, status: 'pending' },
    });

    if (!application) {
      throw new AppError('No encontramos esa postulación pendiente.', 404);
    }

    await application.update({ status: 'rejected' });

    await notificationService.create({
      userId: application.applicantId,
      type: 'aram_application_rejected',
      title: 'Postulación ARAM rechazada',
      message: 'Tu postulación a ARAM fue rechazada.',
      data: { postId, applicationId, url: '/aram' },
    });

    return application;
  }

  async withdraw(applicantId, postId, applicationId) {
    await this.expireDuePosts();

    const application = await AramApplication.findOne({
      where: { id: applicationId, postId, applicantId, status: 'pending' },
    });

    if (!application) {
      throw new AppError('No encontramos esa postulación pendiente.', 404);
    }

    await application.update({ status: 'withdrawn' });

    const post = await AramPost.findByPk(postId);
    if (post) {
      await notificationService.create({
        userId: post.ownerId,
        type: 'aram_application_withdrawn',
        title: 'Postulación retirada',
        message: 'Un jugador retiró su postulación ARAM.',
        data: { postId, applicationId, url: '/aram' },
      });
    }

    return application;
  }

  async cancel(ownerId, postId) {
    await this.expireDuePosts();

    const post = await AramPost.findOne({
      where: { id: postId, ownerId, status: 'active' },
    });

    if (!post) {
      throw new AppError('No encontramos esa publicación ARAM activa.', 404);
    }

    await post.update({ status: 'cancelled' });

    const pending = await AramApplication.findAll({
      where: { postId, status: 'pending' },
    });

    if (pending.length) {
      await AramApplication.update(
        { status: 'rejected' },
        { where: { id: { [Op.in]: pending.map((item) => item.id) } } }
      );

      for (const item of pending) {
        await notificationService.create({
          userId: item.applicantId,
          type: 'aram_application_rejected',
          title: 'Publicación ARAM cerrada',
          message: 'La publicación se cerró antes de aceptar tu postulación.',
          data: { postId, applicationId: item.id, url: '/aram' },
        });
      }
    }

    return post;
  }
}

export const aramService = new AramService();

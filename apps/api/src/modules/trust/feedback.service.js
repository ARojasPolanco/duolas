import { Op } from 'sequelize';
import sequelize from '../../config/database/database.js';
import Feedback from './feedback.model.js';
import DuoConnection from '../matching/duoConnection.model.js';
import PlayerProfile from '../profiles/profile.model.js';
import User from '../auth/auth.model.js';
import { toPublicProfile } from '../profiles/profile.service.js';
import { notificationService } from '../notifications/notification.service.js';
import { reputationService } from './reputation.service.js';
import { metricsService } from '../metrics/metrics.service.js';
import { AppError } from '../../errors/appError.js';
import {
  FEEDBACK_WINDOW_MS,
  feedbackWindowEndsAt,
  isFeedbackWindowOpen,
  toFeedbackView,
} from './feedback.utils.js';

const USER_ATTRIBUTES = ['id', 'username', 'role', 'status', 'emailVerified', 'createdAt'];

export class FeedbackService {
  async getParticipantConnection(viewerId, connectionId) {
    const connection = await DuoConnection.findOne({
      where: {
        id: connectionId,
        [Op.or]: [{ userLowId: viewerId }, { userHighId: viewerId }],
      },
    });

    if (!connection) {
      throw new AppError('No encontramos esa conexión.', 404);
    }

    return connection;
  }

  otherUserId(connection, viewerId) {
    return connection.userLowId === viewerId ? connection.userHighId : connection.userLowId;
  }

  async notifyRevealed(connection, transaction) {
    const userIds = [connection.userLowId, connection.userHighId];

    for (const userId of userIds) {
      await notificationService.create(
        {
          userId,
          type: 'feedback_revealed',
          title: 'Feedback revelado',
          message: 'Ya podés ver el feedback de tu duo.',
          data: { connectionId: connection.id, url: '/matches' },
        },
        transaction
      );
    }
  }

  async submit(viewerId, data) {
    await this.revealDueFeedbacks();

    const connection = await this.getParticipantConnection(viewerId, data.connectionId);

    if (!isFeedbackWindowOpen(connection)) {
      throw new AppError('La ventana de feedback cerró.', 409);
    }

    const targetId = this.otherUserId(connection, viewerId);

    try {
      return await sequelize.transaction(async (transaction) => {
        const existing = await Feedback.findOne({
          where: { connectionId: connection.id, authorId: viewerId },
          lock: transaction.LOCK.UPDATE,
          transaction,
        });

        if (existing) {
          throw new AppError('Ya dejaste feedback para esta conexión.', 409);
        }

        let feedback = await Feedback.create(
          {
            connectionId: connection.id,
            authorId: viewerId,
            targetId,
            sentiment: data.sentiment,
            tags: data.tags,
            comment: data.comment?.trim() || null,
            visibleAt: null,
          },
          { transaction }
        );

        await metricsService.track(
          'feedback_submitted',
          viewerId,
          { connectionId: connection.id, sentiment: data.sentiment },
          transaction
        );

        const reciprocal = await Feedback.findOne({
          where: { connectionId: connection.id, authorId: targetId },
          lock: transaction.LOCK.UPDATE,
          transaction,
        });

        if (!reciprocal) {
          return { feedback, revealed: false };
        }

        const visibleAt = new Date();
        await reciprocal.update({ visibleAt }, { transaction });
        await feedback.update({ visibleAt }, { transaction });
        await reputationService.recalculateMany([targetId, reciprocal.targetId], transaction);
        await this.notifyRevealed(connection, transaction);
        await metricsService.track(
          'feedback_revealed',
          viewerId,
          { connectionId: connection.id },
          transaction
        );

        return { feedback, revealed: true };
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Ya dejaste feedback para esta conexión.', 409);
      }
      throw error;
    }
  }

  async getDetail(viewerId, connectionId) {
    await this.revealDueFeedbacks();

    const connection = await this.getParticipantConnection(viewerId, connectionId);
    const targetId = this.otherUserId(connection, viewerId);

    const [mine, theirs] = await Promise.all([
      Feedback.findOne({ where: { connectionId: connection.id, authorId: viewerId } }),
      Feedback.findOne({ where: { connectionId: connection.id, authorId: targetId } }),
    ]);

    const revealed = Boolean(mine?.visibleAt || theirs?.visibleAt);

    return {
      connectionId: connection.id,
      revealed,
      windowOpen: isFeedbackWindowOpen(connection),
      expiresAt: feedbackWindowEndsAt(connection),
      mine: toFeedbackView(mine),
      theirs: theirs?.visibleAt ? toFeedbackView(theirs) : null,
    };
  }

  async getPending(viewerId) {
    await this.revealDueFeedbacks();

    const since = new Date(Date.now() - FEEDBACK_WINDOW_MS);

    const connections = await DuoConnection.findAll({
      where: {
        [Op.or]: [{ userLowId: viewerId }, { userHighId: viewerId }],
        contactRevealedAt: { [Op.gte]: since },
      },
      order: [['contactRevealedAt', 'DESC']],
      limit: 50,
    });

    if (!connections.length) return [];

    const submitted = await Feedback.findAll({
      where: {
        authorId: viewerId,
        connectionId: { [Op.in]: connections.map((connection) => connection.id) },
      },
      attributes: ['connectionId'],
    });

    const submittedIds = new Set(submitted.map((feedback) => feedback.connectionId));
    const pendingConnections = connections.filter((connection) => !submittedIds.has(connection.id));

    if (!pendingConnections.length) return [];

    const otherIds = pendingConnections.map((connection) => this.otherUserId(connection, viewerId));

    const profiles = await PlayerProfile.findAll({
      where: {
        userId: { [Op.in]: otherIds },
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

    return pendingConnections
      .map((connection) => {
        const otherId = this.otherUserId(connection, viewerId);
        const profile = profilesByUser.get(otherId);
        if (!profile) return null;

        return {
          connection: {
            id: connection.id,
            source: connection.source,
            status: connection.status,
            contactRevealedAt: connection.contactRevealedAt,
            expiresAt: feedbackWindowEndsAt(connection),
          },
          other: toPublicProfile(profile, profile.user),
        };
      })
      .filter(Boolean);
  }

  async revealDueFeedbacks() {
    const now = new Date();

    const candidates = await Feedback.findAll({
      where: { visibleAt: null },
      include: [{ model: DuoConnection, as: 'connection' }],
      limit: 100,
    });

    if (!candidates.length) return 0;

    const due = candidates.filter((feedback) => {
      const endsAt = feedbackWindowEndsAt(feedback.connection);
      return Boolean(endsAt && endsAt <= now);
    });

    if (!due.length) return 0;

    const byConnection = new Map();
    for (const feedback of due) {
      const list = byConnection.get(feedback.connectionId) || [];
      list.push(feedback);
      byConnection.set(feedback.connectionId, list);
    }

    let revealed = 0;

    for (const feedbacks of byConnection.values()) {
      const connection = feedbacks[0].connection;
      const visibleAt = feedbackWindowEndsAt(connection) || now;

      const count = await sequelize.transaction(async (transaction) => {
        const [updated] = await Feedback.update(
          { visibleAt },
          {
            where: {
              id: { [Op.in]: feedbacks.map((feedback) => feedback.id) },
              visibleAt: null,
            },
            transaction,
          }
        );

        if (!updated) return 0;

        await reputationService.recalculateMany(
          [...new Set(feedbacks.map((feedback) => feedback.targetId))],
          transaction
        );
        await this.notifyRevealed(connection, transaction);
        await metricsService.track(
          'feedback_revealed',
          feedbacks[0].authorId,
          { connectionId: connection.id },
          transaction
        );

        return updated;
      });

      revealed += count;
    }

    return revealed;
  }
}

export const feedbackService = new FeedbackService();

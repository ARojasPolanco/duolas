import { Op } from 'sequelize';
import User from '../auth/auth.model.js';
import PlayerProfile from '../profiles/profile.model.js';
import Notification from '../notifications/notification.model.js';
import { notificationService } from '../notifications/notification.service.js';
import { metricsService } from '../metrics/metrics.service.js';
import DuoLike from './duoLike.model.js';

const REMINDER_TYPE = 'match_reminder';
const REMINDER_COOLDOWN_MS = 72 * 60 * 60 * 1000;
const OUTGOING_LIKE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const ACTIVE_WINDOW_MS = 2 * 60 * 60 * 1000;

export class MatchReminderService {
  async sendPendingLikeReminders() {
    const now = new Date();
    const reminderCutoff = new Date(now.getTime() - REMINDER_COOLDOWN_MS);
    const outgoingLikeCutoff = new Date(now.getTime() - OUTGOING_LIKE_WINDOW_MS);
    const activeCutoff = new Date(now.getTime() - ACTIVE_WINDOW_MS);

    const pendingLikes = await DuoLike.findAll({
      where: { status: 'pending' },
      attributes: ['toUserId'],
      group: ['toUserId'],
    });

    const recipientIds = pendingLikes.map((like) => like.toUserId);
    if (!recipientIds.length) return 0;

    const [recentOutgoingLikes, recentReminders, users] = await Promise.all([
      DuoLike.findAll({
        where: {
          fromUserId: { [Op.in]: recipientIds },
          createdAt: { [Op.gte]: outgoingLikeCutoff },
        },
        attributes: ['fromUserId'],
      }),
      Notification.findAll({
        where: {
          userId: { [Op.in]: recipientIds },
          type: REMINDER_TYPE,
          createdAt: { [Op.gte]: reminderCutoff },
        },
        attributes: ['userId'],
      }),
      User.findAll({
        where: {
          id: { [Op.in]: recipientIds },
          isDeleted: false,
          status: 'active',
          emailVerified: true,
          role: 'player',
          [Op.or]: [{ lastActiveAt: null }, { lastActiveAt: { [Op.lt]: activeCutoff } }],
        },
        attributes: ['id'],
        include: [
          {
            model: PlayerProfile,
            as: 'profile',
            attributes: ['id'],
            required: true,
            where: {
              isDeleted: false,
              profileCompletedAt: { [Op.ne]: null },
            },
          },
        ],
      }),
    ]);

    const excluded = new Set([
      ...recentOutgoingLikes.map((like) => like.fromUserId),
      ...recentReminders.map((notification) => notification.userId),
    ]);

    let sent = 0;

    for (const user of users) {
      if (excluded.has(user.id)) continue;

      await notificationService.create({
        userId: user.id,
        type: REMINDER_TYPE,
        title: 'Hay gente compatible esperando',
        message:
          'Entrá a Match y dale Me interesa a quien te coparía tener de duo. Si hay interés mutuo, aparece la conexión.',
        data: { url: '/match', source: 'pending_likes' },
      });

      void metricsService.track('match_reminder_sent', user.id, {
        source: 'pending_likes',
      });
      sent += 1;
    }

    return sent;
  }

  async getReminderStatus(userId) {
    const [incomingPending, recentOutgoing] = await Promise.all([
      DuoLike.count({
        where: { toUserId: userId, status: 'pending' },
      }),
      DuoLike.count({
        where: {
          fromUserId: userId,
          createdAt: { [Op.gte]: new Date(Date.now() - OUTGOING_LIKE_WINDOW_MS) },
        },
      }),
    ]);

    return {
      show: incomingPending > 0 && recentOutgoing === 0,
      pendingIncoming: incomingPending,
    };
  }
}

export const matchReminderService = new MatchReminderService();

import Notification from './notification.model.js';
import { eventBus } from '../events/event.bus.js';
import { pushService } from '../push/push.service.js';
import logger from '../../config/logger.js';

const EVENT_TYPE_BY_NOTIFICATION = {
  match_created: 'match.created',
  invite_received: 'invite.updated',
  invite_accepted: 'invite.updated',
  invite_declined: 'invite.updated',
  invite_cancelled: 'invite.updated',
  application_received: 'application.updated',
  application_accepted: 'application.updated',
  application_rejected: 'application.updated',
  application_withdrawn: 'application.updated',
};

const dispatch = (notification) => {
  const data = notification.data || {};
  const eventData = {
    notificationId: notification.id,
    notificationType: notification.type,
    title: notification.title,
    message: notification.message,
    url: data.url || null,
  };

  eventBus.emitToUser(notification.userId, 'notification.created', eventData);

  const specificType = EVENT_TYPE_BY_NOTIFICATION[notification.type];
  if (specificType) {
    eventBus.emitToUser(notification.userId, specificType, eventData);
  }

  pushService.sendToUser(notification.userId, notification).catch((error) => {
    logger.warn('No se pudo procesar el push', { message: error.message });
  });
};

export class NotificationService {
  async create(data, transaction) {
    const notification = await Notification.create(data, { transaction });

    if (typeof transaction?.afterCommit === 'function') {
      transaction.afterCommit(() => dispatch(notification));
    } else {
      dispatch(notification);
    }

    return notification;
  }

  async findByUser(userId) {
    return Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
  }

  async countUnread(userId) {
    return Notification.count({ where: { userId, isRead: false } });
  }

  async markAsRead(id, userId) {
    const notification = await Notification.findOne({ where: { id, userId } });
    if (!notification) return null;
    return notification.update({ isRead: true });
  }

  async markAllAsRead(userId) {
    return Notification.update({ isRead: true }, { where: { userId, isRead: false } });
  }

  async delete(id, userId) {
    const notification = await Notification.findOne({ where: { id, userId } });
    if (!notification) return null;
    await notification.destroy();
    return notification;
  }
}

export const notificationService = new NotificationService();

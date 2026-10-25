import Notification from './notification.model.js';

export class NotificationService {
  async create(data, transaction) {
    return Notification.create(data, { transaction });
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

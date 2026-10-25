import { notificationService } from './notification.service.js';
import { catchAsync } from '../../errors/catchAsync.js';
import { AppError } from '../../errors/appError.js';

export const getNotifications = catchAsync(async (req, res) => {
  const notifications = await notificationService.findByUser(req.sessionUser.id);
  const unreadCount = await notificationService.countUnread(req.sessionUser.id);

  res.status(200).json({
    status: 'success',
    notifications,
    unreadCount,
  });
});

export const getUnreadCount = catchAsync(async (req, res) => {
  const unreadCount = await notificationService.countUnread(req.sessionUser.id);

  res.status(200).json({ status: 'success', unreadCount });
});

export const markAsRead = catchAsync(async (req, res, next) => {
  const notification = await notificationService.markAsRead(req.params.id, req.sessionUser.id);

  if (!notification) {
    return next(new AppError('Notificación no encontrada.', 404));
  }

  res.status(200).json({ status: 'success', notification });
});

export const markAllAsRead = catchAsync(async (req, res) => {
  await notificationService.markAllAsRead(req.sessionUser.id);
  res.status(200).json({ status: 'success', message: 'Todas marcadas como leídas.' });
});

export const deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await notificationService.delete(req.params.id, req.sessionUser.id);

  if (!notification) {
    return next(new AppError('Notificación no encontrada.', 404));
  }

  res.status(200).json({ status: 'success', message: 'Notificación eliminada.' });
});

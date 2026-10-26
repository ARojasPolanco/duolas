import { Op } from 'sequelize';
import { envs } from '../../config/enviroments.js';
import { pushEnabled, webpush } from '../../config/push.js';
import logger from '../../config/logger.js';
import PushSubscription from './pushSubscription.model.js';

const PUSH_TYPES = new Set([
  'match_created',
  'invite_received',
  'invite_accepted',
  'invite_declined',
  'application_received',
  'application_accepted',
  'application_rejected',
  'post_suggested',
  'warning_received',
  'account_suspended',
]);

const MAX_PAYLOAD_BYTES = 4096;

const buildPayload = (notification) => {
  const payload = {
    title: notification.title,
    body: (notification.message || '').slice(0, 240),
    url: notification.data?.url || '/inicio',
    tag: `${notification.type}-${notification.id}`,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  };

  const serialized = JSON.stringify(payload);
  if (Buffer.byteLength(serialized) <= MAX_PAYLOAD_BYTES) return serialized;

  return JSON.stringify({
    ...payload,
    body: payload.body.slice(0, 80),
  });
};

export class PushService {
  getPublicKey() {
    return pushEnabled ? envs.VAPID_PUBLIC_KEY : null;
  }

  async subscribe(userId, { endpoint, keys, userAgent }) {
    const existing = await PushSubscription.findOne({ where: { endpoint } });

    if (existing) {
      if (existing.userId !== userId) {
        await existing.update({
          userId,
          p256dh: keys.p256dh,
          auth: keys.auth,
          userAgent: userAgent || null,
          isActive: true,
        });
      } else {
        await existing.update({
          p256dh: keys.p256dh,
          auth: keys.auth,
          userAgent: userAgent || existing.userAgent,
          isActive: true,
        });
      }
      return existing;
    }

    return PushSubscription.create({
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: userAgent || null,
      isActive: true,
    });
  }

  async unsubscribe(userId, endpoint) {
    const [count] = await PushSubscription.update(
      { isActive: false },
      { where: { userId, endpoint } }
    );
    return count;
  }

  async sendToUser(userId, notification) {
    if (!pushEnabled || !PUSH_TYPES.has(notification.type)) return 0;

    const subscriptions = await PushSubscription.findAll({
      where: { userId, isActive: true },
    });

    if (!subscriptions.length) return 0;

    const payload = buildPayload(notification);
    let sent = 0;

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
          { TTL: 60 * 60 }
        );

        await subscription.update({ lastUsedAt: new Date() });
        sent += 1;
      } catch (error) {
        if ([404, 410].includes(error.statusCode)) {
          await subscription.update({ isActive: false });
        }

        logger.warn('No se pudo enviar push', {
          subscriptionId: subscription.id,
          statusCode: error.statusCode || null,
          message: error.message,
        });
      }
    }

    return sent;
  }

  async deactivateEndpoint(endpoint) {
    await PushSubscription.update({ isActive: false }, { where: { endpoint, isActive: true } });
  }

  async countActiveForUser(userId) {
    return PushSubscription.count({
      where: {
        userId,
        isActive: true,
        endpoint: { [Op.ne]: '' },
      },
    });
  }
}

export const pushService = new PushService();

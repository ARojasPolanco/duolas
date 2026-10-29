import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import sequelize from '../config/database/database.js';
import { runMigrations } from '../config/database/migrator.js';
import User from '../modules/auth/auth.model.js';
import Notification from '../modules/notifications/notification.model.js';
import { matchReminderService } from '../modules/matching/matchReminder.service.js';
import { authHeader, createMatchUser } from './helpers/fixtures.js';

const api = request(app);

beforeAll(async () => {
  try {
    await sequelize.authenticate();
  } catch (_error) {
    throw new Error(
      'La base de datos de test no está disponible. Levantá PostgreSQL con npm run docker:up.'
    );
  }

  await runMigrations();
});

describe('Recordatorio de likes pendientes', () => {
  it('envía una sola notificación por ventana de 72 horas', async () => {
    const recipient = await createMatchUser({ scheduleBlocks: ['sun_afternoon'] });
    const sender = await createMatchUser({ scheduleBlocks: ['sun_afternoon'] });

    await User.update(
      { lastActiveAt: new Date(Date.now() - 3 * 60 * 60 * 1000) },
      { where: { id: recipient.user.id } }
    );

    const like = await api
      .post('/api/v1/matching/likes')
      .set(authHeader(sender.token))
      .send({ targetUserId: recipient.user.id });

    expect(like.status).toBe(201);

    await matchReminderService.sendPendingLikeReminders();

    const firstCount = await Notification.count({
      where: { userId: recipient.user.id, type: 'match_reminder' },
    });

    expect(firstCount).toBe(1);

    await matchReminderService.sendPendingLikeReminders();

    const secondCount = await Notification.count({
      where: { userId: recipient.user.id, type: 'match_reminder' },
    });

    expect(secondCount).toBe(1);
  });
});

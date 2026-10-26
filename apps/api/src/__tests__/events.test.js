import { beforeAll, afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import sequelize from '../config/database/database.js';
import { runMigrations } from '../config/database/migrator.js';
import { eventBus } from '../modules/events/event.bus.js';
import { SSE_TICKET_TTL_MS, ticketStore } from '../modules/events/ticket.store.js';
import { notificationService } from '../modules/notifications/notification.service.js';
import PushSubscription from '../modules/push/pushSubscription.model.js';
import User from '../modules/auth/auth.model.js';
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

afterEach(() => {
  eventBus.reset();
  ticketStore.reset();
});

const fakeResponse = () => {
  const response = {
    writableEnded: false,
    destroyed: false,
    chunks: [],
    write(chunk) {
      this.chunks.push(chunk);
      return true;
    },
    end() {
      this.writableEnded = true;
    },
  };
  return response;
};

const subscribe = (token, overrides = {}) =>
  api
    .post('/api/v1/push/subscribe')
    .set(authHeader(token))
    .send({
      endpoint: 'https://push.example.com/subscription/abc',
      keys: {
        p256dh: 'BPublicKeyExample',
        auth: 'AuthSecretExample',
      },
      userAgent: 'Vitest',
      ...overrides,
    });

describe('Tickets SSE', () => {
  it('emite un ticket de un solo uso y con vencimiento', async () => {
    const user = await createMatchUser();

    const res = await api.post('/api/v1/events/ticket').set(authHeader(user.token));

    expect(res.status).toBe(200);
    expect(res.body.ticket).toHaveLength(64);
    expect(res.body.expiresIn).toBe(60);

    const entry = ticketStore.consume(res.body.ticket);
    expect(entry.userId).toBe(user.user.id);
    expect(ticketStore.consume(res.body.ticket)).toBeNull();

    const expiring = ticketStore.issue(user.user.id);
    ticketStore.cleanup(Date.now() + SSE_TICKET_TTL_MS + 1);
    expect(ticketStore.consume(expiring)).toBeNull();
  });

  it('rechaza ticket inválido y exige auth para emitirlo', async () => {
    const noAuth = await api.post('/api/v1/events/ticket');
    const invalidStream = await api.get('/api/v1/events/stream?ticket=invalido');

    expect(noAuth.status).toBe(401);
    expect(invalidStream.status).toBe(401);
    expect(invalidStream.body.message).toContain('Ticket inválido');
  });

  it('expone estadísticas solo para admin', async () => {
    const user = await createMatchUser();
    const admin = await createMatchUser();
    await User.update({ role: 'admin' }, { where: { id: admin.user.id } });

    const forbidden = await api.get('/api/v1/events/stats').set(authHeader(user.token));
    const allowed = await api.get('/api/v1/events/stats').set(authHeader(admin.token));

    expect(forbidden.status).toBe(403);
    expect(allowed.status).toBe(200);
    expect(allowed.body.connections).toBe(0);
  });
});

describe('Bus SSE', () => {
  it('limita conexiones por usuario y emite eventos', () => {
    const userId = 'user-1';
    const responses = Array.from({ length: 5 }, () => fakeResponse());

    for (const response of responses) {
      expect(eventBus.add(userId, response).ok).toBe(true);
    }

    const sixth = eventBus.add(userId, fakeResponse());
    expect(sixth.ok).toBe(false);
    expect(sixth.reason).toBe('user');

    const delivered = eventBus.emitToUser(userId, 'notification.created', {
      notificationId: 'n-1',
    });

    expect(delivered).toBe(5);
    expect(responses[0].chunks[0]).toContain('event: notification.created');
    expect(responses[0].chunks[0]).toContain('"notificationId":"n-1"');

    eventBus.remove(userId, responses[0]);
    expect(eventBus.stats().connections).toBe(4);
  });

  it('emite notification.created al persistir una notificación', async () => {
    const user = await createMatchUser();
    const response = fakeResponse();
    eventBus.add(user.user.id, response);

    const notification = await notificationService.create({
      userId: user.user.id,
      type: 'match_created',
      title: 'Es un match',
      message: 'Ya pueden coordinar.',
      data: { connectionId: 'connection-1', url: '/matches' },
    });

    expect(response.chunks.join('')).toContain('notification.created');
    expect(response.chunks.join('')).toContain(notification.id);

    await notification.destroy();
  });
});

describe('Push subscriptions', () => {
  it('devuelve el estado de configuración de VAPID', async () => {
    const user = await createMatchUser();
    const res = await api.get('/api/v1/push/public-key').set(authHeader(user.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('publicKey');
    expect(res.body.enabled).toBe(Boolean(res.body.publicKey));
  });

  it('registra, reactiva y desactiva una suscripción', async () => {
    const user = await createMatchUser();

    const first = await subscribe(user.token);
    const second = await subscribe(user.token);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);

    const rows = await PushSubscription.findAll({
      where: { userId: user.user.id },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].isActive).toBe(true);

    const removed = await api
      .delete('/api/v1/push/unsubscribe')
      .set(authHeader(user.token))
      .send({ endpoint: 'https://push.example.com/subscription/abc' });

    expect(removed.status).toBe(200);
    await rows[0].reload();
    expect(rows[0].isActive).toBe(false);
  });

  it('no desactiva la suscripción de otro usuario', async () => {
    const owner = await createMatchUser();
    const other = await createMatchUser();

    await subscribe(owner.token);

    const removed = await api
      .delete('/api/v1/push/unsubscribe')
      .set(authHeader(other.token))
      .send({ endpoint: 'https://push.example.com/subscription/abc' });

    expect(removed.status).toBe(200);

    const row = await PushSubscription.findOne({
      where: { userId: owner.user.id },
    });
    expect(row.isActive).toBe(true);
  });

  it('valida el endpoint y las claves', async () => {
    const user = await createMatchUser();

    const badEndpoint = await subscribe(user.token, { endpoint: 'no-es-url' });
    const missingKeys = await api
      .post('/api/v1/push/subscribe')
      .set(authHeader(user.token))
      .send({ endpoint: 'https://push.example.com/subscription/abc' });

    expect(badEndpoint.status).toBe(422);
    expect(missingKeys.status).toBe(422);
  });
});

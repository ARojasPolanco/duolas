import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import sequelize from '../config/database/database.js';
import { runMigrations } from '../config/database/migrator.js';
import User from '../modules/auth/auth.model.js';
import {
  authHeader,
  createMatchUser,
  markEmailVerified,
  registerUser,
} from './helpers/fixtures.js';

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

const candidates = (token, query = '') =>
  api.get(`/api/v1/matching/candidates${query}`).set(authHeader(token));

const like = (token, targetUserId) =>
  api.post('/api/v1/matching/likes').set(authHeader(token)).send({ targetUserId });

const unlike = (token, targetUserId) =>
  api.delete(`/api/v1/matching/likes/${targetUserId}`).set(authHeader(token));

const outgoingLikes = (token) => api.get('/api/v1/matching/likes').set(authHeader(token));

const matches = (token) => api.get('/api/v1/matching/matches').set(authHeader(token));

const matchDetail = (token, id) => api.get(`/api/v1/matching/matches/${id}`).set(authHeader(token));

const archiveMatch = (token, id) =>
  api.post(`/api/v1/matching/matches/${id}/archive`).set(authHeader(token));

const block = (token, userId) => api.post('/api/v1/blocks').set(authHeader(token)).send({ userId });

const unblock = (token, userId) => api.delete(`/api/v1/blocks/${userId}`).set(authHeader(token));

const notifications = (token) => api.get('/api/v1/notifications').set(authHeader(token));

const compatibleTarget = (scheduleBlocks) =>
  createMatchUser({
    scheduleBlocks,
    primaryRole: 'jungle',
    secondaryRole: 'top',
    rankTier: 'diamond',
    rankDivision: 'ii',
  });

describe('Matching', () => {
  describe('GET /api/v1/matching/candidates', () => {
    it('devuelve candidatos compatibles con score, breakdown y motivos', async () => {
      const viewer = await createMatchUser({ scheduleBlocks: ['sun_early'] });
      const target = await compatibleTarget(['sun_early']);
      await User.update(
        { lastActiveAt: new Date(Date.now() + 60_000) },
        { where: { id: target.user.id } }
      );

      const res = await candidates(viewer.token, '?limit=50');
      const card = res.body.candidates.find((item) => item.profile.id === target.user.id);
      expect(res.status).toBe(200);
      expect(card).toBeTruthy();
      expect(card.score).toBeGreaterThan(0);
      expect(card.breakdown.schedule).toBeGreaterThan(0);
      expect(card.reasons.length).toBeGreaterThan(0);
      expect(card.profile.riotId).toBeUndefined();
      expect(card.profile.discordTag).toBeUndefined();
      expect(card.profile.email).toBeUndefined();
    });

    it('excluye candidatos con rango incompatible', async () => {
      const viewer = await createMatchUser({ scheduleBlocks: ['sun_morning'] });
      const target = await createMatchUser({
        scheduleBlocks: ['sun_morning'],
        rankTier: 'iron',
        rankDivision: 'iv',
        primaryRole: 'jungle',
        secondaryRole: 'top',
      });

      const res = await candidates(viewer.token);

      expect(res.status).toBe(200);
      expect(res.body.candidates.some((item) => item.profile.id === target.user.id)).toBe(false);
    });

    it('excluye candidatos sin solape horario', async () => {
      const viewer = await createMatchUser({ scheduleBlocks: ['sun_afternoon'] });
      const target = await compatibleTarget(['mon_early']);

      const res = await candidates(viewer.token);

      expect(res.status).toBe(200);
      expect(res.body.candidates.some((item) => item.profile.id === target.user.id)).toBe(false);
    });

    it('excluye candidatos con email sin verificar', async () => {
      const viewer = await createMatchUser({ scheduleBlocks: ['sun_night'] });
      const target = await compatibleTarget(['sun_night']);
      const unverified = await createMatchUser(
        {
          scheduleBlocks: ['sun_night'],
          primaryRole: 'jungle',
          secondaryRole: 'top',
        },
        { verify: false }
      );

      const res = await candidates(viewer.token);
      const ids = res.body.candidates.map((item) => item.profile.id);

      expect(ids).toContain(target.user.id);
      expect(ids).not.toContain(unverified.user.id);
    });

    it('excluye candidatos con perfil incompleto', async () => {
      const viewer = await createMatchUser({ scheduleBlocks: ['sat_early'] });
      const incomplete = await registerUser();

      const res = await candidates(viewer.token);

      expect(res.status).toBe(200);
      expect(res.body.candidates.some((item) => item.profile.id === incomplete.user.id)).toBe(
        false
      );
    });

    it('filtra por rol', async () => {
      const viewer = await createMatchUser({ scheduleBlocks: ['sat_afternoon'] });
      const target = await compatibleTarget(['sat_afternoon']);

      const withAdc = await candidates(viewer.token, '?role=adc');
      const withJungle = await candidates(viewer.token, '?role=jungle');

      expect(withAdc.status).toBe(200);
      expect(withAdc.body.candidates.some((item) => item.profile.id === target.user.id)).toBe(
        false
      );
      expect(withJungle.body.candidates.some((item) => item.profile.id === target.user.id)).toBe(
        true
      );
    });

    it('excluye bloqueados y vuelve a mostrarlos al desbloquear', async () => {
      const viewer = await createMatchUser({ scheduleBlocks: ['sat_morning'] });
      const target = await compatibleTarget(['sat_morning']);

      const blockRes = await block(viewer.token, target.user.id);
      const blockedCandidates = await candidates(viewer.token);

      expect(blockRes.status).toBe(201);
      expect(
        blockedCandidates.body.candidates.some((item) => item.profile.id === target.user.id)
      ).toBe(false);

      const unblockRes = await unblock(viewer.token, target.user.id);
      const unblockedCandidates = await candidates(viewer.token);

      expect(unblockRes.status).toBe(200);
      expect(
        unblockedCandidates.body.candidates.some((item) => item.profile.id === target.user.id)
      ).toBe(true);
    });

    it('rechaza queue, rol o límite inválidos', async () => {
      const viewer = await createMatchUser({ scheduleBlocks: ['wed_night'] });

      const queueRes = await candidates(viewer.token, '?queue=invalida');
      const roleRes = await candidates(viewer.token, '?role=invalido');
      const limitRes = await candidates(viewer.token, '?limit=999');

      expect(queueRes.status).toBe(422);
      expect(roleRes.status).toBe(422);
      expect(limitRes.status).toBe(422);
    });

    it('bloquea candidatos si el email del viewer no está verificado', async () => {
      const viewer = await createMatchUser({ scheduleBlocks: ['wed_morning'] }, { verify: false });

      const res = await candidates(viewer.token);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Verificá tu email');
    });

    it('bloquea candidatos si el perfil del viewer está incompleto', async () => {
      const { token, user } = await registerUser();
      await markEmailVerified(user.id);

      const res = await candidates(token);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Completá tu perfil');
    });
  });

  describe('Likes y matches', () => {
    it('gestiona like idempotente, match mutuo, contacto, notificaciones y archivo', async () => {
      const a = await createMatchUser({ scheduleBlocks: ['thu_early'] });
      const b = await compatibleTarget(['thu_early']);

      const first = await like(a.token, b.user.id);
      const second = await like(a.token, b.user.id);
      const outgoing = await outgoingLikes(a.token);

      expect(first.status).toBe(201);
      expect(first.body.matched).toBe(false);
      expect(second.status).toBe(200);
      expect(second.body.matched).toBe(false);
      expect(outgoing.body.outgoing.some((item) => item.target.id === b.user.id)).toBe(true);

      const mutual = await like(b.token, a.user.id);

      expect(mutual.status).toBe(201);
      expect(mutual.body.matched).toBe(true);
      expect(mutual.body.connection.contact.riotId).toBe(a.profile.riotId);

      const aMatches = await matches(a.token);
      const bMatches = await matches(b.token);

      expect(aMatches.body.matches).toHaveLength(1);
      expect(aMatches.body.matches[0].other.id).toBe(b.user.id);
      expect(aMatches.body.matches[0].contact.riotId).toBe(b.profile.riotId);
      expect(bMatches.body.matches[0].other.id).toBe(a.user.id);

      const detail = await matchDetail(a.token, aMatches.body.matches[0].id);
      expect(detail.status).toBe(200);
      expect(detail.body.match.contact.riotId).toBe(b.profile.riotId);

      const aNotifications = await notifications(a.token);
      expect(aNotifications.body.unreadCount).toBeGreaterThan(0);
      expect(aNotifications.body.notifications.some((item) => item.type === 'match_created')).toBe(
        true
      );

      const third = await createMatchUser({ scheduleBlocks: ['mon_morning'] });
      const forbidden = await matchDetail(third.token, aMatches.body.matches[0].id);
      expect(forbidden.status).toBe(404);

      const notificationId = aNotifications.body.notifications[0].id;
      const forbiddenRead = await api
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set(authHeader(third.token));
      expect(forbiddenRead.status).toBe(404);

      const archived = await archiveMatch(a.token, aMatches.body.matches[0].id);
      const emptyMatches = await matches(a.token);

      expect(archived.status).toBe(200);
      expect(emptyMatches.body.matches).toHaveLength(0);

      const reactivated = await like(a.token, b.user.id);
      const reactivatedMatches = await matches(a.token);

      expect(reactivated.status).toBe(200);
      expect(reactivated.body.matched).toBe(true);
      expect(reactivatedMatches.body.matches).toHaveLength(1);

      const cannotUnlike = await unlike(a.token, b.user.id);
      expect(cannotUnlike.status).toBe(409);
    });

    it('rechaza el like a uno mismo y a un usuario inexistente', async () => {
      const a = await createMatchUser({ scheduleBlocks: ['fri_early'] });

      const self = await like(a.token, a.user.id);
      const missing = await like(a.token, '00000000-0000-4000-8000-000000000000');

      expect(self.status).toBe(400);
      expect(missing.status).toBe(404);
    });

    it('permite retirar un like pendiente de forma idempotente', async () => {
      const a = await createMatchUser({ scheduleBlocks: ['fri_afternoon'] });
      const b = await compatibleTarget(['fri_afternoon']);

      await like(a.token, b.user.id);

      const first = await unlike(a.token, b.user.id);
      const second = await unlike(a.token, b.user.id);
      const outgoing = await outgoingLikes(a.token);

      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(outgoing.body.outgoing).toHaveLength(0);
    });

    it('rechaza like a un usuario bloqueado', async () => {
      const a = await createMatchUser({ scheduleBlocks: ['fri_morning'] });
      const b = await compatibleTarget(['fri_morning']);

      await block(a.token, b.user.id);
      const res = await like(b.token, a.user.id);

      expect(res.status).toBe(403);
    });
  });

  describe('Bloqueos', () => {
    it('archiva el match, lista bloqueados y permite desbloquear', async () => {
      const a = await createMatchUser({ scheduleBlocks: ['wed_early'] });
      const b = await compatibleTarget(['wed_early']);

      await like(a.token, b.user.id);
      const mutual = await like(b.token, a.user.id);
      expect(mutual.body.matched).toBe(true);

      const blocked = await block(a.token, b.user.id);
      const aMatches = await matches(a.token);
      const bMatches = await matches(b.token);
      const list = await api.get('/api/v1/blocks').set(authHeader(a.token));

      expect(blocked.status).toBe(201);
      expect(aMatches.body.matches).toHaveLength(0);
      expect(bMatches.body.matches).toHaveLength(0);
      expect(list.body.blocks.some((item) => item.user.id === b.user.id)).toBe(true);

      const unblocked = await unblock(a.token, b.user.id);
      const listAfter = await api.get('/api/v1/blocks').set(authHeader(a.token));

      expect(unblocked.status).toBe(200);
      expect(listAfter.body.blocks).toHaveLength(0);
    });
  });

  describe('Notificaciones', () => {
    it('marca una notificación propia como leída', async () => {
      const a = await createMatchUser({ scheduleBlocks: ['wed_afternoon'] });
      const b = await compatibleTarget(['wed_afternoon']);

      await like(a.token, b.user.id);
      await like(b.token, a.user.id);

      const list = await notifications(a.token);
      const notification = list.body.notifications[0];

      const read = await api
        .patch(`/api/v1/notifications/${notification.id}/read`)
        .set(authHeader(a.token));
      const count = await api.get('/api/v1/notifications/unread-count').set(authHeader(a.token));

      expect(read.status).toBe(200);
      expect(read.body.notification.isRead).toBe(true);
      expect(count.body.unreadCount).toBeLessThan(list.body.unreadCount);
    });
  });
});

import { beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import sequelize from '../config/database/database.js';
import { runMigrations } from '../config/database/migrator.js';
import User from '../modules/auth/auth.model.js';
import PlayerProfile from '../modules/profiles/profile.model.js';
import { computeRankIndex } from '../modules/profiles/profile.service.js';
import { requireCompleteProfile, requireVerifiedEmail } from '../modules/auth/auth.middleware.js';
import { authHeader, completeProfile, registerUser, uniqueRiotId } from './helpers/fixtures.js';

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

describe('Perfiles', () => {
  describe('Cálculo de rango', () => {
    it('calcula el índice absoluto', () => {
      expect(computeRankIndex('iron', 'iv')).toBe(0);
      expect(computeRankIndex('diamond', 'ii')).toBe(26);
      expect(computeRankIndex('master', null)).toBe(28);
      expect(computeRankIndex('challenger', null)).toBe(36);
    });
  });

  describe('PATCH /api/v1/profiles/me', () => {
    it('crea un perfil completo y calcula rank_index', async () => {
      const { token, user } = await registerUser();
      const { res, payload } = await completeProfile(token);
      const stored = await PlayerProfile.findOne({ where: { userId: user.id } });

      expect(res.status).toBe(200);
      expect(res.body.completeness.completed).toBe(true);
      expect(res.body.profile.riotId).toBe(payload.riotId);
      expect(res.body.profile.discordTag).toBe('tester');
      expect(stored.rankIndex).toBe(26);
      expect(stored.profileCompletedAt).toBeTruthy();
    });

    it('rechaza un perfil incompleto', async () => {
      const { token } = await registerUser();
      const res = await request(app)
        .patch('/api/v1/profiles/me')
        .set(authHeader(token))
        .send({ riotId: uniqueRiotId() });

      expect(res.status).toBe(422);
      expect(res.body.message).toContain('Rol principal');
      expect(res.body.message).toContain('Horarios');
    });

    it('rechaza un Riot ID inválido', async () => {
      const { token } = await registerUser();
      const res = await request(app)
        .patch('/api/v1/profiles/me')
        .set(authHeader(token))
        .send({ riotId: 'sin-tag' });

      expect(res.status).toBe(422);
    });

    it('rechaza roles repetidos', async () => {
      const { token } = await registerUser();
      const { res } = await completeProfile(token, {
        primaryRole: 'mid',
        secondaryRole: 'mid',
      });

      expect(res.status).toBe(422);
      expect(res.body.message).toContain('distintos');
    });

    it('rechaza una división faltante fuera de apex', async () => {
      const { token } = await registerUser();
      const { res } = await completeProfile(token, {
        rankTier: 'diamond',
        rankDivision: null,
      });

      expect(res.status).toBe(422);
      expect(res.body.message).toContain('División');
    });

    it('normaliza la división a null en Maestro+', async () => {
      const { token } = await registerUser();
      const { res } = await completeProfile(token, {
        rankTier: 'master',
        rankDivision: 'i',
      });

      expect(res.status).toBe(200);
      expect(res.body.profile.rankDivision).toBeNull();
    });

    it('rechaza un Riot ID ya usado por otra persona', async () => {
      const first = await registerUser();
      const firstProfile = await completeProfile(first.token);
      const second = await registerUser();

      const { res } = await completeProfile(second.token, {
        riotId: firstProfile.payload.riotId,
      });

      expect(res.status).toBe(409);
    });

    it('permite actualizar solo un campo manteniendo el perfil completo', async () => {
      const { token } = await registerUser();
      const created = await completeProfile(token);

      const res = await request(app)
        .patch('/api/v1/profiles/me')
        .set(authHeader(token))
        .send({ bio: 'Bio actualizada.' });

      expect(res.status).toBe(200);
      expect(res.body.profile.bio).toBe('Bio actualizada.');
      expect(res.body.profile.riotId).toBe(created.payload.riotId);
    });

    it('rechaza un Discord inválido', async () => {
      const { token } = await registerUser();
      const { res } = await completeProfile(token, { discordTag: 'a b' });

      expect(res.status).toBe(422);
    });

    it('rechaza bloques horarios duplicados', async () => {
      const { token } = await registerUser();
      const { res } = await completeProfile(token, {
        scheduleBlocks: ['mon_night', 'mon_night'],
      });

      expect(res.status).toBe(422);
    });
  });

  describe('Lectura de perfiles', () => {
    it('devuelve el perfil privado con Riot ID y Discord, sin email', async () => {
      const { token } = await registerUser();
      await completeProfile(token);

      const res = await request(app).get('/api/v1/profiles/me').set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.profile.riotId).toBeTruthy();
      expect(res.body.profile.discordTag).toBe('tester');
      expect(res.body.profile.email).toBeUndefined();
      expect(res.body.completeness.completed).toBe(true);
    });

    it('marca profileCompleted en /auth/profile al completar el perfil', async () => {
      const { token } = await registerUser();
      await completeProfile(token);

      const res = await request(app).get('/api/v1/auth/profile').set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.user.profileCompleted).toBe(true);
    });

    it('expone el perfil público sin email, Riot ID ni Discord', async () => {
      const { token, user } = await registerUser();
      await completeProfile(token);

      const res = await request(app).get(`/api/v1/profiles/${user.id}`).set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.profile.username).toBe(user.username);
      expect(res.body.profile.riotId).toBeUndefined();
      expect(res.body.profile.discordTag).toBeUndefined();
      expect(res.body.profile.email).toBeUndefined();
      expect(res.body.profile.stats.connections).toBe(0);
      expect(res.body.profile.reputation.label).toBe('Nuevo');
    });

    it('devuelve 404 si el perfil no existe o está incompleto', async () => {
      const { token, user } = await registerUser();

      const res = await request(app).get(`/api/v1/profiles/${user.id}`).set(authHeader(token));

      expect(res.status).toBe(404);
    });

    it('devuelve 400 con un UUID inválido', async () => {
      const { token } = await registerUser();

      const res = await request(app).get('/api/v1/profiles/no-es-uuid').set(authHeader(token));

      expect(res.status).toBe(400);
    });

    it('devuelve 404 con un UUID inexistente', async () => {
      const { token } = await registerUser();

      const res = await request(app)
        .get('/api/v1/profiles/00000000-0000-4000-8000-000000000000')
        .set(authHeader(token));

      expect(res.status).toBe(404);
    });
  });

  describe('Middlewares de perfil', () => {
    it('requireVerifiedEmail bloquea si el email no está verificado', async () => {
      const { user } = await registerUser();
      const sessionUser = await User.findByPk(user.id);
      const next = vi.fn();

      requireVerifiedEmail({ sessionUser }, {}, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0].statusCode).toBe(403);
    });

    it('requireVerifiedEmail deja pasar con email verificado', async () => {
      const { user } = await registerUser();
      await User.update({ emailVerified: true }, { where: { id: user.id } });
      const sessionUser = await User.findByPk(user.id);
      const next = vi.fn();

      requireVerifiedEmail({ sessionUser }, {}, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('requireCompleteProfile bloquea sin perfil y deja pasar con perfil completo', async () => {
      const first = await registerUser();
      const firstSession = await User.findByPk(first.user.id);
      const blockedNext = vi.fn();

      await requireCompleteProfile({ sessionUser: firstSession }, {}, blockedNext);

      expect(blockedNext.mock.calls[0][0].statusCode).toBe(403);

      await completeProfile(first.token);
      const firstComplete = await User.findByPk(first.user.id);
      const allowedNext = vi.fn();

      await requireCompleteProfile({ sessionUser: firstComplete }, {}, allowedNext);

      expect(allowedNext).toHaveBeenCalledWith();
    });
  });
});

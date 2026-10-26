import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import sequelize from '../config/database/database.js';
import { runMigrations } from '../config/database/migrator.js';
import MetricsEvent from '../modules/metrics/metricsEvent.model.js';
import User from '../modules/auth/auth.model.js';
import { authHeader, completeProfile, createMatchUser, registerUser } from './helpers/fixtures.js';

const api = request(app);

const waitForMetric = async (userId, type) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const event = await MetricsEvent.findOne({ where: { userId, type } });
    if (event) return event;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return null;
};

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

describe('Métricas', () => {
  it('registra eventos de alta, verificación y perfil completo', async () => {
    const { user, token } = await registerUser();
    const created = await waitForMetric(user.id, 'user_registered');
    expect(created).toBeTruthy();

    const stored = await User.findByPk(user.id);
    const verification = await api.get(
      `/api/v1/auth/verify-email?token=${stored.emailVerificationToken}`
    );
    expect(verification.status).toBe(200);

    const verified = await waitForMetric(user.id, 'email_verified');
    expect(verified).toBeTruthy();

    const profile = await completeProfile(token);
    expect(profile.res.status).toBe(200);

    const completed = await waitForMetric(user.id, 'profile_completed');
    expect(completed).toBeTruthy();
    expect(completed.metadata.rankTier).toBe('diamond');
  });

  it('devuelve el resumen de KPIs solo a admin', async () => {
    const user = await createMatchUser();
    const admin = await createMatchUser();
    await User.update({ role: 'admin' }, { where: { id: admin.user.id } });

    const forbidden = await api.get('/api/v1/admin/metrics/summary').set(authHeader(user.token));

    const allowed = await api.get('/api/v1/admin/metrics/summary').set(authHeader(admin.token));

    expect(forbidden.status).toBe(403);
    expect(allowed.status).toBe(200);
    expect(allowed.body.range.from).toBeTruthy();
    expect(allowed.body.range.to).toBeTruthy();
    expect(allowed.body.metrics).toHaveProperty('timeToFirstDuo');
    expect(allowed.body.metrics).toHaveProperty('matchToGame');
    expect(allowed.body.metrics).toHaveProperty('retention7d');
    expect(allowed.body.metrics).toHaveProperty('concurrentAvailability');
  });

  it('valida el rango de fechas', async () => {
    const admin = await createMatchUser();
    await User.update({ role: 'admin' }, { where: { id: admin.user.id } });

    const invalid = await api
      .get('/api/v1/admin/metrics/summary?from=no-es-fecha')
      .set(authHeader(admin.token));

    expect(invalid.status).toBe(422);
  });
});

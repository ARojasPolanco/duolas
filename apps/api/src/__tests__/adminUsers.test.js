import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import sequelize from '../config/database/database.js';
import { runMigrations } from '../config/database/migrator.js';
import User from '../modules/auth/auth.model.js';
import { authHeader, createMatchUser } from './helpers/fixtures.js';

const api = request(app);

const makeAdmin = async () => {
  const account = await createMatchUser();
  await User.update({ role: 'admin' }, { where: { id: account.user.id } });
  return account;
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

describe('Admin usuarios', () => {
  it('restringe el resumen y el listado a admins', async () => {
    const player = await createMatchUser();
    const admin = await makeAdmin();

    const forbiddenOverview = await api.get('/api/v1/admin/overview').set(authHeader(player.token));
    const forbiddenUsers = await api.get('/api/v1/admin/users').set(authHeader(player.token));

    expect(forbiddenOverview.status).toBe(403);
    expect(forbiddenUsers.status).toBe(403);

    const overview = await api.get('/api/v1/admin/overview').set(authHeader(admin.token));
    const users = await api.get('/api/v1/admin/users').set(authHeader(admin.token));

    expect(overview.status).toBe(200);
    expect(overview.body.overview.users).toBeGreaterThanOrEqual(2);
    expect(users.status).toBe(200);
    expect(users.body.pagination.total).toBeGreaterThanOrEqual(2);
  });

  it('busca usuarios y devuelve el detalle sin secretos', async () => {
    const admin = await makeAdmin();
    const target = await createMatchUser({ country: 'CL' });

    const list = await api
      .get('/api/v1/admin/users')
      .query({ search: target.user.username })
      .set(authHeader(admin.token));

    expect(list.status).toBe(200);
    expect(list.body.users).toHaveLength(1);
    expect(list.body.users[0].username).toBe(target.user.username);
    expect(list.body.users[0].email).toBe(target.user.email);
    expect(list.body.users[0].profileCompleted).toBe(true);

    const detail = await api
      .get(`/api/v1/admin/users/${target.user.id}`)
      .set(authHeader(admin.token));

    expect(detail.status).toBe(200);
    expect(detail.body.user.profile.country).toBe('CL');
    expect(detail.body.user.profile.riotId).toBeTruthy();
    expect(detail.body.user.password).toBeUndefined();
    expect(detail.body.user.emailVerificationToken).toBeUndefined();
    expect(detail.body.user.stats).toHaveProperty('openReports');
    expect(detail.body.user.reports).toEqual(expect.any(Array));
  });

  it('valida filtros y usuarios inexistentes', async () => {
    const admin = await makeAdmin();

    const invalid = await api
      .get('/api/v1/admin/users')
      .query({ account: 'cualquiera' })
      .set(authHeader(admin.token));
    const missing = await api
      .get('/api/v1/admin/users/00000000-0000-4000-8000-000000000000')
      .set(authHeader(admin.token));

    expect(invalid.status).toBe(422);
    expect(missing.status).toBe(404);
  });
});

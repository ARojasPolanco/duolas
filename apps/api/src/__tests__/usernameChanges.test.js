import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import sequelize from '../config/database/database.js';
import { runMigrations } from '../config/database/migrator.js';
import User from '../modules/auth/auth.model.js';
import { authHeader, createMatchUser, registerUser, uniqueUsername } from './helpers/fixtures.js';

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

describe('Cambio de username', () => {
  it('rechaza usernames reservados en el registro', async () => {
    const res = await registerUser({ username: 'DUOLAS' });

    expect(res.res.status).toBe(422);
    expect(res.res.body.message).toContain('reservado');
  });

  it('permite que un admin solicite, el usuario proponga y el admin apruebe', async () => {
    const admin = await makeAdmin();
    const target = await createMatchUser();
    const suggested = uniqueUsername();

    const created = await api
      .post(`/api/v1/admin/users/${target.user.id}/username-request`)
      .set(authHeader(admin.token))
      .send({ note: 'Tu nombre puede confundirse con la marca.' });

    expect(created.status).toBe(201);
    expect(created.body.request.status).toBe('pending_user');

    const requestId = created.body.request.id;

    const mine = await api.get('/api/v1/username-changes/mine').set(authHeader(target.token));

    expect(mine.status).toBe(200);
    expect(mine.body.request.id).toBe(requestId);
    expect(mine.body.currentUsername).toBe(target.user.username);

    const reserved = await api
      .post(`/api/v1/username-changes/${requestId}/suggest`)
      .set(authHeader(target.token))
      .send({ username: 'admin' });

    expect(reserved.status).toBe(422);

    const suggestedRes = await api
      .post(`/api/v1/username-changes/${requestId}/suggest`)
      .set(authHeader(target.token))
      .send({ username: suggested });

    expect(suggestedRes.status).toBe(200);
    expect(suggestedRes.body.request.status).toBe('pending_admin');

    const detail = await api
      .get(`/api/v1/admin/users/${target.user.id}`)
      .set(authHeader(admin.token));

    expect(detail.status).toBe(200);
    expect(detail.body.user.usernameChangeRequest.status).toBe('pending_admin');
    expect(detail.body.user.usernameChangeRequest.suggestedUsername).toBe(suggested);

    const approved = await api
      .post(`/api/v1/admin/username-changes/${requestId}/approve`)
      .set(authHeader(admin.token))
      .send({ note: 'Aprobado.' });

    expect(approved.status).toBe(200);
    expect(approved.body.username).toBe(suggested);
    expect(approved.body.request.status).toBe('approved');

    const profile = await api.get('/api/v1/auth/profile').set(authHeader(target.token));

    expect(profile.status).toBe(200);
    expect(profile.body.user.username).toBe(suggested);
  });

  it('no permite que otro usuario proponga un nombre', async () => {
    const admin = await makeAdmin();
    const target = await createMatchUser();
    const other = await createMatchUser();

    const created = await api
      .post(`/api/v1/admin/users/${target.user.id}/username-request`)
      .set(authHeader(admin.token))
      .send({});

    expect(created.status).toBe(201);

    const res = await api
      .post(`/api/v1/username-changes/${created.body.request.id}/suggest`)
      .set(authHeader(other.token))
      .send({ username: uniqueUsername() });

    expect(res.status).toBe(404);
  });

  it('impide que un jugador cree solicitudes desde admin', async () => {
    const player = await createMatchUser();
    const target = await createMatchUser();

    const res = await api
      .post(`/api/v1/admin/users/${target.user.id}/username-request`)
      .set(authHeader(player.token))
      .send({});

    expect(res.status).toBe(403);
  });
});

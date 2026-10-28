import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import sequelize from '../config/database/database.js';
import { runMigrations } from '../config/database/migrator.js';
import User from '../modules/auth/auth.model.js';
import { accountService } from '../modules/auth/account.service.js';
import PlayerProfile from '../modules/profiles/profile.model.js';
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

describe('Eliminación de cuenta', () => {
  it('programa la baja, invalida la sesión, permite recuperarla y purga al vencer', async () => {
    const account = await createMatchUser({ scheduleBlocks: ['sun_early'] });
    const email = account.user.email;
    const password = 'password123';

    const wrongPassword = await api
      .delete('/api/v1/auth/account')
      .set(authHeader(account.token))
      .send({ password: 'incorrecta' });

    expect(wrongPassword.status).toBe(401);

    const deleted = await api
      .delete('/api/v1/auth/account')
      .set(authHeader(account.token))
      .send({ password });

    expect(deleted.status).toBe(200);
    expect(deleted.body.deletionScheduledFor).toBeTruthy();

    const oldSession = await api.get('/api/v1/auth/profile').set(authHeader(account.token));
    expect(oldSession.status).toBe(401);

    const blockedRegistration = await api.post('/api/v1/auth/register').send({
      username: account.user.username,
      email,
      password,
      ageConfirmed: true,
      termsAccepted: true,
    });

    expect(blockedRegistration.status).toBe(409);
    expect(blockedRegistration.body.message).toMatch(/pendiente de eliminación/);

    const recovered = await api.post('/api/v1/auth/login').send({
      identifier: email,
      password,
    });

    expect(recovered.status).toBe(200);
    expect(recovered.body.recovered).toBe(true);

    const recoveredSession = await api
      .get('/api/v1/auth/profile')
      .set(authHeader(recovered.body.token));

    expect(recoveredSession.status).toBe(200);

    await User.update(
      {
        isDeleted: true,
        deletionRequestedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
        deletionScheduledFor: new Date(Date.now() - 1000),
      },
      { where: { id: account.user.id } }
    );

    await accountService.purgeExpiredDeletions();

    const purgedUser = await User.findByPk(account.user.id);
    expect(purgedUser.isDeleted).toBe(true);
    expect(purgedUser.email).toContain('@deleted.duolas.invalid');
    expect(purgedUser.username.startsWith('deleted_')).toBe(true);

    const purgedProfile = await PlayerProfile.findOne({
      where: { userId: account.user.id },
    });
    expect(purgedProfile).toBeNull();

    const loginAfterPurge = await api.post('/api/v1/auth/login').send({
      identifier: email,
      password,
    });
    expect(loginAfterPurge.status).toBe(401);
  });
});

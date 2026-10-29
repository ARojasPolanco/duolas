import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import sequelize from '../config/database/database.js';
import { runMigrations } from '../config/database/migrator.js';
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

describe('ARAM', () => {
  it('publica un grupo, recibe una postulación y crea la conexión al aceptar', async () => {
    const owner = await createMatchUser();
    const applicant = await createMatchUser();

    const created = await api.post('/api/v1/aram').set(authHeader(owner.token)).send({
      mode: 'group',
      playersPresent: 3,
      slotsNeeded: 2,
      window: 'now',
      hasMic: true,
      note: 'Buscamos support para ARAM.',
    });

    expect(created.status).toBe(201);
    expect(created.body.post.mode).toBe('group');
    expect(created.body.post.slotsNeeded).toBe(2);

    const postId = created.body.post.id;

    const list = await api
      .get('/api/v1/aram')
      .query({ mode: 'group' })
      .set(authHeader(applicant.token));

    expect(list.status).toBe(200);
    expect(list.body.posts.some((post) => post.id === postId)).toBe(true);

    const applied = await api
      .post(`/api/v1/aram/${postId}/applications`)
      .set(authHeader(applicant.token))
      .send({ message: 'Juego support.' });

    expect(applied.status).toBe(201);
    expect(applied.body.application.status).toBe('pending');

    const mine = await api.get('/api/v1/aram/mine').set(authHeader(owner.token));

    expect(mine.status).toBe(200);
    expect(mine.body.post.id).toBe(postId);
    expect(mine.body.applications).toHaveLength(1);
    expect(mine.body.applications[0].applicant.username).toBe(applicant.user.username);

    const accepted = await api
      .post(`/api/v1/aram/${postId}/applications/${applied.body.application.id}/accept`)
      .set(authHeader(owner.token));

    expect(accepted.status).toBe(200);
    expect(accepted.body.remainingSlots).toBe(1);

    const matches = await api.get('/api/v1/matching/matches').set(authHeader(applicant.token));

    expect(matches.status).toBe(200);
    expect(
      matches.body.matches.some(
        (match) => match.source === 'aram' && match.other.username === owner.user.username
      )
    ).toBe(true);

    const ownerMine = await api.get('/api/v1/aram/mine').set(authHeader(owner.token));

    expect(ownerMine.body.post.slotsNeeded).toBe(1);
    expect(ownerMine.body.post.status).toBe('active');
  });

  it('valida la forma del grupo y permite disponibilidad individual', async () => {
    const owner = await createMatchUser();
    const invalid = await api.post('/api/v1/aram').set(authHeader(owner.token)).send({
      mode: 'group',
      playersPresent: 3,
      slotsNeeded: 3,
      window: 'tonight',
      hasMic: false,
    });

    expect(invalid.status).toBe(422);

    const solo = await api.post('/api/v1/aram').set(authHeader(owner.token)).send({
      mode: 'solo',
      playersPresent: 1,
      slotsNeeded: 1,
      window: 'tonight',
      hasMic: false,
      note: 'ARAM relaxed.',
    });

    expect(solo.status).toBe(201);
    expect(solo.body.post.mode).toBe('solo');
    expect(solo.body.post.window).toBe('tonight');
    expect(solo.body.post.playersPresent).toBe(1);
  });
});

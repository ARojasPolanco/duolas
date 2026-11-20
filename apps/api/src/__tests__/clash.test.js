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

describe('Clash LFG', () => {
  it('crea un equipo, recibe una postulación, acepta y revela el contacto', async () => {
    const owner = await createMatchUser({
      scheduleBlocks: ['sat_night'],
      primaryRole: 'mid',
      secondaryRole: 'adc',
    });
    const applicant = await createMatchUser({
      scheduleBlocks: ['sat_night'],
      primaryRole: 'jungle',
      secondaryRole: 'top',
    });

    const created = await api
      .post('/api/v1/clash/posts')
      .set(authHeader(owner.token))
      .send({
        teamName: 'Los Pibes del Clash',
        day: 'saturday',
        captainRole: 'mid',
        rolesNeeded: ['jungle'],
        rankMinTier: 'bronze',
        rankMaxTier: 'challenger',
        note: 'Buscamos jungla con mic.',
      });

    expect(created.status).toBe(201);
    expect(created.body.post.teamSize).toBe(1);
    expect(created.body.post.rolesRemaining).toEqual(['jungle']);

    const postId = created.body.post.id;

    const list = await api.get('/api/v1/clash/posts').set(authHeader(applicant.token));
    expect(list.status).toBe(200);
    expect(list.body.posts.some((post) => post.id === postId)).toBe(true);
    expect(list.body.posts[0].owner.riotId).toBeUndefined();

    const applied = await api
      .post(`/api/v1/clash/posts/${postId}/apply`)
      .set(authHeader(applicant.token))
      .send({ role: 'jungle', message: 'Jungla main, tengo mic.' });
    expect(applied.status).toBe(201);

    const applications = await api
      .get(`/api/v1/clash/posts/${postId}/applications`)
      .set(authHeader(owner.token));
    expect(applications.status).toBe(200);
    expect(applications.body.applications).toHaveLength(1);
    expect(applications.body.applications[0].applicant.riotId).toBeUndefined();

    const accepted = await api
      .post(
        `/api/v1/clash/posts/${postId}/applications/${applications.body.applications[0].id}/accept`
      )
      .set(authHeader(owner.token));
    expect(accepted.status).toBe(200);
    expect(accepted.body.connection.source).toBe('clash');

    const myApplications = await api
      .get('/api/v1/clash/applications')
      .set(authHeader(applicant.token));
    expect(myApplications.status).toBe(200);
    expect(myApplications.body.applications[0].status).toBe('accepted');
    expect(myApplications.body.applications[0].contact.riotId).toBeTruthy();

    const mine = await api.get('/api/v1/clash/mine').set(authHeader(owner.token));
    expect(mine.status).toBe(200);
    expect(mine.body.posts[0].status).toBe('filled');
    expect(mine.body.posts[0].teamSize).toBe(2);
  });
});

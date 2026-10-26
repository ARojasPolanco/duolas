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

const openAvailability = (token, overrides = {}) =>
  api
    .post('/api/v1/availability')
    .set(authHeader(token))
    .send({
      roles: ['support'],
      queue: 'solo_duo',
      note: 'Juego ahora.',
      ttlMinutes: 30,
      ...overrides,
    });

const listAvailability = (token, query = '') =>
  api.get(`/api/v1/availability${query}`).set(authHeader(token));

const getMyAvailability = (token) => api.get('/api/v1/availability/me').set(authHeader(token));

const closeAvailability = (token) => api.delete('/api/v1/availability').set(authHeader(token));

const sendInvite = (token, availabilityId, overrides = {}) =>
  api
    .post(`/api/v1/availability/${availabilityId}/invite`)
    .set(authHeader(token))
    .send({ role: 'support', message: '¿Jugamos?', ...overrides });

const listInvites = (token, box = 'incoming') =>
  api.get(`/api/v1/invites?box=${box}`).set(authHeader(token));

const respondInvite = (token, inviteId, action) =>
  api.post(`/api/v1/invites/${inviteId}/${action}`).set(authHeader(token));

const createPost = (token, overrides = {}) =>
  api
    .post('/api/v1/duo-posts')
    .set(authHeader(token))
    .send({
      queue: 'flex',
      rolesNeeded: ['support'],
      rankMinTier: 'diamond',
      rankMaxTier: 'diamond',
      note: 'Falta support.',
      ...overrides,
    });

const listPosts = (token, query = '') =>
  api.get(`/api/v1/duo-posts${query}`).set(authHeader(token));

const applyToPost = (token, postId, message = 'Puedo support.') =>
  api.post(`/api/v1/duo-posts/${postId}/apply`).set(authHeader(token)).send({ message });

const getApplications = (token, postId) =>
  api.get(`/api/v1/duo-posts/${postId}/applications`).set(authHeader(token));

const acceptApplication = (token, postId, applicationId) =>
  api
    .post(`/api/v1/duo-posts/${postId}/applications/${applicationId}/accept`)
    .set(authHeader(token));

const rejectApplication = (token, postId, applicationId) =>
  api
    .post(`/api/v1/duo-posts/${postId}/applications/${applicationId}/reject`)
    .set(authHeader(token));

const withdrawApplication = (token, postId, applicationId) =>
  api.delete(`/api/v1/duo-posts/${postId}/applications/${applicationId}`).set(authHeader(token));

const notifications = (token) => api.get('/api/v1/notifications').set(authHeader(token));
const matches = (token) => api.get('/api/v1/matching/matches').set(authHeader(token));

describe('Disponible ya', () => {
  it('abre, lista, invita, acepta y cierra la disponibilidad', async () => {
    const target = await createMatchUser({
      primaryRole: 'support',
      secondaryRole: 'top',
    });
    const viewer = await createMatchUser({
      primaryRole: 'mid',
      secondaryRole: 'jungle',
    });

    const opened = await openAvailability(target.token);
    expect(opened.status).toBe(201);
    expect(opened.body.session.status).toBe('active');

    const mine = await getMyAvailability(target.token);
    expect(mine.body.session.id).toBe(opened.body.session.id);

    const list = await listAvailability(viewer.token);
    expect(list.status).toBe(200);
    const card = list.body.players.find((item) => item.profile.id === target.user.id);
    expect(card).toBeTruthy();
    expect(card.session.id).toBe(opened.body.session.id);
    expect(card.profile.riotId).toBeUndefined();
    expect(card.profile.discordTag).toBeUndefined();

    const invite = await sendInvite(viewer.token, opened.body.session.id);
    expect(invite.status).toBe(201);

    const incoming = await listInvites(target.token);
    expect(incoming.body.invites.some((item) => item.id === invite.body.invite.id)).toBe(true);

    const accepted = await respondInvite(target.token, invite.body.invite.id, 'accept');
    expect(accepted.status).toBe(200);
    expect(accepted.body.contact.riotId).toBe(viewer.profile.riotId);

    const targetMatches = await matches(target.token);
    expect(targetMatches.body.matches.some((item) => item.other.id === viewer.user.id)).toBe(true);

    const after = await getMyAvailability(target.token);
    expect(after.body.session).toBeNull();

    const listAfter = await listAvailability(viewer.token);
    expect(listAfter.body.players.some((item) => item.profile.id === target.user.id)).toBe(false);
  });

  it('permite cerrar manualmente y rechaza invitarse a uno mismo', async () => {
    const target = await createMatchUser({
      primaryRole: 'support',
      secondaryRole: 'top',
    });

    await openAvailability(target.token);
    const closed = await closeAvailability(target.token);
    const mine = await getMyAvailability(target.token);

    expect(closed.status).toBe(200);
    expect(mine.body.session).toBeNull();

    const reopened = await openAvailability(target.token);
    const selfInvite = await sendInvite(target.token, reopened.body.session.id);

    expect(selfInvite.status).toBe(400);
  });

  it('valida TTL, roles y cola', async () => {
    const target = await createMatchUser({
      primaryRole: 'support',
      secondaryRole: 'top',
    });

    const badTtl = await openAvailability(target.token, { ttlMinutes: 15 });
    const badRole = await openAvailability(target.token, { roles: ['invalid'] });
    const badQueue = await openAvailability(target.token, { queue: 'invalid' });

    expect(badTtl.status).toBe(422);
    expect(badRole.status).toBe(422);
    expect(badQueue.status).toBe(422);
  });
});

describe('Invitaciones', () => {
  it('permite rechazar y cancelar, y limita reenviar a la misma persona', async () => {
    const target = await createMatchUser({
      primaryRole: 'support',
      secondaryRole: 'top',
    });
    const viewer = await createMatchUser({
      primaryRole: 'mid',
      secondaryRole: 'jungle',
    });

    const opened = await openAvailability(target.token);
    const invite = await sendInvite(viewer.token, opened.body.session.id);
    const declined = await respondInvite(target.token, invite.body.invite.id, 'decline');

    expect(declined.status).toBe(200);

    const senderNotifications = await notifications(viewer.token);
    expect(
      senderNotifications.body.notifications.some((item) => item.type === 'invite_declined')
    ).toBe(true);

    const tooSoon = await sendInvite(viewer.token, opened.body.session.id);
    expect(tooSoon.status).toBe(429);

    const secondTarget = await createMatchUser({
      primaryRole: 'support',
      secondaryRole: 'top',
    });
    const secondOpened = await openAvailability(secondTarget.token);
    const second = await sendInvite(viewer.token, secondOpened.body.session.id);
    const cancelled = await respondInvite(viewer.token, second.body.invite.id, 'cancel');

    expect(cancelled.status).toBe(200);

    const recipientNotifications = await notifications(secondTarget.token);
    expect(
      recipientNotifications.body.notifications.some((item) => item.type === 'invite_cancelled')
    ).toBe(true);

    const resolved = await respondInvite(target.token, invite.body.invite.id, 'accept');
    expect(resolved.status).toBe(409);
  });

  it('no permite invitar a alguien bloqueado', async () => {
    const target = await createMatchUser({
      primaryRole: 'support',
      secondaryRole: 'top',
    });
    const viewer = await createMatchUser({
      primaryRole: 'mid',
      secondaryRole: 'jungle',
    });

    const opened = await openAvailability(target.token);
    await api.post('/api/v1/blocks').set(authHeader(viewer.token)).send({ userId: target.user.id });

    const res = await sendInvite(viewer.token, opened.body.session.id);

    expect(res.status).toBe(403);
  });
});

describe('Busco 1', () => {
  it('publica, postula, acepta y crea la conexión', async () => {
    const owner = await createMatchUser({
      primaryRole: 'mid',
      secondaryRole: 'jungle',
    });
    const first = await createMatchUser({
      primaryRole: 'support',
      secondaryRole: 'top',
    });
    const second = await createMatchUser({
      primaryRole: 'support',
      secondaryRole: 'adc',
    });

    const created = await createPost(owner.token);
    expect(created.status).toBe(201);
    expect(created.body.post.status).toBe('active');

    const list = await listPosts(first.token);
    expect(list.body.posts.some((item) => item.id === created.body.post.id)).toBe(true);

    const firstApply = await applyToPost(first.token, created.body.post.id);
    const secondApply = await applyToPost(second.token, created.body.post.id);

    expect(firstApply.status).toBe(201);
    expect(secondApply.status).toBe(201);

    const applications = await getApplications(owner.token, created.body.post.id);
    expect(applications.status).toBe(200);
    expect(applications.body.applications).toHaveLength(2);
    expect(applications.body.applications[0].score).toBeGreaterThanOrEqual(0);

    const accepted = await acceptApplication(
      owner.token,
      created.body.post.id,
      firstApply.body.application.id
    );

    expect(accepted.status).toBe(200);
    expect(accepted.body.contact.riotId).toBe(first.profile.riotId);

    const applicantMatches = await matches(first.token);
    expect(applicantMatches.body.matches.some((item) => item.other.id === owner.user.id)).toBe(
      true
    );

    const mine = await api.get('/api/v1/duo-posts/mine').set(authHeader(owner.token));
    const filled = mine.body.posts.find((item) => item.id === created.body.post.id);
    expect(filled.status).toBe('filled');
    expect(filled.applicationsCount).toBe(2);

    const rejectedNotifications = await notifications(second.token);
    expect(
      rejectedNotifications.body.notifications.some((item) => item.type === 'application_rejected')
    ).toBe(true);

    const detail = await api
      .get(`/api/v1/duo-posts/${created.body.post.id}`)
      .set(authHeader(second.token));
    expect(detail.status).toBe(404);
  });

  it('rechaza postulaciones por rango, rol, duplicado y post lleno', async () => {
    const owner = await createMatchUser({
      primaryRole: 'mid',
      secondaryRole: 'jungle',
    });
    const compatible = await createMatchUser({
      primaryRole: 'support',
      secondaryRole: 'top',
    });
    const lowRank = await createMatchUser({
      primaryRole: 'support',
      secondaryRole: 'top',
      rankTier: 'iron',
      rankDivision: 'iv',
    });
    const wrongRole = await createMatchUser({
      primaryRole: 'adc',
      secondaryRole: 'mid',
    });

    const created = await createPost(owner.token);
    const postId = created.body.post.id;

    const low = await applyToPost(lowRank.token, postId);
    const role = await applyToPost(wrongRole.token, postId);
    const ok = await applyToPost(compatible.token, postId);
    const duplicate = await applyToPost(compatible.token, postId);

    expect(low.status).toBe(422);
    expect(role.status).toBe(422);
    expect(ok.status).toBe(201);
    expect(duplicate.status).toBe(409);

    await acceptApplication(owner.token, postId, ok.body.application.id);

    const afterFilled = await applyToPost(lowRank.token, postId);
    expect(afterFilled.status).toBe(409);
  });

  it('permite retirar y rechazar postulaciones, y cerrar el post', async () => {
    const owner = await createMatchUser({
      primaryRole: 'mid',
      secondaryRole: 'jungle',
    });
    const first = await createMatchUser({
      primaryRole: 'support',
      secondaryRole: 'top',
    });
    const second = await createMatchUser({
      primaryRole: 'support',
      secondaryRole: 'adc',
    });

    const created = await createPost(owner.token);
    const postId = created.body.post.id;

    const firstApply = await applyToPost(first.token, postId);
    const secondApply = await applyToPost(second.token, postId);

    const withdrawn = await withdrawApplication(
      first.token,
      postId,
      firstApply.body.application.id
    );
    expect(withdrawn.status).toBe(200);

    const applications = await getApplications(owner.token, postId);
    const withdrawnApp = applications.body.applications.find(
      (item) => item.id === firstApply.body.application.id
    );
    expect(withdrawnApp.status).toBe('withdrawn');

    const rejected = await rejectApplication(owner.token, postId, secondApply.body.application.id);
    expect(rejected.status).toBe(200);

    const secondNotifications = await notifications(second.token);
    expect(
      secondNotifications.body.notifications.some((item) => item.type === 'application_rejected')
    ).toBe(true);

    const cancelled = await api.delete(`/api/v1/duo-posts/${postId}`).set(authHeader(owner.token));
    expect(cancelled.status).toBe(200);

    const list = await listPosts(first.token);
    expect(list.body.posts.some((item) => item.id === postId)).toBe(false);
  });

  it('limita a una publicación activa por cola y valida el rango', async () => {
    const owner = await createMatchUser({
      primaryRole: 'mid',
      secondaryRole: 'jungle',
    });

    const flex = await createPost(owner.token);
    const duplicateFlex = await createPost(owner.token);
    const solo = await createPost(owner.token, { queue: 'solo_duo' });

    expect(flex.status).toBe(201);
    expect(duplicateFlex.status).toBe(409);
    expect(solo.status).toBe(201);

    const invalidRange = await createPost(owner.token, {
      queue: 'flex',
      rankMinTier: 'platinum',
      rankMaxTier: 'gold',
    });
    expect(invalidRange.status).toBe(422);
  });

  it('solo el dueño ve postulaciones y no puede aceptar una ajena', async () => {
    const owner = await createMatchUser({
      primaryRole: 'mid',
      secondaryRole: 'jungle',
    });
    const applicant = await createMatchUser({
      primaryRole: 'support',
      secondaryRole: 'top',
    });

    const created = await createPost(owner.token);
    const applied = await applyToPost(applicant.token, created.body.post.id);

    const forbidden = await getApplications(applicant.token, created.body.post.id);
    const forbiddenAccept = await acceptApplication(
      applicant.token,
      created.body.post.id,
      applied.body.application.id
    );

    expect(forbidden.status).toBe(403);
    expect(forbiddenAccept.status).toBe(404);
  });
});

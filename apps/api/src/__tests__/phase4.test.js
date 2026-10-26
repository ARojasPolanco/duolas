import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import sequelize from '../config/database/database.js';
import { runMigrations } from '../config/database/migrator.js';
import User from '../modules/auth/auth.model.js';
import DuoConnection from '../modules/matching/duoConnection.model.js';
import Feedback from '../modules/trust/feedback.model.js';
import Sanction from '../modules/trust/sanction.model.js';
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

const like = (token, targetUserId) =>
  api.post('/api/v1/matching/likes').set(authHeader(token)).send({ targetUserId });

const matches = (token) => api.get('/api/v1/matching/matches').set(authHeader(token));

const connectPair = async () => {
  const a = await createMatchUser({
    scheduleBlocks: ['sun_early'],
    primaryRole: 'mid',
    secondaryRole: 'jungle',
  });
  const b = await createMatchUser({
    scheduleBlocks: ['sun_early'],
    primaryRole: 'support',
    secondaryRole: 'top',
  });

  await like(a.token, b.user.id);
  const mutual = await like(b.token, a.user.id);
  const aMatches = await matches(a.token);

  return {
    a,
    b,
    connectionId: mutual.body.connection.id,
    connection: aMatches.body.matches[0],
  };
};

const submitFeedback = (token, connectionId, overrides = {}) =>
  api
    .post('/api/v1/feedback')
    .set(authHeader(token))
    .send({
      connectionId,
      sentiment: 'positive',
      tags: ['good_vibes'],
      comment: 'Muy buena onda.',
      ...overrides,
    });

const feedbackDetail = (token, connectionId) =>
  api.get(`/api/v1/feedback/connection/${connectionId}`).set(authHeader(token));

const pendingFeedback = (token) => api.get('/api/v1/feedback/pending').set(authHeader(token));

const notifications = (token) => api.get('/api/v1/notifications').set(authHeader(token));

const reportUser = (token, overrides = {}) =>
  api
    .post('/api/v1/reports')
    .set(authHeader(token))
    .send({
      reportedUserId: overrides.reportedUserId,
      reason: 'toxicity',
      details: 'Insultó en la partida.',
      ...overrides,
    });

const adminReports = (token, query = '') =>
  api.get(`/api/v1/admin/reports${query}`).set(authHeader(token));

const resolveReport = (token, reportId, overrides = {}) =>
  api
    .post(`/api/v1/admin/reports/${reportId}/resolve`)
    .set(authHeader(token))
    .send({ resolution: 'warned', note: 'Advertencia formal.', ...overrides });

const makeAdmin = async (user) => {
  await User.update({ role: 'admin' }, { where: { id: user.id } });
};

describe('Feedback y reputación', () => {
  it('mantiene el doble ciego, revela al completar ambos y recalcula reputación', async () => {
    const { a, b, connectionId } = await connectPair();

    const pending = await pendingFeedback(a.token);
    expect(pending.status).toBe(200);
    expect(pending.body.pending.some((item) => item.connection.id === connectionId)).toBe(true);

    const mineBefore = await feedbackDetail(a.token, connectionId);
    expect(mineBefore.body.revealed).toBe(false);
    expect(mineBefore.body.mine).toBeNull();

    const first = await submitFeedback(a.token, connectionId);
    expect(first.status).toBe(201);
    expect(first.body.revealed).toBe(false);

    const aAfterFirst = await feedbackDetail(a.token, connectionId);
    expect(aAfterFirst.body.revealed).toBe(false);
    expect(aAfterFirst.body.mine.sentiment).toBe('positive');
    expect(aAfterFirst.body.theirs).toBeNull();

    const bBeforeSecond = await feedbackDetail(b.token, connectionId);
    expect(bBeforeSecond.body.revealed).toBe(false);
    expect(bBeforeSecond.body.theirs).toBeNull();

    const bMatches = await matches(b.token);
    expect(bMatches.body.matches[0].feedback).toEqual({
      mine: 'pending',
      theirs: 'submitted',
      revealed: false,
    });

    const second = await submitFeedback(b.token, connectionId, {
      sentiment: 'negative',
      tags: ['toxicity'],
      comment: 'No fue respetuoso.',
    });

    expect(second.status).toBe(201);
    expect(second.body.revealed).toBe(true);

    const aFinal = await feedbackDetail(a.token, connectionId);
    const bFinal = await feedbackDetail(b.token, connectionId);

    expect(aFinal.body.revealed).toBe(true);
    expect(aFinal.body.theirs.sentiment).toBe('negative');
    expect(bFinal.body.revealed).toBe(true);
    expect(bFinal.body.theirs.sentiment).toBe('positive');

    const aProfile = await api.get(`/api/v1/profiles/${a.user.id}`).set(authHeader(a.token));
    const bProfile = await api.get(`/api/v1/profiles/${b.user.id}`).set(authHeader(a.token));

    expect(aProfile.body.profile.reputation.score).toBe(40);
    expect(bProfile.body.profile.reputation.score).toBe(60);

    const aNotifications = await notifications(a.token);
    const bNotifications = await notifications(b.token);

    expect(
      aNotifications.body.notifications.some((item) => item.type === 'feedback_revealed')
    ).toBe(true);
    expect(
      bNotifications.body.notifications.some((item) => item.type === 'feedback_revealed')
    ).toBe(true);

    const duplicate = await submitFeedback(a.token, connectionId);
    expect(duplicate.status).toBe(409);

    const bMatchesFinal = await matches(b.token);
    expect(bMatchesFinal.body.matches[0].feedback.revealed).toBe(true);
  });

  it('valida ventana, motivo negativo, participante y revelado por vencimiento', async () => {
    const { a, b, connectionId } = await connectPair();

    const invalidNegative = await submitFeedback(a.token, connectionId, {
      sentiment: 'negative',
      tags: [],
    });
    expect(invalidNegative.status).toBe(422);

    const outsider = await createMatchUser({
      scheduleBlocks: ['mon_early'],
      primaryRole: 'adc',
      secondaryRole: 'support',
    });
    const forbidden = await feedbackDetail(outsider.token, connectionId);
    expect(forbidden.status).toBe(404);

    const { a: lateA, connectionId: lateConnectionId } = await connectPair();
    await DuoConnection.update(
      { contactRevealedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
      { where: { id: lateConnectionId } }
    );

    const closed = await submitFeedback(lateA.token, lateConnectionId);
    expect(closed.status).toBe(409);

    const { a: dueA, b: dueB, connectionId: dueConnectionId } = await connectPair();
    await DuoConnection.update(
      { contactRevealedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
      { where: { id: dueConnectionId } }
    );
    await Feedback.create({
      connectionId: dueConnectionId,
      authorId: dueA.user.id,
      targetId: dueB.user.id,
      sentiment: 'positive',
      tags: ['good_vibes'],
      comment: 'Buen duo.',
      visibleAt: null,
    });

    const dueDetail = await feedbackDetail(dueB.token, dueConnectionId);
    expect(dueDetail.status).toBe(200);
    expect(dueDetail.body.revealed).toBe(true);
    expect(dueDetail.body.theirs.sentiment).toBe('positive');

    const dueProfile = await api
      .get(`/api/v1/profiles/${dueB.user.id}`)
      .set(authHeader(dueB.token));
    expect(dueProfile.body.profile.reputation.score).toBe(60);

    expect(a.user.id).not.toBe(b.user.id);
  });
});

describe('Reportes', () => {
  it('reporta, auto-bloquea, archiva conexión y evita duplicados', async () => {
    const { a, b, connectionId } = await connectPair();

    const created = await reportUser(a.token, { reportedUserId: b.user.id });
    expect(created.status).toBe(201);
    expect(created.body.blocked).toBe(true);
    expect(created.body.report.status).toBe('open');

    const duplicate = await reportUser(a.token, { reportedUserId: b.user.id });
    expect(duplicate.status).toBe(409);

    const blocks = await api.get('/api/v1/blocks').set(authHeader(a.token));
    expect(blocks.body.blocks.some((item) => item.user.id === b.user.id)).toBe(true);

    const aMatches = await matches(a.token);
    expect(aMatches.body.matches.some((item) => item.id === connectionId)).toBe(false);

    const self = await reportUser(a.token, { reportedUserId: a.user.id });
    expect(self.status).toBe(400);

    const otherWithoutDetails = await reportUser(a.token, {
      reportedUserId: (await createMatchUser()).user.id,
      reason: 'other',
      details: null,
    });
    expect(otherWithoutDetails.status).toBe(422);

    const target = await createMatchUser();
    const other = await reportUser(a.token, {
      reportedUserId: target.user.id,
      reason: 'other',
      details: 'Spam en el chat.',
    });
    expect(other.status).toBe(201);

    const underageTarget = await createMatchUser();
    const underage = await reportUser(a.token, {
      reportedUserId: underageTarget.user.id,
      reason: 'underage',
      details: null,
    });
    expect(underage.status).toBe(201);
    expect(underage.body.report.priority).toBe(true);
  });
});

describe('Admin y sanciones', () => {
  it('lista reportes, advierte, suspende y registra sanciones', async () => {
    const admin = await createMatchUser();
    await makeAdmin(admin.user);
    const reporter = await createMatchUser();
    const reported = await createMatchUser();

    const report = await reportUser(reporter.token, {
      reportedUserId: reported.user.id,
    });
    expect(report.status).toBe(201);

    const forbidden = await adminReports(reporter.token);
    expect(forbidden.status).toBe(403);

    const list = await adminReports(admin.token);
    expect(list.status).toBe(200);
    expect(list.body.reports.some((item) => item.id === report.body.report.id)).toBe(true);

    const warned = await resolveReport(admin.token, report.body.report.id);
    expect(warned.status).toBe(200);
    expect(warned.body.report.status).toBe('resolved');
    expect(warned.body.user.warningCount).toBe(1);

    const userAfterWarning = await User.findByPk(reported.user.id);
    expect(userAfterWarning.warningCount).toBe(1);

    const warningNotifications = await notifications(reported.token);
    expect(
      warningNotifications.body.notifications.some((item) => item.type === 'warning_received')
    ).toBe(true);

    const resolvedAgain = await resolveReport(admin.token, report.body.report.id);
    expect(resolvedAgain.status).toBe(409);

    const directWarn = await api
      .post(`/api/v1/admin/users/${reported.user.id}/warn`)
      .set(authHeader(admin.token))
      .send({ reason: 'Lenguaje agresivo.' });
    expect(directWarn.status).toBe(200);
    expect(directWarn.body.user.warningCount).toBe(2);

    const suspended = await api
      .post(`/api/v1/admin/users/${reported.user.id}/suspend`)
      .set(authHeader(admin.token))
      .send({ days: 7, reason: 'Conducta reiterada.' });
    expect(suspended.status).toBe(200);
    expect(suspended.body.user.status).toBe('suspended');
    expect(suspended.body.user.suspendedUntil).toBeTruthy();

    const suspendedRequest = await api.get('/api/v1/profiles/me').set(authHeader(reported.token));
    expect(suspendedRequest.status).toBe(403);

    const selfSuspend = await api
      .post(`/api/v1/admin/users/${admin.user.id}/suspend`)
      .set(authHeader(admin.token))
      .send({ days: 7, reason: 'Prueba.' });
    expect(selfSuspend.status).toBe(400);

    const invalidDays = await api
      .post(`/api/v1/admin/users/${reported.user.id}/suspend`)
      .set(authHeader(admin.token))
      .send({ days: 15, reason: 'Prueba.' });
    expect(invalidDays.status).toBe(422);

    const permanentTarget = await createMatchUser();
    const permanent = await api
      .post(`/api/v1/admin/users/${permanentTarget.user.id}/suspend`)
      .set(authHeader(admin.token))
      .send({ days: null, reason: 'Reincidencia.' });
    expect(permanent.status).toBe(200);
    expect(permanent.body.user.suspendedUntil).toBeNull();

    const sanctions = await Sanction.count({ where: { userId: reported.user.id } });
    expect(sanctions).toBeGreaterThanOrEqual(3);
  });

  it('permite descartar un reporte sin sancionar', async () => {
    const admin = await createMatchUser();
    await makeAdmin(admin.user);
    const reporter = await createMatchUser();
    const reported = await createMatchUser();

    const report = await reportUser(reporter.token, {
      reportedUserId: reported.user.id,
    });

    const dismissed = await resolveReport(admin.token, report.body.report.id, {
      resolution: 'dismissed',
      note: 'Sin evidencia suficiente.',
    });

    expect(dismissed.status).toBe(200);
    expect(dismissed.body.report.status).toBe('dismissed');
    expect(dismissed.body.user.status).toBe('active');
    expect(dismissed.body.user.warningCount).toBe(0);
  });
});

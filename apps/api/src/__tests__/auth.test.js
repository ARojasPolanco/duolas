import crypto from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import sequelize from '../config/database/database.js';
import { runMigrations } from '../config/database/migrator.js';
import User from '../modules/auth/auth.model.js';
import { authHeader, loginUser, registerUser, uniqueEmail } from './helpers/fixtures.js';

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

describe('Auth', () => {
  describe('POST /api/v1/auth/register', () => {
    it('registra un usuario con +18 y términos aceptados', async () => {
      const { res } = await registerUser();

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeTruthy();
      expect(res.body.user.emailVerified).toBe(false);
      expect(res.body.user.profileCompleted).toBe(false);
    });

    it('normaliza el email a minúsculas', async () => {
      const email = uniqueEmail().toUpperCase();
      const { res } = await registerUser({ email });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe(email.toLowerCase());
    });

    it('rechaza el registro sin confirmar mayoría de edad', async () => {
      const { res } = await registerUser({ ageConfirmed: false });

      expect(res.status).toBe(422);
      expect(res.body.message.toLowerCase()).toContain('mayor');
    });

    it('rechaza el registro sin aceptar términos', async () => {
      const { res } = await registerUser({ termsAccepted: false });

      expect(res.status).toBe(422);
      expect(res.body.message.toLowerCase()).toContain('términos');
    });

    it('rechaza contraseñas cortas', async () => {
      const { res } = await registerUser({ password: 'corta' });

      expect(res.status).toBe(422);
    });

    it('rechaza un email duplicado', async () => {
      const first = await registerUser();
      const second = await registerUser({ email: first.payload.email });

      expect(second.res.status).toBe(409);
    });

    it('rechaza un username duplicado sin distinguir mayúsculas', async () => {
      const first = await registerUser();
      const second = await registerUser({
        username: first.payload.username.toUpperCase(),
      });

      expect(second.res.status).toBe(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('inicia sesión con email', async () => {
      const { payload } = await registerUser();
      const res = await loginUser(payload.email);

      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user.email).toBe(payload.email);
    });

    it('inicia sesión con username', async () => {
      const { payload } = await registerUser();
      const res = await loginUser(payload.username);

      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe(payload.username);
    });

    it('rechaza credenciales incorrectas', async () => {
      const { payload } = await registerUser();
      const res = await loginUser(payload.email, 'otraPassword123');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('incorrectos');
    });

    it('rechaza un usuario inexistente', async () => {
      const res = await loginUser(uniqueEmail());

      expect(res.status).toBe(401);
    });

    it('bloquea a un usuario suspendido', async () => {
      const { user } = await registerUser();
      await User.update(
        { status: 'suspended', suspensionReason: 'Test de sanción' },
        { where: { id: user.id } }
      );

      const res = await loginUser(user.email);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('suspendida');
    });

    it('permite entrar si la suspensión temporal venció y reactiva la cuenta', async () => {
      const { user } = await registerUser();
      await User.update(
        {
          status: 'suspended',
          suspensionReason: 'Test',
          suspendedUntil: new Date(Date.now() - 1000),
        },
        { where: { id: user.id } }
      );

      const res = await loginUser(user.email);
      const refreshed = await User.findByPk(user.id);

      expect(res.status).toBe(200);
      expect(refreshed.status).toBe('active');
      expect(refreshed.suspendedUntil).toBeNull();
    });
  });

  describe('Verificación de email', () => {
    it('verifica con un token válido', async () => {
      const { user } = await registerUser();
      const stored = await User.findByPk(user.id);

      const res = await request(app).get(
        `/api/v1/auth/verify-email?token=${stored.emailVerificationToken}`
      );
      const refreshed = await User.findByPk(user.id);

      expect(res.status).toBe(200);
      expect(refreshed.emailVerified).toBe(true);
      expect(refreshed.emailVerificationToken).toBeNull();
    });

    it('rechaza un token inválido', async () => {
      const res = await request(app).get('/api/v1/auth/verify-email?token=token-invalido');

      expect(res.status).toBe(400);
    });

    it('rechaza un token expirado', async () => {
      const { user } = await registerUser();
      const stored = await User.findByPk(user.id);
      await stored.update({ emailVerificationExpires: new Date(Date.now() - 1000) });

      const res = await request(app).get(
        `/api/v1/auth/verify-email?token=${stored.emailVerificationToken}`
      );

      expect(res.status).toBe(400);
    });

    it('reenvía la verificación y regenera el token', async () => {
      const { token, user } = await registerUser();
      const before = await User.findByPk(user.id);

      const res = await request(app)
        .post('/api/v1/auth/resend-verification')
        .set(authHeader(token));

      const after = await User.findByPk(user.id);

      expect(res.status).toBe(200);
      expect(after.emailVerificationToken).toBeTruthy();
      expect(after.emailVerificationToken).not.toBe(before.emailVerificationToken);
    });
  });

  describe('Reset de contraseña', () => {
    it('responde genérico aunque el email no exista', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: uniqueEmail() });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Si el email está registrado');
    });

    it('restablece la contraseña con un token válido y de un solo uso', async () => {
      const { user } = await registerUser();
      const plainToken = crypto.randomBytes(16).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

      await User.update(
        {
          passwordResetToken: tokenHash,
          passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
        },
        { where: { id: user.id } }
      );

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: plainToken, password: 'nuevaPassword123' });

      const oldLogin = await loginUser(user.email, 'password123');
      const newLogin = await loginUser(user.email, 'nuevaPassword123');
      const used = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: plainToken, password: 'otraPassword123' });

      expect(res.status).toBe(200);
      expect(oldLogin.status).toBe(401);
      expect(newLogin.status).toBe(200);
      expect(used.status).toBe(400);
    });

    it('rechaza un token expirado', async () => {
      const { user } = await registerUser();
      const plainToken = crypto.randomBytes(16).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

      await User.update(
        {
          passwordResetToken: tokenHash,
          passwordResetExpires: new Date(Date.now() - 1000),
        },
        { where: { id: user.id } }
      );

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: plainToken, password: 'nuevaPassword123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('expiró');
    });
  });

  describe('Cambio de contraseña y sesión', () => {
    it('rechaza una request protegida sin token', async () => {
      const res = await request(app).get('/api/v1/auth/profile');

      expect(res.status).toBe(401);
    });

    it('devuelve el perfil de la cuenta autenticada', async () => {
      const { token, user } = await registerUser();
      const res = await request(app).get('/api/v1/auth/profile').set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(user.id);
      expect(res.body.user.email).toBe(user.email);
      expect(res.body.user.password).toBeUndefined();
    });

    it('cambia la contraseña e invalida el token anterior', async () => {
      const { token, user } = await registerUser();
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const change = await request(app)
        .patch('/api/v1/auth/change-password')
        .set(authHeader(token))
        .send({ currentPassword: 'password123', newPassword: 'nuevaPassword123' });

      const oldToken = await request(app).get('/api/v1/auth/profile').set(authHeader(token));
      const newToken = await request(app)
        .get('/api/v1/auth/profile')
        .set(authHeader(change.body.token));
      const login = await loginUser(user.email, 'nuevaPassword123');

      expect(change.status).toBe(200);
      expect(change.body.token).toBeTruthy();
      expect(oldToken.status).toBe(401);
      expect(newToken.status).toBe(200);
      expect(login.status).toBe(200);
    });

    it('rechaza el cambio si la contraseña actual es incorrecta', async () => {
      const { token } = await registerUser();

      const res = await request(app)
        .patch('/api/v1/auth/change-password')
        .set(authHeader(token))
        .send({ currentPassword: 'incorrecta123', newPassword: 'nuevaPassword123' });

      expect(res.status).toBe(401);
    });
  });
});

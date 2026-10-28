import { authService } from './auth.service.js';
import { accountService } from './account.service.js';
import { profileService } from '../profiles/profile.service.js';
import { catchAsync } from '../../errors/catchAsync.js';
import { AppError } from '../../errors/appError.js';
import { generateJWT } from '../../config/plugins/generate-jwt.js';
import { comparePassword } from '../../config/plugins/encrypted-password.js';
import { mailService } from '../../config/resend/resend.js';
import { metricsService } from '../metrics/metrics.service.js';
import { verifyCaptcha } from '../../utils/captcha.js';
import { generateToken, hashToken } from '../../utils/tokens.js';
import logger from '../../config/logger.js';
import {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateDeleteAccount,
  validateForgotPassword,
  validateResetPassword,
} from './auth.schema.js';

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
const DUMMY_PASSWORD_HASH = '$2b$12$M1EYg382FC8RlXrb9EeY1OL8vK.SrHoJbNAnpS5I9mx4oQ5rDK5X2';

const buildAuthUser = (user, profile = null) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  emailVerified: user.emailVerified,
  status: user.status,
  ageConfirmedAt: user.ageConfirmedAt,
  termsAcceptedAt: user.termsAcceptedAt,
  warningCount: user.warningCount,
  country: profile?.country || null,
  profileCompleted: Boolean(profile?.profileCompletedAt),
  createdAt: user.createdAt,
});

const isSuspensionActive = (user, now = new Date()) => {
  if (user.status !== 'suspended') return false;
  if (!user.suspendedUntil) return true;
  return new Date(user.suspendedUntil) > now;
};

const sendMailSafely = async (action, userId) => {
  try {
    await action();
  } catch (error) {
    logger.warn('No se pudo enviar el email', { userId, message: error.message });
  }
};

export const register = catchAsync(async (req, res, next) => {
  const { hasError, errorMessages, data } = validateRegister(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const captchaOk = await verifyCaptcha(data.captchaToken);
  if (!captchaOk) {
    return next(new AppError('Captcha inválido. Intentá de nuevo.', 422));
  }

  const pendingEmail = await authService.findPendingDeletionByEmail(data.email);
  if (pendingEmail) {
    return next(
      new AppError(
        'Ese email tiene una cuenta pendiente de eliminación. Iniciá sesión para recuperarla.',
        409
      )
    );
  }

  const existingEmail = await authService.findOneByEmail(data.email);
  if (existingEmail) {
    return next(new AppError('El email ya está registrado.', 409));
  }

  const pendingUsername = await authService.findPendingDeletionByUsername(data.username);
  if (pendingUsername) {
    return next(
      new AppError('Ese nombre de usuario pertenece a una cuenta pendiente de eliminación.', 409)
    );
  }

  const existingUsername = await authService.findOneByUsername(data.username);
  if (existingUsername) {
    return next(new AppError('El nombre de usuario ya está en uso.', 409));
  }

  const verificationToken = generateToken();
  const now = new Date();

  const user = await authService.create({
    username: data.username.trim(),
    email: data.email,
    password: data.password,
    ageConfirmedAt: now,
    termsAcceptedAt: now,
    emailVerificationToken: hashToken(verificationToken),
    emailVerificationExpires: new Date(now.getTime() + VERIFICATION_TTL_MS),
    lastActiveAt: now,
  });

  await sendMailSafely(
    () => mailService.sendVerificationEmail(user.email, verificationToken),
    user.id
  );

  void metricsService.track('user_registered', user.id);

  const token = generateJWT({ id: user.id, role: user.role });

  res.status(201).json({
    status: 'success',
    token,
    user: buildAuthUser(user),
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { hasError, errorMessages, data } = validateLogin(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  let user = await authService.findByIdentifierWithPassword(data.identifier.trim());
  let recovered = false;

  if (!user) {
    user = await authService.findPendingDeletionByIdentifierWithPassword(data.identifier.trim());
    recovered = Boolean(user);
  }

  if (!user) {
    await comparePassword(data.password, DUMMY_PASSWORD_HASH);
    return next(new AppError('El email/usuario o la contraseña son incorrectos.', 401));
  }

  const passwordOk = await comparePassword(data.password, user.password);
  if (!passwordOk) {
    return next(new AppError('El email/usuario o la contraseña son incorrectos.', 401));
  }

  if (isSuspensionActive(user)) {
    const reason = user.suspensionReason ? ` Motivo: ${user.suspensionReason}` : '';
    return next(new AppError(`Tu cuenta está suspendida.${reason}`, 403));
  }

  if (recovered) {
    await accountService.restorePendingDeletion(user);
  }

  if (user.status === 'suspended') {
    await user.update({ status: 'active', suspendedUntil: null, suspensionReason: null });
  }

  const now = new Date();
  await user.update({ lastLoginAt: now, lastActiveAt: now });

  const token = generateJWT({ id: user.id, role: user.role });
  const profile = await profileService.findByUserId(user.id);

  res.status(200).json({
    status: 'success',
    token,
    recovered,
    user: buildAuthUser(user, profile),
  });
});

export const deleteAccount = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateDeleteAccount(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const { scheduledFor } = await accountService.requestDeletion(req.sessionUser.id, data.password);

  res.status(200).json({
    status: 'success',
    message: 'Tu cuenta quedó programada para eliminarse.',
    deletionScheduledFor: scheduledFor.toISOString(),
  });
});

export const getProfile = catchAsync(async (req, res) => {
  const profile = await profileService.findByUserId(req.sessionUser.id);

  res.status(200).json({
    status: 'success',
    user: buildAuthUser(req.sessionUser, profile),
  });
});

export const changePassword = catchAsync(async (req, res, next) => {
  const { hasError, errorMessages, data } = validateChangePassword(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const user = await authService.findOneByEmailWithPassword(req.sessionUser.email);
  const passwordOk = await comparePassword(data.currentPassword, user.password);
  if (!passwordOk) {
    return next(new AppError('La contraseña actual es incorrecta.', 401));
  }

  await user.update({
    password: data.newPassword,
    changedPasswordAt: new Date(),
  });

  const token = generateJWT({ id: user.id, role: user.role });

  res.status(200).json({
    status: 'success',
    message: 'Contraseña actualizada correctamente.',
    token,
  });
});

export const verifyEmail = catchAsync(async (req, res, next) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';

  if (!token) {
    return next(new AppError('Falta el token de verificación.', 400));
  }

  const user = await authService.findByVerificationTokenHash(hashToken(token));

  if (!user) {
    return next(new AppError('El enlace de verificación no es válido o ya fue usado.', 400));
  }

  if (user.emailVerificationExpires && new Date(user.emailVerificationExpires) < new Date()) {
    return next(new AppError('El enlace de verificación expiró. Pedí uno nuevo.', 400));
  }

  const wasVerified = user.emailVerified;

  await user.update({
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: null,
  });

  if (!wasVerified) {
    void metricsService.track('email_verified', user.id);
  }

  res.status(200).json({
    status: 'success',
    message: 'Email verificado correctamente.',
  });
});

export const resendVerification = catchAsync(async (req, res) => {
  const user = req.sessionUser;

  if (user.emailVerified) {
    return res.status(200).json({ status: 'success', message: 'Tu email ya está verificado.' });
  }

  const verificationToken = generateToken();
  await authService.update(user.id, {
    emailVerificationToken: hashToken(verificationToken),
    emailVerificationExpires: new Date(Date.now() + VERIFICATION_TTL_MS),
  });

  await sendMailSafely(
    () => mailService.sendVerificationEmail(user.email, verificationToken),
    user.id
  );

  res.status(200).json({
    status: 'success',
    message: 'Te reenviamos el email de verificación.',
  });
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateForgotPassword(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const genericResponse = {
    status: 'success',
    message: 'Si el email está registrado, te enviamos un enlace para restablecer tu contraseña.',
  };

  const user = await authService.findOneByEmail(data.email);
  if (!user) {
    return res.status(200).json(genericResponse);
  }

  const token = generateToken();
  const tokenHash = hashToken(token);

  await authService.update(user.id, {
    passwordResetToken: tokenHash,
    passwordResetExpires: new Date(Date.now() + RESET_TTL_MS),
  });

  await sendMailSafely(() => mailService.sendPasswordResetEmail(user.email, token), user.id);

  res.status(200).json(genericResponse);
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const { hasError, errorMessages, data } = validateResetPassword(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const tokenHash = hashToken(data.token);
  const user = await authService.findByResetToken(tokenHash);

  if (!user || !user.passwordResetExpires) {
    return next(new AppError('El enlace para restablecer la contraseña no es válido.', 400));
  }

  if (new Date(user.passwordResetExpires) < new Date()) {
    return next(new AppError('El enlace para restablecer la contraseña expiró.', 400));
  }

  await user.update({
    password: data.password,
    passwordResetToken: null,
    passwordResetExpires: null,
    changedPasswordAt: new Date(),
  });

  res.status(200).json({
    status: 'success',
    message: 'Contraseña restablecida correctamente. Ya podés iniciar sesión.',
  });
});

import { AppError } from '../../errors/appError.js';
import { verifyJWT } from '../../config/plugins/generate-jwt.js';
import { authService } from './auth.service.js';
import { profileService } from '../profiles/profile.service.js';

const ACTIVE_TOUCH_MS = 5 * 60 * 1000;

export const protect = async (req, _res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('No estás logueado. Iniciá sesión para continuar.', 401));
    }

    const decoded = verifyJWT(token);
    const user = await authService.findOneById(decoded.id);

    if (!user) {
      return next(new AppError('El usuario de este token ya no existe.', 401));
    }

    if (user.status === 'suspended') {
      const until = user.suspendedUntil ? new Date(user.suspendedUntil) : null;
      if (!until || until > new Date()) {
        const reason = user.suspensionReason ? ` Motivo: ${user.suspensionReason}` : '';
        return next(new AppError(`Tu cuenta está suspendida.${reason}`, 403));
      }

      await user.update({
        status: 'active',
        suspendedUntil: null,
        suspensionReason: null,
      });
    }

    if (user.changedPasswordAt) {
      const changedTimestamp = Math.floor(new Date(user.changedPasswordAt).getTime() / 1000);
      if (decoded.iat < changedTimestamp) {
        return next(new AppError('La contraseña fue cambiada. Iniciá sesión de nuevo.', 401));
      }
    }

    if (
      !user.lastActiveAt ||
      Date.now() - new Date(user.lastActiveAt).getTime() > ACTIVE_TOUCH_MS
    ) {
      await authService.touchLastActive(user.id).catch(() => {});
    }

    req.sessionUser = user;
    return next();
  } catch (_error) {
    return next(new AppError('Token inválido o expirado.', 401));
  }
};

export const restrictTo = (...roles) => {
  return (req, _res, next) => {
    if (!roles.includes(req.sessionUser.role)) {
      return next(new AppError('No tenés permiso para realizar esta acción.', 403));
    }
    return next();
  };
};

export const protectAccountOwner = (req, _res, next) => {
  const { sessionUser, params } = req;
  if (sessionUser.id !== params.id && sessionUser.role !== 'admin') {
    return next(new AppError('No tenés permiso para realizar esta acción.', 403));
  }
  return next();
};

export const requireVerifiedEmail = (req, _res, next) => {
  if (!req.sessionUser.emailVerified) {
    return next(new AppError('Verificá tu email antes de continuar.', 403));
  }
  return next();
};

export const requireCompleteProfile = async (req, _res, next) => {
  try {
    const profile = await profileService.findByUserId(req.sessionUser.id);
    if (!profile?.profileCompletedAt) {
      return next(new AppError('Completá tu perfil antes de continuar.', 403));
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

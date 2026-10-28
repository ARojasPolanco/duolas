import rateLimit from 'express-rate-limit';
import { envs } from '../config/enviroments.js';

const isProduction = envs.NODE_ENV === 'production';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 60 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Demasiados intentos. Esperá 15 minutos e intentá de nuevo.',
  },
});

export const apiLimiter = rateLimit({
  windowMs: envs.RATE_LIMIT_WINDOW_MS,
  max: isProduction ? envs.RATE_LIMIT_MAX : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Demasiadas solicitudes. Intentá de nuevo más tarde.',
  },
});

const userKey = (req) => req.sessionUser?.id || req.ip;

const normalizedCredential = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .slice(0, 120);

export const loginCredentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 10 : 1000,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `login:${normalizedCredential(req.body?.identifier) || req.ip}`,
  message: {
    status: 'fail',
    message: 'Demasiados intentos fallidos para esta cuenta. Esperá 15 minutos.',
  },
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 5 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `reset:${normalizedCredential(req.body?.email) || req.ip}:${req.ip}`,
  message: {
    status: 'fail',
    message: 'Demasiados pedidos de recuperación. Esperá 15 minutos.',
  },
});

export const authenticatedLimiter = rateLimit({
  windowMs: envs.RATE_LIMIT_WINDOW_MS,
  max: isProduction ? envs.RATE_LIMIT_USER_MAX : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  message: {
    status: 'fail',
    message: 'Demasiadas solicitudes. Intentá de nuevo más tarde.',
  },
});

const userLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max: isProduction ? max : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: userKey,
    message: { status: 'fail', message },
  });

export const likeLimiter = userLimiter(60 * 60 * 1000, 30, 'Llegaste al límite de likes por hora.');

export const inviteLimiter = userLimiter(
  60 * 60 * 1000,
  20,
  'Llegaste al límite de invitaciones por hora.'
);

export const postLimiter = userLimiter(
  24 * 60 * 60 * 1000,
  5,
  'Llegaste al límite de publicaciones por día.'
);

export const applicationLimiter = userLimiter(
  24 * 60 * 60 * 1000,
  20,
  'Llegaste al límite de postulaciones por día.'
);

export const reportLimiter = userLimiter(
  24 * 60 * 60 * 1000,
  10,
  'Llegaste al límite de reportes por día.'
);

export const ticketLimiter = userLimiter(
  60 * 60 * 1000,
  30,
  'Llegaste al límite de conexiones en tiempo real por hora.'
);

export const pushLimiter = userLimiter(
  60 * 60 * 1000,
  10,
  'Llegaste al límite de suscripciones push por hora.'
);

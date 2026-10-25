import rateLimit from 'express-rate-limit';
import { envs } from '../config/enviroments.js';

const isProduction = envs.NODE_ENV === 'production';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 30 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Demasiados intentos. Esperá 15 minutos e intentá de nuevo.',
  },
});

export const apiLimiter = rateLimit({
  windowMs: envs.RATE_LIMIT_WINDOW_MS,
  max: isProduction ? envs.RATE_LIMIT_MAX : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Demasiadas solicitudes. Intentá de nuevo más tarde.',
  },
});

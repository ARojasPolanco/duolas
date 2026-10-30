import logger from '../config/logger.js';

const SLOW_REQUEST_MS = 1500;

export const accessLog = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const path = String(req.originalUrl || '').split('?')[0];
    const isHealthCheck = path === '/health';

    if (isHealthCheck && res.statusCode < 400) return;

    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const isSlow = durationMs >= SLOW_REQUEST_MS;
    let level = 'debug';

    if (res.statusCode >= 500) {
      level = 'error';
    } else if (res.statusCode >= 400) {
      level = 'warn';
    } else if (isSlow) {
      level = 'info';
    }

    logger.log(level, 'request', {
      requestId: req.id,
      method: req.method,
      path,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      slow: isSlow || undefined,
      userId: req.sessionUser?.id || null,
    });
  });

  next();
};

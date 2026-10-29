import logger from '../config/logger.js';

export const accessLog = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const path = String(req.originalUrl || '').split('?')[0];
    const isHealthCheck = path === '/health';

    if (isHealthCheck && res.statusCode < 400) return;

    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.log(isHealthCheck ? 'warn' : 'info', 'request', {
      requestId: req.id,
      method: req.method,
      path,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      userId: req.sessionUser?.id || null,
    });
  });

  next();
};

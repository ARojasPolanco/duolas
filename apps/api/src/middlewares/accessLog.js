import logger from '../config/logger.js';

export const accessLog = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info('request', {
      requestId: req.id,
      method: req.method,
      path: String(req.originalUrl || '').split('?')[0],
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      userId: req.sessionUser?.id || null,
    });
  });

  next();
};

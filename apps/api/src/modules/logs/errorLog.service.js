import ErrorLog from './errorLog.model.js';

const MAX_STACK = 10000;
const MAX_MESSAGE = 2000;

const redact = (text = '') =>
  String(text)
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [token]')
    .replace(/\beyJ[A-Za-z0-9._-]{10,}/g, '[token]');

const truncate = (text, max) => (text.length > max ? `${text.slice(0, max)}... [truncado]` : text);

export const errorLogService = {
  async log(err, req) {
    try {
      await ErrorLog.create({
        status: err.status || 'error',
        statusCode: err.statusCode || 500,
        message: truncate(redact(err.message || 'Error sin mensaje'), MAX_MESSAGE),
        stack: err.stack ? truncate(redact(err.stack), MAX_STACK) : null,
        method: req?.method || null,
        path: req?.originalUrl ? String(req.originalUrl).split('?')[0].slice(0, 255) : null,
        userId: req?.sessionUser?.id || null,
        ip: req?.ip ? String(req.ip).slice(0, 45) : null,
        userAgent: req?.get ? req.get('user-agent') || null : null,
        isOperational: Boolean(err.isOperational),
      });
    } catch (logError) {
      console.error('No se pudo guardar el error en la base de datos:', logError.message);
    }
  },
};

export default errorLogService;

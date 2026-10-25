import { matchError } from './errorMatchers.js';
import { errorLogService } from '../modules/logs/errorLog.service.js';
import logger from '../config/logger.js';
import { envs } from '../config/enviroments.js';

const shouldPersist = (err) => (err.statusCode || 500) >= 500 || !err.isOperational;

const sendDevError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendProdError = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    return;
  }

  logger.error('Error inesperado', { message: err.message, stack: err.stack });
  res.status(500).json({
    status: 'error',
    message: 'Ocurrió un error inesperado. Por favor, intentá de nuevo más tarde.',
  });
};

export const globalErrorHandler = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  const matched = matchError(err);
  if (matched) {
    err = matched;
  }

  if (res.headersSent) {
    logger.error('Error después de enviar headers', {
      message: err.message,
      stack: err.stack,
      requestId: req.id,
    });
    res.end();
    return;
  }

  if (shouldPersist(err)) {
    void errorLogService.log(err, req);
  }

  if (envs.NODE_ENV === 'development') {
    sendDevError(err, res);
    return;
  }

  sendProdError(err, res);
};

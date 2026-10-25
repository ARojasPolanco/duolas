import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { envs } from './config/enviroments.js';
import { AppError, globalErrorHandler } from './errors/index.js';
import sequelize from './config/database/database.js';
import { requestId } from './middlewares/requestId.js';
import { accessLog } from './middlewares/accessLog.js';
import { apiLimiter, authLimiter } from './middlewares/rateLimits.js';
import router from './routes/routes.js';

const app = express();

app.set('trust proxy', 1);

app.use(requestId);
app.use(accessLog);
app.use(helmet());
app.use(express.json({ limit: '100kb' }));

const allowedOrigins = envs.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));

app.use('/api/v1/auth', authLimiter);
app.use('/api', apiLimiter);

app.get('/health', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

app.use('/api/v1', router);

app.all('*', (req, _res, next) => {
  next(new AppError(`No se encontró la ruta ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

export default app;

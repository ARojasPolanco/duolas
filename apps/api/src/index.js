import 'dotenv/config';
import app from './app.js';
import { envs } from './config/enviroments.js';
import sequelize from './config/database/database.js';
import { runMigrations } from './config/database/migrator.js';
import logger from './config/logger.js';
import { feedbackService } from './modules/trust/feedback.service.js';

const FEEDBACK_SWEEP_MS = 5 * 60 * 1000;

let server;
let feedbackTimer;

const shutdown = async (signal) => {
  logger.info('Cerrando API', { signal });

  if (feedbackTimer) {
    clearInterval(feedbackTimer);
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await sequelize.close();
  process.exit(0);
};

const start = async () => {
  await sequelize.authenticate();
  logger.info('Base de datos conectada');

  await runMigrations();
  logger.info('Migraciones aplicadas');

  server = app.listen(envs.PORT, () => {
    logger.info(`API escuchando en http://localhost:${envs.PORT}`);
    logger.info(`Entorno: ${envs.NODE_ENV}`);
  });

  feedbackTimer = setInterval(() => {
    feedbackService.revealDueFeedbacks().catch((error) => {
      logger.warn('No se pudieron revelar feedbacks vencidos', { message: error.message });
    });
  }, FEEDBACK_SWEEP_MS);

  feedbackTimer.unref();
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection', {
    reason: reason instanceof Error ? reason.stack : String(reason),
  });
});

process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', { message: err.message, stack: err.stack });
  void shutdown('uncaughtException');
});

start().catch((err) => {
  logger.error('No se pudo iniciar la API', { message: err.message, stack: err.stack });
  process.exit(1);
});

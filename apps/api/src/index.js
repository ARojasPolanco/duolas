import 'dotenv/config';
import app from './app.js';
import { envs } from './config/enviroments.js';
import sequelize from './config/database/database.js';
import { runMigrations } from './config/database/migrator.js';
import logger from './config/logger.js';
import { feedbackService } from './modules/trust/feedback.service.js';
import { accountService } from './modules/auth/account.service.js';
import { eventBus } from './modules/events/event.bus.js';
import { ticketStore } from './modules/events/ticket.store.js';
import { matchReminderService } from './modules/matching/matchReminder.service.js';

const FEEDBACK_SWEEP_MS = 5 * 60 * 1000;
const SSE_TICKET_SWEEP_MS = 30 * 1000;
const ACCOUNT_DELETION_SWEEP_MS = 60 * 60 * 1000;
const MATCH_REMINDER_SWEEP_MS = 6 * 60 * 60 * 1000;

let server;
let feedbackTimer;
let ticketCleanupTimer;
let deletionTimer;
let matchReminderTimer;

const shutdown = async (signal) => {
  logger.info('Cerrando API', { signal });

  if (feedbackTimer) {
    clearInterval(feedbackTimer);
  }

  if (ticketCleanupTimer) {
    clearInterval(ticketCleanupTimer);
  }

  if (deletionTimer) {
    clearInterval(deletionTimer);
  }

  if (matchReminderTimer) {
    clearInterval(matchReminderTimer);
  }

  eventBus.closeAll();

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

  ticketCleanupTimer = setInterval(() => {
    ticketStore.cleanup();
  }, SSE_TICKET_SWEEP_MS);

  const purgeDeletedAccounts = () => {
    accountService
      .purgeExpiredDeletions()
      .then((count) => {
        if (count > 0) {
          logger.info('Cuentas eliminadas permanentemente', { count });
        }
      })
      .catch((error) => {
        logger.warn('No se pudieron purgar las cuentas eliminadas', {
          message: error.message,
        });
      });
  };

  purgeDeletedAccounts();
  deletionTimer = setInterval(purgeDeletedAccounts, ACCOUNT_DELETION_SWEEP_MS);

  const sendMatchReminders = () => {
    matchReminderService
      .sendPendingLikeReminders()
      .then((count) => {
        if (count > 0) {
          logger.info('Recordatorios de Match enviados', { count });
        }
      })
      .catch((error) => {
        logger.warn('No se pudieron enviar los recordatorios de Match', {
          message: error.message,
        });
      });
  };

  sendMatchReminders();
  matchReminderTimer = setInterval(sendMatchReminders, MATCH_REMINDER_SWEEP_MS);

  feedbackTimer.unref();
  ticketCleanupTimer.unref();
  deletionTimer.unref();
  matchReminderTimer.unref();
  eventBus.startHeartbeat();
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

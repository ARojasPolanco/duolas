import winston from 'winston';
import { envs } from './enviroments.js';

const logger = winston.createLogger({
  level: envs.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

export const { info, warn, error, debug } = logger;
export default logger;

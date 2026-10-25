import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    APP_URL: z.string().url().optional(),
    DB_URI: z.string().url(),
    TEST_DB_URI: z.string().url().optional(),
    SECRET_JWT_SEED: z.string().min(32, 'SECRET_JWT_SEED debe tener al menos 32 caracteres'),
    JWT_EXPIRE_IN: z.string().default('1d'),
    HCAPTCHA_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    OWNER_EMAIL: z.string().email().optional(),
    SUPPORT_EMAIL: z.string().email().optional(),
    VAPID_PUBLIC_KEY: z.string().optional(),
    VAPID_PRIVATE_KEY: z.string().optional(),
    VAPID_SUBJECT: z.string().optional(),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
    RATE_LIMIT_MAX: z.coerce.number().default(100),
    LOG_LEVEL: z.string().default('info'),
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_PASSWORD: z.string().min(8).optional(),
  })
  .refine((data) => data.NODE_ENV !== 'test' || Boolean(data.TEST_DB_URI), {
    message: 'TEST_DB_URI es obligatorio cuando NODE_ENV=test',
    path: ['TEST_DB_URI'],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const envs = parsed.data;

export const appUrl = envs.APP_URL || envs.CORS_ORIGIN.split(',')[0].trim();

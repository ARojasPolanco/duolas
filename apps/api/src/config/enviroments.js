import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    TRUST_PROXY: z.coerce.number().int().min(0).default(1),
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
    RIOT_API_KEY: z.string().optional(),
    RIOT_PLATFORM: z.string().default('la2'),
    RIOT_REGION: z.string().default('americas'),
    RIOT_API_TIMEOUT_MS: z.coerce.number().default(8000),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
    RATE_LIMIT_MAX: z.coerce.number().default(600),
    RATE_LIMIT_USER_MAX: z.coerce.number().default(600),
    LOG_LEVEL: z.string().default('info'),
    ADMIN_EMAIL: z.string().email().optional(),
    ADMIN_PASSWORD: z.string().min(10).optional(),
  })
  .refine((data) => data.NODE_ENV !== 'test' || Boolean(data.TEST_DB_URI), {
    message: 'TEST_DB_URI es obligatorio cuando NODE_ENV=test',
    path: ['TEST_DB_URI'],
  })
  .refine((data) => data.NODE_ENV !== 'production' || Boolean(data.APP_URL), {
    message: 'APP_URL es obligatorio en producción',
    path: ['APP_URL'],
  })
  .refine((data) => data.NODE_ENV !== 'production' || !data.CORS_ORIGIN.includes('localhost'), {
    message: 'CORS_ORIGIN no puede apuntar a localhost en producción',
    path: ['CORS_ORIGIN'],
  })
  .refine(
    (data) =>
      data.NODE_ENV !== 'production' ||
      data.CORS_ORIGIN.split(',').every((origin) => origin.trim().startsWith('https://')),
    {
      message: 'CORS_ORIGIN debe usar HTTPS en producción',
      path: ['CORS_ORIGIN'],
    }
  )
  .refine((data) => data.NODE_ENV !== 'production' || !data.CORS_ORIGIN.includes('*'), {
    message: 'CORS_ORIGIN no puede usar wildcard en producción',
    path: ['CORS_ORIGIN'],
  })
  .refine((data) => data.NODE_ENV !== 'production' || data.APP_URL?.startsWith('https://'), {
    message: 'APP_URL debe usar HTTPS en producción',
    path: ['APP_URL'],
  })
  .refine(
    (data) =>
      data.NODE_ENV !== 'production' ||
      data.SECRET_JWT_SEED !== 'dev_duo_las_secret_0123456789abcdef0123456789abcdef',
    {
      message: 'SECRET_JWT_SEED no puede ser el secreto de desarrollo en producción',
      path: ['SECRET_JWT_SEED'],
    }
  )
  .refine((data) => data.NODE_ENV !== 'production' || Boolean(data.RESEND_API_KEY), {
    message: 'RESEND_API_KEY es obligatorio en producción',
    path: ['RESEND_API_KEY'],
  })
  .refine((data) => data.NODE_ENV !== 'production' || Boolean(data.OWNER_EMAIL), {
    message: 'OWNER_EMAIL es obligatorio en producción',
    path: ['OWNER_EMAIL'],
  })
  .refine((data) => data.NODE_ENV !== 'production' || Boolean(data.HCAPTCHA_SECRET), {
    message: 'HCAPTCHA_SECRET es obligatorio en producción',
    path: ['HCAPTCHA_SECRET'],
  })
  .refine(
    (data) =>
      data.NODE_ENV !== 'production' ||
      (Boolean(data.VAPID_PUBLIC_KEY) && Boolean(data.VAPID_PRIVATE_KEY)),
    {
      message: 'VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY son obligatorias en producción',
      path: ['VAPID_PUBLIC_KEY'],
    }
  )
  .refine((data) => data.NODE_ENV !== 'production' || Boolean(data.VAPID_SUBJECT), {
    message: 'VAPID_SUBJECT es obligatorio en producción',
    path: ['VAPID_SUBJECT'],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const envs = parsed.data;

export const appUrl = envs.APP_URL || envs.CORS_ORIGIN.split(',')[0].trim();

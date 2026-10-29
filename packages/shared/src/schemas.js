import { z } from 'zod';
import {
  COUNTRIES,
  LANGUAGES,
  PLAY_STYLES,
  QUEUES,
  RANK_DIVISIONS,
  RANK_TIERS,
  RESERVED_USERNAMES,
  ROLES,
} from './constants.js';

const RIOT_GAME_NAME_REGEX = /^[\p{L}\p{N}][\p{L}\p{N} ._-]{1,14}[\p{L}\p{N}]$/u;
const RIOT_TAG_REGEX = /^[A-Za-z0-9]{3,5}$/;

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
  .max(20, 'El nombre de usuario no puede exceder 20 caracteres')
  .regex(/^[\p{L}\p{N}_]+$/u, 'Solo letras, números y guión bajo (sin espacios ni símbolos)')
  .refine((value) => !RESERVED_USERNAMES.includes(value.toLowerCase()), {
    message: 'Ese nombre de usuario está reservado',
  });

export const emailSchema = z.string().trim().toLowerCase().email('Email inválido');

export const passwordSchema = z
  .string()
  .min(10, 'La contraseña debe tener al menos 10 caracteres')
  .max(128, 'La contraseña no puede exceder 128 caracteres');

export const riotIdSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      const parts = value.split('#');
      if (parts.length !== 2) return false;
      const [gameName, tagLine] = parts;
      return RIOT_GAME_NAME_REGEX.test(gameName) && RIOT_TAG_REGEX.test(tagLine);
    },
    { message: 'El Riot ID debe tener el formato Nombre#TAG' }
  );

export const discordTagSchema = z
  .string()
  .trim()
  .min(2, 'El Discord debe tener al menos 2 caracteres')
  .max(32, 'El Discord no puede exceder 32 caracteres')
  .regex(/^[a-z0-9._]+$/i, 'El Discord solo admite letras, números, punto y guión bajo');

export const roleSchema = z.enum(ROLES);
export const rankTierSchema = z.enum(RANK_TIERS);
export const rankDivisionSchema = z.enum(RANK_DIVISIONS);
export const queueSchema = z.enum(QUEUES);
export const playStyleSchema = z.enum(PLAY_STYLES);
export const languageSchema = z.enum(LANGUAGES);
export const countrySchema = z.enum(COUNTRIES);

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    ageConfirmed: z.literal(true, {
      error: 'Tenés que confirmar que sos mayor de 18 años',
    }),
    termsAccepted: z.literal(true, {
      error: 'Tenés que aceptar los términos y la privacidad',
    }),
    captchaToken: z.string().min(1).optional(),
  })
  .strict();

export const loginSchema = z
  .object({
    identifier: z.string().trim().min(1, 'El email o nombre de usuario es requerido'),
    password: z.string().min(1, 'La contraseña es requerida'),
  })
  .strict();

export const normalizeRiotId = (riotId) => riotId.trim().toLowerCase();

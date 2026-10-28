import { z } from 'zod';
import {
  SCHEDULE_BLOCK_VALUES,
  countrySchema,
  discordTagSchema,
  languageSchema,
  playStyleSchema,
  rankDivisionSchema,
  rankTierSchema,
  riotIdSchema,
  roleSchema,
} from '@duo-las/shared';

const scheduleBlockSchema = z.enum(SCHEDULE_BLOCK_VALUES);

export const updateProfileSchema = z
  .object({
    riotId: riotIdSchema.optional(),
    country: countrySchema.nullable().optional(),
    primaryRole: roleSchema.optional(),
    secondaryRole: roleSchema.optional(),
    rankTier: rankTierSchema.optional(),
    rankDivision: rankDivisionSchema.nullable().optional(),
    rankLp: z.number().int().min(0).nullable().optional(),
    playStyle: playStyleSchema.optional(),
    languages: z
      .array(languageSchema)
      .min(1, 'Elegí al menos un idioma')
      .max(3, 'Podés elegir hasta 3 idiomas')
      .refine((values) => new Set(values).size === values.length, {
        message: 'No repitas idiomas',
      })
      .optional(),
    hasMic: z.boolean().optional(),
    scheduleBlocks: z
      .array(scheduleBlockSchema)
      .min(1, 'Elegí al menos un bloque horario')
      .max(28, 'No podés superar los 28 bloques')
      .refine((values) => new Set(values).size === values.length, {
        message: 'No repitas bloques horarios',
      })
      .optional(),
    bio: z.string().trim().max(280, 'La bio no puede exceder 280 caracteres').nullable().optional(),
    discordTag: discordTagSchema.nullable().optional(),
  })
  .strict();

const fieldLabels = {
  riotId: 'Riot ID',
  country: 'País',
  primaryRole: 'Rol principal',
  secondaryRole: 'Rol secundario',
  rankTier: 'Rango',
  rankDivision: 'División',
  rankLp: 'LP',
  playStyle: 'Estilo de juego',
  languages: 'Idiomas',
  hasMic: 'Micrófono',
  scheduleBlocks: 'Horarios',
  bio: 'Bio',
  discordTag: 'Discord',
};

export function validateUpdateProfile(data) {
  if (!data || Object.keys(data).length === 0) {
    return {
      hasError: true,
      errorMessages: ['No enviaste ningún cambio para guardar'],
      data: null,
    };
  }

  const result = updateProfileSchema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map((issue) => {
      const field = issue.path[0];
      return `${fieldLabels[field] || field}: ${issue.message}`;
    });
    return { hasError: true, errorMessages: messages, data: null };
  }

  return { hasError: false, errorMessages: [], data: result.data };
}

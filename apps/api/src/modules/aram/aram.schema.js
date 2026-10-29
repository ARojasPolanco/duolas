import { z } from 'zod';
import { ARAM_MODES, ARAM_WINDOWS } from '@duo-las/shared';

const noteSchema = z
  .string()
  .trim()
  .max(140, 'La nota no puede exceder 140 caracteres')
  .nullable()
  .optional();

export const createAramPostSchema = z
  .object({
    mode: z.enum(ARAM_MODES),
    playersPresent: z.number().int().min(1).max(4),
    slotsNeeded: z.number().int().min(1).max(4),
    window: z.enum(ARAM_WINDOWS),
    hasMic: z.boolean().default(false),
    note: noteSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.mode === 'solo' && (data.playersPresent !== 1 || data.slotsNeeded !== 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mode'],
        message: 'La disponibilidad individual requiere 1 jugador y 1 lugar.',
      });
    }

    if (data.mode === 'group') {
      if (data.playersPresent < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['playersPresent'],
          message: 'Un grupo necesita al menos 2 jugadores.',
        });
      }
      if (data.slotsNeeded > 5 - data.playersPresent) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['slotsNeeded'],
          message: 'No podés buscar más jugadores de los que entran en ARAM.',
        });
      }
    }
  });

export const aramListSchema = z
  .object({
    mode: z.enum(ARAM_MODES).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export const aramApplicationSchema = z
  .object({
    message: noteSchema,
  })
  .strict();

export function validateCreateAramPost(data) {
  const result = createAramPostSchema.safeParse(data);
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.issues.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

export function validateAramList(data) {
  const result = aramListSchema.safeParse(data);
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.issues.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

export function validateAramApplication(data) {
  const result = aramApplicationSchema.safeParse(data);
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.issues.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

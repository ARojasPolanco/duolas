import { z } from 'zod';
import { CLASH_DAYS, CLASH_ROLES, RANK_TIER_INDEX, RANK_TIERS } from '@duo-las/shared';

export const createClashPostSchema = z
  .object({
    teamName: z
      .string()
      .trim()
      .min(3, 'El nombre del equipo debe tener al menos 3 caracteres')
      .max(40, 'El nombre del equipo no puede exceder 40 caracteres'),
    day: z.enum(CLASH_DAYS),
    captainRole: z.enum(CLASH_ROLES),
    rolesNeeded: z
      .array(z.enum(CLASH_ROLES))
      .min(1, 'Elegí al menos un rol')
      .max(4, 'Podés elegir hasta 4 roles')
      .refine((values) => new Set(values).size === values.length, {
        message: 'No repitas roles',
      }),
    rankMinTier: z.enum(RANK_TIERS),
    rankMaxTier: z.enum(RANK_TIERS),
    note: z
      .string()
      .trim()
      .max(280, 'La nota no puede exceder 280 caracteres')
      .nullable()
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.rolesNeeded.includes(data.captainRole)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rolesNeeded'],
        message: 'No busques el mismo rol que ya ocupa el capitán',
      });
    }

    if (RANK_TIER_INDEX[data.rankMinTier] > RANK_TIER_INDEX[data.rankMaxTier]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rankMaxTier'],
        message: 'El rango máximo debe ser igual o mayor al mínimo',
      });
    }
  });

export const clashPostsQuerySchema = z
  .object({
    day: z.enum(CLASH_DAYS).optional(),
    role: z.enum(CLASH_ROLES).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export const clashApplicationSchema = z
  .object({
    role: z.enum(CLASH_ROLES),
    message: z
      .string()
      .trim()
      .max(280, 'El mensaje no puede exceder 280 caracteres')
      .nullable()
      .optional(),
  })
  .strict();

const result = (parsed) => {
  if (!parsed.success) {
    return {
      hasError: true,
      errorMessages: parsed.error.issues.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: parsed.data };
};

export const validateCreateClashPost = (data) => result(createClashPostSchema.safeParse(data));
export const validateClashPostsQuery = (data) => result(clashPostsQuerySchema.safeParse(data));
export const validateClashApplication = (data) => result(clashApplicationSchema.safeParse(data));

import { z } from 'zod';
import { QUEUES, RANK_TIER_INDEX, RANK_TIERS, ROLES } from '@duo-las/shared';

export const createPostSchema = z
  .object({
    queue: z.enum(QUEUES),
    rolesNeeded: z
      .array(z.enum(ROLES))
      .min(1, 'Elegí al menos un rol')
      .max(2, 'Podés elegir hasta 2 roles')
      .refine((values) => new Set(values).size === values.length, {
        message: 'No repitas roles',
      }),
    rankMinTier: z.enum(RANK_TIERS),
    rankMaxTier: z.enum(RANK_TIERS),
    note: z
      .string()
      .trim()
      .max(140, 'La nota no puede exceder 140 caracteres')
      .nullable()
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (RANK_TIER_INDEX[data.rankMinTier] > RANK_TIER_INDEX[data.rankMaxTier]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rankMaxTier'],
        message: 'El rango máximo debe ser igual o mayor al mínimo',
      });
    }
  });

export const postsQuerySchema = z
  .object({
    queue: z.enum(QUEUES).optional(),
    role: z.enum(ROLES).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export const applicationSchema = z
  .object({
    message: z
      .string()
      .trim()
      .max(140, 'El mensaje no puede exceder 140 caracteres')
      .nullable()
      .optional(),
  })
  .strict();

export function validateCreatePost(data) {
  const result = createPostSchema.safeParse(data);
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.errors.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

export function validatePostsQuery(data) {
  const result = postsQuerySchema.safeParse(data);
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.errors.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

export function validateApplication(data) {
  const result = applicationSchema.safeParse(data);
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.errors.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

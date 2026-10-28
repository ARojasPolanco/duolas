import { z } from 'zod';
import { QUEUES, ROLES } from '@duo-las/shared';
import { CANDIDATE_RETURN_LIMIT } from '../../config/matching.js';

export const candidatesQuerySchema = z
  .object({
    queue: z.enum(QUEUES).default('solo_duo'),
    role: z.enum(ROLES).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(CANDIDATE_RETURN_LIMIT),
  })
  .strict();

export const likeSchema = z
  .object({
    targetUserId: z.string().uuid('El usuario no es válido'),
  })
  .strict();

export function validateCandidatesQuery(data) {
  const result = candidatesQuerySchema.safeParse(data);
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.issues.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

export function validateLike(data) {
  const result = likeSchema.safeParse(data);
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.issues.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

export function validateUuidParam(value, label = 'id') {
  const result = z.string().uuid(`${label} inválido`).safeParse(value);
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.issues.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

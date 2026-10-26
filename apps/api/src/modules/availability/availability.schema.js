import { z } from 'zod';
import { QUEUES, ROLES } from '@duo-las/shared';

export const createAvailabilitySchema = z
  .object({
    roles: z
      .array(z.enum(ROLES))
      .min(1, 'Elegí al menos un rol')
      .max(2, 'Podés elegir hasta 2 roles')
      .refine((values) => new Set(values).size === values.length, {
        message: 'No repitas roles',
      }),
    queue: z.enum(QUEUES),
    note: z
      .string()
      .trim()
      .max(140, 'La nota no puede exceder 140 caracteres')
      .nullable()
      .optional(),
    ttlMinutes: z.union([z.literal(30), z.literal(60)]),
  })
  .strict();

export const inviteSchema = z
  .object({
    role: z.enum(ROLES),
    message: z
      .string()
      .trim()
      .max(140, 'El mensaje no puede exceder 140 caracteres')
      .nullable()
      .optional(),
  })
  .strict();

export const availabilityListSchema = z
  .object({
    queue: z.enum(QUEUES).optional(),
    role: z.enum(ROLES).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export const invitesListSchema = z
  .object({
    box: z.enum(['incoming', 'outgoing']).default('incoming'),
  })
  .strict();

export function validateCreateAvailability(data) {
  const result = createAvailabilitySchema.safeParse(data);
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.errors.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

export function validateInvite(data) {
  const result = inviteSchema.safeParse(data);
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.errors.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

export function validateAvailabilityList(data) {
  const result = availabilityListSchema.safeParse(data);
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.errors.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

export function validateInvitesList(data) {
  const result = invitesListSchema.safeParse(data);
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.errors.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

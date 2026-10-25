import { z } from 'zod';

export const blockUserSchema = z
  .object({
    userId: z.string().uuid('El usuario no es válido'),
  })
  .strict();

export function validateBlockUser(data) {
  const result = blockUserSchema.safeParse(data);
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.errors.map((issue) => issue.message),
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
      errorMessages: result.error.errors.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

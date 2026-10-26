import { z } from 'zod';

export const uuidSchema = z.string().uuid('ID inválido');

export function validateUuid(value, label = 'ID') {
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

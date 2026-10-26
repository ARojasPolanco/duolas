import { z } from 'zod';

const endpointSchema = z
  .string()
  .url('El endpoint no es válido')
  .max(2000, 'El endpoint es demasiado largo');

export const subscribeSchema = z
  .object({
    endpoint: endpointSchema,
    keys: z
      .object({
        p256dh: z.string().min(1).max(255),
        auth: z.string().min(1).max(255),
      })
      .strict(),
    userAgent: z.string().trim().max(255).nullable().optional(),
  })
  .strict();

export const unsubscribeSchema = z
  .object({
    endpoint: endpointSchema,
  })
  .strict();

const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.errors.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
};

export const validateSubscribe = (data) => validate(subscribeSchema, data);
export const validateUnsubscribe = (data) => validate(unsubscribeSchema, data);

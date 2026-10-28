import { z } from 'zod';
import { FEEDBACK_TAGS, SENTIMENTS } from '@duo-las/shared';

export const feedbackSchema = z
  .object({
    connectionId: z.string().uuid('La conexión no es válida'),
    sentiment: z.enum(SENTIMENTS),
    tags: z
      .array(z.enum(FEEDBACK_TAGS))
      .max(3, 'Podés elegir hasta 3 motivos')
      .default([])
      .refine((values) => new Set(values).size === values.length, {
        message: 'No repitas motivos',
      }),
    comment: z
      .string()
      .trim()
      .max(280, 'El comentario no puede exceder 280 caracteres')
      .nullable()
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.sentiment === 'negative' && !data.tags.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tags'],
        message: 'Elegí al menos un motivo para el feedback negativo',
      });
    }
  });

export function validateFeedback(data) {
  const result = feedbackSchema.safeParse(data);
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.issues.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

import { z } from 'zod';
import { usernameSchema } from '@duo-las/shared';

const noteSchema = z
  .string()
  .trim()
  .max(500, 'La nota no puede exceder 500 caracteres')
  .nullable()
  .optional();

export const createUsernameRequestSchema = z
  .object({
    note: noteSchema,
  })
  .strict();

export const suggestUsernameSchema = z
  .object({
    username: usernameSchema,
  })
  .strict();

export const approveUsernameSchema = z
  .object({
    username: usernameSchema.optional(),
    note: noteSchema,
  })
  .strict();

export const rejectUsernameSchema = z
  .object({
    note: noteSchema,
  })
  .strict();

const validate = (schema, data) => {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.issues.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
};

export const validateCreateUsernameRequest = (data) => validate(createUsernameRequestSchema, data);
export const validateSuggestUsername = (data) => validate(suggestUsernameSchema, data);
export const validateApproveUsername = (data) => validate(approveUsernameSchema, data);
export const validateRejectUsername = (data) => validate(rejectUsernameSchema, data);

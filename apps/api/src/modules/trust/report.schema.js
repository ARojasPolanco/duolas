import { z } from 'zod';
import { REPORT_REASONS, REPORT_STATUSES } from '@duo-las/shared';

const uuid = (label) => z.string().uuid(`${label} inválido`);

export const reportSchema = z
  .object({
    reportedUserId: uuid('Usuario'),
    reason: z.enum(REPORT_REASONS),
    details: z
      .string()
      .trim()
      .max(500, 'El detalle no puede exceder 500 caracteres')
      .nullable()
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.reason === 'other' && !data.details) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['details'],
        message: 'Contá brevemente qué pasó',
      });
    }
  });

export const adminReportsQuerySchema = z
  .object({
    status: z.enum(REPORT_STATUSES).optional(),
    reason: z.enum(REPORT_REASONS).optional(),
    priority: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    limit: z.coerce.number().int().min(1).max(50).default(50),
  })
  .strict();

export const resolveReportSchema = z
  .object({
    resolution: z.enum([
      'dismissed',
      'warned',
      'suspended_7d',
      'suspended_30d',
      'suspended_permanent',
    ]),
    note: z
      .string()
      .trim()
      .max(500, 'La nota no puede exceder 500 caracteres')
      .nullable()
      .optional(),
  })
  .strict();

export const warnUserSchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(3, 'Indicá un motivo')
      .max(500, 'El motivo no puede exceder 500 caracteres'),
  })
  .strict();

export const suspendUserSchema = z
  .object({
    days: z.union([z.literal(7), z.literal(30), z.null()]),
    reason: z
      .string()
      .trim()
      .min(3, 'Indicá un motivo')
      .max(500, 'El motivo no puede exceder 500 caracteres'),
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

export const validateReport = (data) => validate(reportSchema, data);
export const validateAdminReportsQuery = (data) => validate(adminReportsQuerySchema, data);
export const validateResolveReport = (data) => validate(resolveReportSchema, data);
export const validateWarnUser = (data) => validate(warnUserSchema, data);
export const validateSuspendUser = (data) => validate(suspendUserSchema, data);

import { z } from 'zod';

export const metricsSummarySchema = z
  .object({
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

export function validateMetricsSummary(data) {
  const result = metricsSummarySchema.safeParse(data);
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.issues.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

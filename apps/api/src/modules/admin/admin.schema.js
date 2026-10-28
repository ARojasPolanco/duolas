import { z } from 'zod';

const booleanQuerySchema = z.enum(['true', 'false']).transform((value) => value === 'true');

export const adminUsersQuerySchema = z
  .object({
    search: z.string().trim().max(100).optional(),
    role: z.enum(['player', 'admin']).optional(),
    status: z.enum(['active', 'suspended']).optional(),
    account: z.enum(['active', 'pending_deletion', 'deleted', 'all']).default('active'),
    emailVerified: booleanQuerySchema.optional(),
    profileCompleted: booleanQuerySchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export function validateAdminUsersQuery(data) {
  const result = adminUsersQuerySchema.safeParse(data);
  if (!result.success) {
    return {
      hasError: true,
      errorMessages: result.error.issues.map((issue) => issue.message),
      data: null,
    };
  }
  return { hasError: false, errorMessages: [], data: result.data };
}

import { z } from 'zod';

export const createTransactionSchema = z.object({
  account_id: z.string().uuid('Invalid account'),
  signed_amount: z.number().refine(val => val !== 0, {
    message: 'Amount cannot be zero',
  }),
  kind: z.enum(['NORMAL', 'TRANSFER', 'ADJUSTMENT', 'FEE', 'INTEREST']).default('NORMAL'),
  status: z.enum(['PENDING', 'POSTED', 'VOID']).default('POSTED'),
  category_id: z.string().uuid('Invalid category').optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  occurred_at: z.string().datetime('Invalid date format'),
  posted_at: z.string().datetime('Invalid date format').optional().nullable(),
  source: z.string().max(50).optional().nullable().default('MANUAL'),
});

export const updateTransactionSchema = z.object({
  account_id: z.string().uuid('Invalid account').optional(),
  signed_amount: z.number().refine(val => val !== 0, {
    message: 'Amount cannot be zero',
  }).optional(),
  kind: z.enum(['NORMAL', 'TRANSFER', 'ADJUSTMENT', 'FEE', 'INTEREST']).optional(),
  status: z.enum(['PENDING', 'POSTED', 'VOID']).optional(),
  category_id: z.string().uuid('Invalid category').optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  occurred_at: z.string().datetime('Invalid date format').optional(),
  posted_at: z.string().datetime('Invalid date format').optional().nullable(),
  source: z.string().max(50).optional().nullable(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

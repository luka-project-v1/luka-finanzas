import { z } from 'zod';

export const createBankAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  currency_code: z.string().length(3, 'Currency code must be 3 characters'),
  institution_name: z.string().max(100).optional().nullable(),
  opened_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional().nullable(),
  // Bank account specific details
  kind: z.enum(['SAVINGS', 'CHECKING'], {
    required_error: 'Account kind is required',
  }),
  bank_name: z.string().max(100).optional().nullable(),
  masked_number: z.string().max(20).optional().nullable(),
  interest_rate_annual: z.number().min(0).max(100).optional().nullable(),
  monthly_fee: z.number().min(0).optional().nullable(),
  overdraft_limit: z.number().min(0).optional().nullable(),
});

export const updateBankAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  currency_code: z.string().length(3, 'Currency code must be 3 characters').optional(),
  institution_name: z.string().max(100).optional().nullable(),
  status: z.enum(['ACTIVE', 'CLOSED']).optional(),
  opened_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional().nullable(),
  closed_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional().nullable(),
  // Bank account specific details
  kind: z.enum(['SAVINGS', 'CHECKING']).optional(),
  bank_name: z.string().max(100).optional().nullable(),
  masked_number: z.string().max(20).optional().nullable(),
  interest_rate_annual: z.number().min(0).max(100).optional().nullable(),
  monthly_fee: z.number().min(0).optional().nullable(),
  overdraft_limit: z.number().min(0).optional().nullable(),
});

export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>;

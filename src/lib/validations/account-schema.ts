import { z } from 'zod';
import { Currency } from '@prisma/client';

export const createBankAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  currency_code: z.nativeEnum(Currency, {
    required_error: 'Currency is required',
    invalid_type_error: 'Invalid currency code',
  }),
  institution_name: z.string().max(100).optional().nullable().transform(val => val === '' ? null : val),
  opened_at: z.string()
    .optional()
    .nullable()
    .transform(val => val === '' || !val ? null : val)
    .refine((val) => val === null || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Invalid date format',
    }),
  // Bank account specific details
  kind: z.enum(['SAVINGS', 'CHECKING'], {
    required_error: 'Account kind is required',
  }),
  bank_name: z.string().max(100).optional().nullable().transform(val => val === '' ? null : val),
  masked_number: z.string().max(20).optional().nullable().transform(val => val === '' ? null : val),
  interest_rate_annual: z.number().min(0).max(100).optional().nullable(),
  monthly_fee: z.number().min(0).optional().nullable(),
  overdraft_limit: z.number().min(0).optional().nullable(),
});

export const updateBankAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  currency_code: z.nativeEnum(Currency, {
    invalid_type_error: 'Invalid currency code',
  }).optional(),
  institution_name: z.string().max(100).optional().nullable().transform(val => val === '' ? null : val),
  status: z.enum(['ACTIVE', 'CLOSED']).optional(),
  opened_at: z.string()
    .optional()
    .nullable()
    .transform(val => val === '' || !val ? null : val)
    .refine((val) => val === null || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Invalid date format',
    }),
  closed_at: z.string()
    .optional()
    .nullable()
    .transform(val => val === '' || !val ? null : val)
    .refine((val) => val === null || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Invalid date format',
    }),
  // Bank account specific details
  kind: z.enum(['SAVINGS', 'CHECKING']).optional(),
  bank_name: z.string().max(100).optional().nullable().transform(val => val === '' ? null : val),
  masked_number: z.string().max(20).optional().nullable().transform(val => val === '' ? null : val),
  interest_rate_annual: z.number().min(0).max(100).optional().nullable(),
  monthly_fee: z.number().min(0).optional().nullable(),
  overdraft_limit: z.number().min(0).optional().nullable(),
});

export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;
export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>;

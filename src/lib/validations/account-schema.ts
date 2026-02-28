import { z } from 'zod';

const CurrencyEnum = z.enum(['USD', 'COP'], {
  required_error: 'La moneda es obligatoria',
  invalid_type_error: 'Código de moneda inválido',
});

export const createBankAccountSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  currency_code: CurrencyEnum,
  institution_name: z.string().max(100).optional().nullable().transform(val => val === '' ? null : val),
  opened_at: z.string()
    .optional()
    .nullable()
    .transform(val => val === '' || !val ? null : val)
    .refine((val) => val === null || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Formato de fecha inválido',
    }),
  // Bank account specific details
  kind: z.enum(['SAVINGS', 'CHECKING'], {
    required_error: 'El tipo de cuenta es obligatorio',
  }),
  bank_name: z.string().max(100).optional().nullable().transform(val => val === '' ? null : val),
  masked_number: z.string().max(20).optional().nullable().transform(val => val === '' ? null : val),
  interest_rate_annual: z.number().min(0).max(100).optional().nullable(),
  monthly_fee: z.number().min(0).optional().nullable(),
  overdraft_limit: z.number().min(0).optional().nullable(),
});

export const updateBankAccountSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100).optional(),
  currency_code: z.enum(['USD', 'COP'], {
    invalid_type_error: 'Código de moneda inválido',
  }).optional(),
  institution_name: z.string().max(100).optional().nullable().transform(val => val === '' ? null : val),
  status: z.enum(['ACTIVE', 'CLOSED']).optional(),
  opened_at: z.string()
    .optional()
    .nullable()
    .transform(val => val === '' || !val ? null : val)
    .refine((val) => val === null || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Formato de fecha inválido',
    }),
  closed_at: z.string()
    .optional()
    .nullable()
    .transform(val => val === '' || !val ? null : val)
    .refine((val) => val === null || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Formato de fecha inválido',
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

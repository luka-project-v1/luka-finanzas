import { z } from 'zod';

export const createCreditCardSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  currency_code: z.string().length(3, 'El código de moneda debe tener 3 caracteres'),
  institution_name: z.string().max(100).optional().nullable(),
  opened_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido').optional().nullable(),
  // Credit card specific details
  issuer: z.string().max(50).optional().nullable(),
  bank_name: z.string().max(100).optional().nullable(),
  last4: z.string().length(4).optional().nullable(),
  credit_limit: z.number().min(0, 'El límite debe ser mayor o igual a 0').optional().nullable(),
  management_fee: z.number().min(0).optional().nullable(),
  management_fee_period: z.string().max(20).optional().nullable(), // MONTHLY / ANNUAL
  interest_rate_annual: z.number().min(0).max(100).optional().nullable(),
  interest_rate_monthly: z.number().min(0).max(100).optional().nullable(),
  billing_cycle_day: z.number().int().min(1).max(31).optional().nullable(),
  payment_due_day: z.number().int().min(1).max(31).optional().nullable(),
  last_statement_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido').optional().nullable(),
});

export const updateCreditCardSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100).optional(),
  currency_code: z.string().length(3, 'El código de moneda debe tener 3 caracteres').optional(),
  institution_name: z.string().max(100).optional().nullable(),
  status: z.enum(['ACTIVE', 'CLOSED']).optional(),
  opened_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido').optional().nullable(),
  closed_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido').optional().nullable(),
  // Credit card specific details
  issuer: z.string().max(50).optional().nullable(),
  bank_name: z.string().max(100).optional().nullable(),
  last4: z.string().length(4).optional().nullable(),
  credit_limit: z.number().min(0).optional().nullable(),
  management_fee: z.number().min(0).optional().nullable(),
  management_fee_period: z.string().max(20).optional().nullable(),
  interest_rate_annual: z.number().min(0).max(100).optional().nullable(),
  interest_rate_monthly: z.number().min(0).max(100).optional().nullable(),
  billing_cycle_day: z.number().int().min(1).max(31).optional().nullable(),
  payment_due_day: z.number().int().min(1).max(31).optional().nullable(),
  last_statement_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido').optional().nullable(),
});

export type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>;
export type UpdateCreditCardInput = z.infer<typeof updateCreditCardSchema>;

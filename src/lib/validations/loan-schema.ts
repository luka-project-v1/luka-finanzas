import { z } from 'zod';

export const createLoanGivenSchema = z.object({
  debtor_name: z.string().min(1, 'El nombre del deudor es requerido').max(200),
  amount: z.number().min(0, 'El monto debe ser mayor o igual a 0'),
  currency_id: z.string().uuid('ID de moneda inválido'),
  loan_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida').optional().nullable(),
  interest_rate: z.number().min(0).max(100).default(0),
  notes: z.string().optional().nullable(),
  start_month: z.number().int().min(1).max(12).optional().nullable(),
  end_month: z.number().int().min(1).max(12).optional().nullable(),
});

export const updateLoanGivenSchema = createLoanGivenSchema.partial();

export const createLoanReceivedSchema = z.object({
  creditor_name: z.string().min(1, 'El nombre del acreedor es requerido').max(200),
  amount: z.number().min(0, 'El monto debe ser mayor o igual a 0'),
  currency_id: z.string().uuid('ID de moneda inválido'),
  loan_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida').optional().nullable(),
  interest_rate: z.number().min(0).max(100).default(0),
  notes: z.string().optional().nullable(),
  start_month: z.number().int().min(1).max(12).optional().nullable(),
  end_month: z.number().int().min(1).max(12).optional().nullable(),
});

export const updateLoanReceivedSchema = createLoanReceivedSchema.partial();

export const createLoanPaymentSchema = z.object({
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  notes: z.string().optional().nullable(),
});

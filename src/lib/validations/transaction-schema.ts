import { z } from 'zod';

export const createTransactionSchema = z.object({
  account_id: z.string().uuid('Cuenta inválida'),
  // Coerce to number: Server Actions may serialize numbers as strings over the wire
  signed_amount: z.coerce
    .number()
    .refine((val) => val !== 0, { message: 'El monto no puede ser cero' }),
  kind: z.enum(['NORMAL', 'TRANSFER', 'ADJUSTMENT', 'FEE', 'INTEREST']).default('NORMAL'),
  status: z.enum(['PENDING', 'POSTED', 'VOID']).default('POSTED'),
  category_id: z
    .union([
      z.string().uuid('Categoría inválida'),
      z.literal(''),
      z.null(),
      z.undefined(),
    ])
    .transform((v) => (v === '' || v == null ? null : v)),
  description: z.string().max(500).optional().nullable(),
  // Accept ISO string or Date-like value; normalize to ISO string
  occurred_at: z.union([
    z.string().datetime({ message: 'Formato de fecha inválido' }),
    z.coerce.date().transform((d) => d.toISOString()),
  ]),
  posted_at: z
    .string()
    .datetime('Formato de fecha inválido')
    .optional()
    .nullable(),
  source: z.string().max(50).optional().nullable().default('MANUAL'),
});

export const updateTransactionSchema = z.object({
  account_id: z.string().uuid('Cuenta inválida').optional(),
  signed_amount: z.coerce
    .number()
    .refine((val) => val !== 0, { message: 'El monto no puede ser cero' })
    .optional(),
  kind: z.enum(['NORMAL', 'TRANSFER', 'ADJUSTMENT', 'FEE', 'INTEREST']).optional(),
  status: z.enum(['PENDING', 'POSTED', 'VOID']).optional(),
  category_id: z.string().uuid('Categoría inválida').optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  occurred_at: z.string().datetime('Formato de fecha inválido').optional(),
  posted_at: z.string().datetime('Formato de fecha inválido').optional().nullable(),
  source: z.string().max(50).optional().nullable(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

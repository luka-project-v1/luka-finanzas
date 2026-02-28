'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/dialog';
import { FieldLabel, FieldError, Input, Select } from '@/components/ui/form-fields';
import { createTransaction } from '@/lib/actions/transactions';
import type { CreateTransactionInput } from '@/lib/validations/transaction-schema';
import { cn } from '@/lib/utils/cn';
import type { AccountWithDetails } from '@/lib/repositories/account-repository';
import type { Database } from '@/lib/types/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

// ─── Form schema ──────────────────────────────────────────────────────────
// `type` (income/expense) + `amount` (positive) → `signed_amount` at submit
const formSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z
    .string()
    .min(1, 'El monto es obligatorio')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: 'El monto debe ser un número positivo',
    }),
  account_id: z.string().min(1, 'Por favor selecciona una cuenta'),
  description: z.string().max(500).optional(),
  category_id: z.string().optional(),
  occurred_at: z.string().min(1, 'La fecha y hora son obligatorias'),
  kind: z.enum(['NORMAL', 'TRANSFER', 'ADJUSTMENT', 'FEE', 'INTEREST']),
  status: z.enum(['PENDING', 'POSTED', 'VOID']),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Props ────────────────────────────────────────────────────────────────
interface CreateTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  accounts: AccountWithDetails[];
  categories: Category[];
}

export function CreateTransactionDialog({
  open,
  onOpenChange,
  onSuccess,
  accounts,
  categories,
}: CreateTransactionDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  // Default occurred_at = now (datetime-local format: YYYY-MM-DDTHH:mm)
  const nowLocal = new Date();
  const defaultOccurredAt = new Date(nowLocal.getTime() - nowLocal.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'expense',
      amount: '',
      account_id: '',
      description: '',
      category_id: '',
      occurred_at: defaultOccurredAt,
      kind: 'NORMAL',
      status: 'POSTED',
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
    reset,
  } = form;

  const selectedType = watch('type');

  function handleClose() {
    reset();
    setServerError(null);
    onOpenChange(false);
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);

    const rawAmount = parseFloat(values.amount);
    // Core rule: income → positive signed_amount, expense → negative
    const signedAmount = values.type === 'income' ? rawAmount : -rawAmount;

    // Keep the local wall-clock time exactly as the user entered it.
    // datetime-local gives "YYYY-MM-DDTHH:mm"; we normalise to "YYYY-MM-DD HH:mm:ss"
    // without any timezone conversion so the stored value matches what the user sees.
    const occurred_at_local = values.occurred_at.replace('T', ' ') + ':00';

    const payload: CreateTransactionInput = {
      account_id: values.account_id,
      signed_amount: signedAmount,
      description: values.description || null,
      category_id: values.category_id || null,
      occurred_at: occurred_at_local,
      kind: values.kind,
      status: values.status,
      source: 'MANUAL',
    };

    const result = await createTransaction(payload);

    // Debug: log full response
    console.log('Action Response:', result);

    if (result.success) {
      reset();
      toast.success('Transacción creada correctamente');
      onSuccess();
      handleClose();
    } else {
      // Map validation errors to form fields if details contain Zod issues
      const details = result.details as { issues?: Array<{ path: (string | number)[]; message: string }> } | undefined;
      if (details?.issues?.length) {
        for (const issue of details.issues) {
          const field = issue.path[0];
          if (typeof field === 'string' && ['account_id', 'signed_amount', 'description', 'category_id', 'occurred_at', 'kind', 'status'].includes(field)) {
            const formField = field === 'signed_amount' ? 'amount' : field;
            setError(formField as keyof FormValues, { type: 'server', message: issue.message });
          }
        }
      } else {
        setServerError(result.error);
        toast.error(result.error);
      }
    }
  }

  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE');

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title="Nueva Transacción"
      description="Registra un ingreso o gasto."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* ── Income / Expense toggle ── */}
        <div className="mb-6">
          <FieldLabel required>Tipo de transacción</FieldLabel>
          <div className="grid grid-cols-2 gap-3">
            {/* Income */}
            <button
              type="button"
              onClick={() => setValue('type', 'income')}
              className={cn(
                'flex items-center justify-center gap-2.5',
                'rounded-[1rem] px-4 py-3',
                'text-sm font-semibold border transition-all duration-150',
                selectedType === 'income'
                  ? [
                      'bg-luka-income/15 border-luka-income/30 text-luka-income',
                      'shadow-[inset_3px_3px_7px_rgba(0,0,0,0.4),inset_-2px_-2px_5px_rgba(74,222,128,0.08)]',
                    ]
                  : 'bg-neu-raised border-neu text-white/40 shadow-soft-out hover:text-white/60',
              )}
            >
              <TrendingUp className="w-4 h-4" strokeWidth={2} />
              Ingreso
            </button>

            {/* Gasto */}
            <button
              type="button"
              onClick={() => setValue('type', 'expense')}
              className={cn(
                'flex items-center justify-center gap-2.5',
                'rounded-[1rem] px-4 py-3',
                'text-sm font-semibold border transition-all duration-150',
                selectedType === 'expense'
                  ? [
                      'bg-luka-expense/15 border-luka-expense/30 text-luka-expense',
                      'shadow-[inset_3px_3px_7px_rgba(0,0,0,0.4),inset_-2px_-2px_5px_rgba(248,113,113,0.08)]',
                    ]
                  : 'bg-neu-raised border-neu text-white/40 shadow-soft-out hover:text-white/60',
              )}
            >
              <TrendingDown className="w-4 h-4" strokeWidth={2} />
              Gasto
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {/* Amount */}
          <div>
            <FieldLabel required>Monto</FieldLabel>
            <div className="relative">
              {/* Sign indicator */}
              <span className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold',
                selectedType === 'income' ? 'text-luka-income' : 'text-luka-expense',
              )}>
                {selectedType === 'income' ? '+' : '−'}
              </span>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="pl-8"
                {...register('amount')}
              />
            </div>
            <FieldError message={errors.amount?.message} />
          </div>

          {/* Account */}
          <div>
            <FieldLabel required>Cuenta</FieldLabel>
            <Select {...register('account_id')}>
              <option value="">Seleccionar cuenta…</option>
              {activeAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                  {acc.bank_account_details?.bank_name
                    ? ` — ${acc.bank_account_details.bank_name}`
                    : ''}
                  {' '}({acc.currency_code})
                </option>
              ))}
            </Select>
            <FieldError message={errors.account_id?.message} />
          </div>

          {/* Description */}
          <div>
            <FieldLabel>Descripción</FieldLabel>
            <Input
              placeholder="¿En qué se usó esta transacción?"
              autoComplete="off"
              {...register('description')}
            />
            <FieldError message={errors.description?.message} />
          </div>

          {/* Category + Date side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Categoría</FieldLabel>
              <Select {...register('category_id')}>
                <option value="">Sin categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.category_id?.message} />
            </div>
            <div>
              <FieldLabel required>Fecha y hora</FieldLabel>
              <Input type="datetime-local" {...register('occurred_at')} />
              <FieldError message={errors.occurred_at?.message} />
            </div>
          </div>

          {/* Kind + Status side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Tipo</FieldLabel>
              <Select {...register('kind')}>
                <option value="NORMAL">Normal</option>
                <option value="FEE">Comisión</option>
                <option value="INTEREST">Interés</option>
                <option value="ADJUSTMENT">Ajuste</option>
                <option value="TRANSFER">Transferencia</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Estado</FieldLabel>
              <Select {...register('status')}>
                <option value="POSTED">Registrada</option>
                <option value="PENDING">Pendiente</option>
                <option value="VOID">Anulada</option>
              </Select>
            </div>
          </div>
        </div>

        {/* ── Signed amount preview ── */}
        {watch('amount') && parseFloat(watch('amount')) > 0 && (
          <div className={cn(
            'mt-5 px-4 py-3 rounded-[0.75rem] border text-sm font-semibold',
            selectedType === 'income'
              ? 'bg-luka-income/8 border-luka-income/20 text-luka-income'
              : 'bg-luka-expense/8 border-luka-expense/20 text-luka-expense',
          )}>
            El monto se guardará como&nbsp;
            <span className="font-mono">
              {selectedType === 'income' ? '+' : '−'}
              {parseFloat(watch('amount') || '0').toFixed(2)}
            </span>
          </div>
        )}

        {/* ── Server error ── */}
        {serverError && (
          <div className="mt-4 px-4 py-3 rounded-[0.75rem] bg-luka-expense/10 border border-luka-expense/20 text-sm text-luka-expense">
            {serverError}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 mt-7">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="neu-btn text-sm text-white/50 hover:text-white/80"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="neu-btn neu-btn-primary text-sm min-w-[140px]"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Guardar Transacción'
            )}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, TrendingUp, TrendingDown, ArrowLeftRight, ArrowRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog } from '@/components/ui/dialog';
import { FieldLabel, FieldError, Input, Select } from '@/components/ui/form-fields';
import { createTransaction, updateTransaction } from '@/lib/actions/transactions';
import type { CreateTransactionInput, UpdateTransactionInput } from '@/lib/validations/transaction-schema';
import { cn } from '@/lib/utils/cn';
import type { AccountWithDetails } from '@/lib/repositories/account-repository';
import type { TransactionWithRelations } from '@/lib/repositories/transaction-repository';
import type { TransferInfo } from '@/lib/actions/transactions';
import type { Database } from '@/lib/types/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

type TransactionMode = 'expense' | 'income' | 'transfer';

// ─── Form schema ──────────────────────────────────────────────────────────
const formSchema = z
  .object({
    type: z.enum(['income', 'expense']),
    amount: z
      .string()
      .min(1, 'El monto es obligatorio')
      .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
        message: 'El monto debe ser un número positivo',
      }),
    account_id: z.string().min(1, 'Por favor selecciona una cuenta'),
    destination_account_id: z.string().optional(),
    description: z.string().max(500).optional(),
    category_id: z.string().optional(),
    occurred_at: z.string().min(1, 'La fecha y hora son obligatorias'),
    kind: z.enum(['NORMAL', 'TRANSFER', 'ADJUSTMENT', 'FEE', 'INTEREST']),
    status: z.enum(['PENDING', 'POSTED', 'VOID']),
  })
  .refine(
    (data) => {
      if (data.kind === 'TRANSFER') {
        if (!data.destination_account_id) return false;
        if (data.destination_account_id === data.account_id) return false;
        return true;
      }
      return true;
    },
    {
      message: 'Selecciona una cuenta de destino diferente a la de origen',
      path: ['destination_account_id'],
    }
  );

type FormValues = z.infer<typeof formSchema>;

// ─── Props ────────────────────────────────────────────────────────────────
interface CreateTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  accounts: AccountWithDetails[];
  categories: Category[];
  /** When provided, form enters Edit mode: title "Editar Transacción", button "Guardar Cambios" */
  initialData?: TransactionWithRelations | null;
  /** Required when initialData is a transfer (has transfer_id) to resolve destination account */
  transferInfo?: Record<string, TransferInfo>;
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export function CreateTransactionDialog({
  open,
  onOpenChange,
  onSuccess,
  accounts,
  categories,
  initialData,
  transferInfo = {},
}: CreateTransactionDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const isEditMode = !!initialData;

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
      destination_account_id: '',
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
  const selectedAccountId = watch('account_id');

  // Mode: expense | income | transfer (Traspaso)
  const [mode, setMode] = useState<TransactionMode>('expense');
  const isTransfer = mode === 'transfer';

  // Sync form kind with mode
  useEffect(() => {
    setValue('kind', isTransfer ? 'TRANSFER' : 'NORMAL');
    if (!isTransfer) setValue('destination_account_id', '');
  }, [isTransfer, setValue]);

  // Reset mode when dialog opens; when edit mode, populate from initialData
  useEffect(() => {
    if (open && initialData) {
      const signed = Number(initialData.signed_amount ?? 0);
      const modeFromTx: TransactionMode =
        initialData.kind === 'TRANSFER'
          ? 'transfer'
          : signed > 0
            ? 'income'
            : 'expense';
      setMode(modeFromTx);
      setValue('type', modeFromTx === 'income' ? 'income' : 'expense');
      setValue('amount', Math.abs(signed).toString());
      setValue('account_id', initialData.account_id ?? '');
      setValue('description', initialData.description ?? '');
      setValue('category_id', initialData.category_id ?? '');
      setValue('occurred_at', initialData.occurred_at ? toDatetimeLocal(initialData.occurred_at) : defaultOccurredAt);
      setValue('kind', initialData.kind ?? 'NORMAL');
      setValue('status', initialData.status ?? 'POSTED');
      if (initialData.kind === 'TRANSFER' && initialData.transfer_id && transferInfo[initialData.transfer_id]) {
        const info = transferInfo[initialData.transfer_id];
        // Always use canonical from→to: Desde=from, Hacia=to
        setValue('account_id', info.fromAccount.id);
        setValue('destination_account_id', info.toAccount.id);
      } else {
        setValue('destination_account_id', '');
      }
    } else if (open) {
      setMode('expense');
    }
  }, [open, initialData, transferInfo, setValue, defaultOccurredAt]);


  function exitTransferMode() {
    setMode('expense');
    setValue('kind', 'NORMAL');
    setValue('destination_account_id', '');
  }

  function handleClose() {
    setMode('expense');
    reset();
    setServerError(null);
    onOpenChange(false);
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);

    const rawAmount = parseFloat(values.amount);
    // datetime-local gives "YYYY-MM-DDTHH:mm" - Zod coerce.date() accepts and transforms to DB format
    const occurredAt = values.occurred_at;

    if (isEditMode && initialData) {
      const payload: UpdateTransactionInput = {
        occurred_at: occurredAt,
        kind: values.kind,
        status: values.status,
        description: values.description || null,
        category_id: isTransfer ? null : (values.category_id || null),
      };
      if (isTransfer) {
        payload.account_id = values.account_id;
        payload.destination_account_id = values.destination_account_id || undefined;
        payload.signed_amount = rawAmount; // positive amount; backend applies sign per leg
      } else {
        const signedAmount = mode === 'income' ? rawAmount : -rawAmount;
        payload.account_id = values.account_id;
        payload.signed_amount = signedAmount;
      }
      const result = await updateTransaction(initialData.id, payload);
      if (result.success) {
        reset();
        toast.success('Transacción actualizada correctamente');
        onSuccess();
        handleClose();
      } else {
        const fail = result as { success: false; error: string; details?: { issues?: Array<{ path: (string | number)[]; message: string }> } };
        const details = fail.details;
        if (details?.issues?.length) {
          for (const issue of details.issues) {
            const field = issue.path[0];
            if (typeof field === 'string' && ['account_id', 'destination_account_id', 'signed_amount', 'description', 'category_id', 'occurred_at', 'kind', 'status'].includes(field)) {
              const formField = field === 'signed_amount' ? 'amount' : field;
              setError(formField as keyof FormValues, { type: 'server', message: issue.message });
            }
          }
        } else {
          setServerError(fail.error);
          toast.error(fail.error);
        }
      }
      return;
    }

    let payload: CreateTransactionInput;

    if (isTransfer && values.destination_account_id) {
      // Transfer: server creates both debit and credit transactions
      payload = {
        account_id: values.account_id,
        destination_account_id: values.destination_account_id,
        signed_amount: rawAmount, // positive amount being transferred
        description: values.description || null,
        category_id: null,
        occurred_at: occurredAt,
        kind: 'TRANSFER',
        status: values.status,
        source: 'MANUAL',
      };
    } else {
      const signedAmount = mode === 'income' ? rawAmount : -rawAmount;
      payload = {
        account_id: values.account_id,
        signed_amount: signedAmount,
        description: values.description || null,
        category_id: values.category_id || null,
        occurred_at: occurredAt,
        kind: values.kind,
        status: values.status,
        source: 'MANUAL',
      };
    }

    const result = await createTransaction(payload);

    if (result.success) {
      reset();
      toast.success(
        isTransfer ? 'Traspaso realizado correctamente' : 'Transacción creada correctamente'
      );
      onSuccess();
      handleClose();
    } else {
      // Map validation errors to form fields if details contain Zod issues
      const fail = result as { success: false; error: string; details?: { issues?: Array<{ path: (string | number)[]; message: string }> } };
      const details = fail.details;
      if (details?.issues?.length) {
        for (const issue of details.issues) {
          const field = issue.path[0];
          if (typeof field === 'string' && ['account_id', 'destination_account_id', 'signed_amount', 'description', 'category_id', 'occurred_at', 'kind', 'status'].includes(field)) {
            const formField = field === 'signed_amount' ? 'amount' : field;
            setError(formField as keyof FormValues, { type: 'server', message: issue.message });
          }
        }
      } else {
        setServerError(fail.error);
        toast.error(fail.error);
      }
    }
  }

  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE');
  const destinationAccountOptions = activeAccounts.filter((a) => a.id !== selectedAccountId);

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title={isEditMode ? 'Editar Transacción' : 'Nueva Transacción'}
      description={isEditMode ? 'Modifica los datos de la transacción.' : 'Registra un ingreso o gasto.'}
      header={
        isTransfer ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-luka-info shrink-0" strokeWidth={2} />
              <span className="text-base font-semibold text-white/90 tracking-tight">
                {isEditMode ? 'Editar Traspaso' : 'Nuevo Traspaso'}
              </span>
            </div>
            {!isEditMode && (
              <button
                type="button"
                onClick={exitTransferMode}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[0.75rem] text-xs text-neu-muted hover:text-white/70 border border-neu bg-neu-raised shadow-soft-out transition-all duration-150"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
            )}
          </div>
        ) : undefined
      }
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* ── 3-tab selector: Gasto | Ingreso | Traspaso ── */}
        <div
          className={cn(
            'mb-6 transition-all duration-300 ease-out',
            isTransfer ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100',
          )}
        >
          <FieldLabel required>Tipo</FieldLabel>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { setMode('expense'); setValue('type', 'expense'); }}
              className={cn(
                'flex items-center justify-center gap-2',
                'rounded-[1rem] px-3 py-2.5',
                'text-sm font-semibold border transition-all duration-150',
                mode === 'expense'
                  ? 'bg-luka-expense/15 border-luka-expense/30 text-luka-expense shadow-soft-in'
                  : 'bg-neu-raised border-neu text-white/40 shadow-soft-out hover:text-white/60',
              )}
            >
              <TrendingDown className="w-3.5 h-3.5" strokeWidth={2} />
              Gasto
            </button>
            <button
              type="button"
              onClick={() => { setMode('income'); setValue('type', 'income'); }}
              className={cn(
                'flex items-center justify-center gap-2',
                'rounded-[1rem] px-3 py-2.5',
                'text-sm font-semibold border transition-all duration-150',
                mode === 'income'
                  ? 'bg-luka-income/15 border-luka-income/30 text-luka-income shadow-soft-in'
                  : 'bg-neu-raised border-neu text-white/40 shadow-soft-out hover:text-white/60',
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
              Ingreso
            </button>
            <button
              type="button"
              onClick={() => setMode('transfer')}
              className={cn(
                'flex items-center justify-center gap-2',
                'rounded-[1rem] px-3 py-2.5',
                'text-sm font-semibold border transition-all duration-150',
                mode === 'transfer'
                  ? 'bg-luka-info/15 border-luka-info/30 text-luka-info shadow-soft-in'
                  : 'bg-neu-raised border-neu text-white/40 shadow-soft-out hover:text-white/60',
              )}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={2} />
              Traspaso
            </button>
          </div>
        </div>

        <div className={cn('space-y-5 transition-opacity duration-300', isTransfer && 'mt-6')}>
          {/* Amount */}
          <div>
            <FieldLabel required>Monto</FieldLabel>
            <div className="relative">
              <span className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold',
                isTransfer ? 'text-luka-info' : mode === 'income' ? 'text-luka-income' : 'text-luka-expense',
              )}>
                {isTransfer ? '' : mode === 'income' ? '+' : '−'}
              </span>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className={isTransfer ? 'pl-4' : 'pl-8'}
                {...register('amount')}
              />
            </div>
            <FieldError message={errors.amount?.message} />
          </div>

          {/* Account(s): single selector or Origen → Destino layout */}
          {isTransfer ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <FieldLabel required>Desde</FieldLabel>
                <Select {...register('account_id')}>
                  <option value="">Seleccionar…</option>
                  {activeAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency_code})
                    </option>
                  ))}
                </Select>
                <FieldError message={errors.account_id?.message} />
              </div>
              <div className="flex items-center justify-center pt-6 shrink-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-luka-info/10 border border-luka-info/20 shadow-soft-out">
                  <ArrowRight className="w-5 h-5 text-luka-info" strokeWidth={2} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <FieldLabel required>Hacia</FieldLabel>
                <Select {...register('destination_account_id')}>
                  <option value="">Seleccionar…</option>
                  {destinationAccountOptions.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency_code})
                    </option>
                  ))}
                </Select>
                <FieldError message={errors.destination_account_id?.message} />
              </div>
            </div>
          ) : (
            <div>
              <FieldLabel required>Cuenta</FieldLabel>
              <Select {...register('account_id')}>
                <option value="">Seleccionar cuenta…</option>
                {activeAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                    {acc.bank_account_details?.bank_name ? ` — ${acc.bank_account_details.bank_name}` : ''}
                    {' '}({acc.currency_code})
                  </option>
                ))}
              </Select>
              <FieldError message={errors.account_id?.message} />
            </div>
          )}

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

          {/* Category + Date side by side (Category hidden for TRANSFER) */}
          <div className={cn('grid gap-4', isTransfer ? 'grid-cols-1' : 'grid-cols-2')}>
            {!isTransfer && (
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
            )}
            <div>
              <FieldLabel required>Fecha y hora</FieldLabel>
              <Input type="datetime-local" {...register('occurred_at')} />
              <FieldError message={errors.occurred_at?.message} />
            </div>
          </div>

          {/* Kind + Status (Kind hidden for Traspaso) */}
          <div className={cn('grid gap-4', isTransfer ? 'grid-cols-1' : 'grid-cols-2')}>
            {!isTransfer && (
              <div>
                <FieldLabel>Tipo</FieldLabel>
                <Select {...register('kind')}>
                  <option value="NORMAL">Normal</option>
                  <option value="FEE">Comisión</option>
                  <option value="INTEREST">Interés</option>
                  <option value="ADJUSTMENT">Ajuste</option>
                </Select>
              </div>
            )}
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
            'mt-5 px-4 py-3 rounded-[0.75rem] border text-sm font-semibold shadow-soft-out',
            isTransfer
              ? 'bg-luka-info/8 border-luka-info/20 text-luka-info'
              : mode === 'income'
                ? 'bg-luka-income/8 border-luka-income/20 text-luka-income'
                : 'bg-luka-expense/8 border-luka-expense/20 text-luka-expense',
          )}>
            {isTransfer ? (
              <>Se traspasarán <span className="font-mono">{parseFloat(watch('amount') || '0').toFixed(2)}</span> de origen a destino</>
            ) : (
              <>El monto se guardará como <span className="font-mono">{mode === 'income' ? '+' : '−'}{parseFloat(watch('amount') || '0').toFixed(2)}</span></>
            )}
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
            ) : isEditMode ? (
              'Guardar Cambios'
            ) : isTransfer ? (
              'Realizar Traspaso'
            ) : (
              'Guardar Transacción'
            )}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

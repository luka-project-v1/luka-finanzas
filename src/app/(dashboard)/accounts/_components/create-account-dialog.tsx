'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { FieldLabel, FieldError, Input, Select } from '@/components/ui/form-fields';
import { createBankAccount, updateBankAccount } from '@/lib/actions/accounts';
import { cn } from '@/lib/utils/cn';
import type { AccountWithDetails } from '@/lib/repositories/account-repository';

// ─── Form schema ──────────────────────────────────────────────────────────
// Number fields kept as strings so HTML inputs work naturally;
// we transform them before calling the server action.
const formSchema = z.object({
  name: z.string().min(1, 'El nombre de la cuenta es obligatorio').max(100),
  kind: z.enum(['SAVINGS', 'CHECKING'], { required_error: 'El tipo de cuenta es obligatorio' }),
  currency_code: z.enum(['USD', 'COP'], { required_error: 'La moneda es obligatoria' }),
  bank_name: z.string().max(100).optional(),
  masked_number: z.string().max(20).optional(),
  institution_name: z.string().max(100).optional(),
  opened_at: z.string().optional(),
  interest_rate_annual: z.string().optional(),
  monthly_fee: z.string().optional(),
  overdraft_limit: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Main component ────────────────────────────────────────────────────────
interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** When provided, the dialog works in edit mode with pre-filled data */
  account?: AccountWithDetails | null;
}

export function CreateAccountDialog({
  open,
  onOpenChange,
  onSuccess,
  account,
}: CreateAccountDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showOptional, setShowOptional] = useState(false);
  const isEditMode = !!account;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      kind: 'SAVINGS',
      currency_code: 'USD',
      bank_name: '',
      masked_number: '',
      institution_name: '',
      opened_at: '',
      interest_rate_annual: '',
      monthly_fee: '',
      overdraft_limit: '',
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = form;

  // Pre-fill form when editing
  useEffect(() => {
    if (open && account) {
      const details = account.bank_account_details;
      reset({
        name: account.name,
        kind: (details?.kind ?? 'SAVINGS') as 'SAVINGS' | 'CHECKING',
        currency_code: (account.currency_code ?? 'USD') as 'USD' | 'COP',
        bank_name: details?.bank_name ?? '',
        masked_number: details?.masked_number ?? '',
        institution_name: account.institution_name ?? '',
        opened_at: account.opened_at ?? '',
        interest_rate_annual: details?.interest_rate_annual != null
          ? String(details.interest_rate_annual)
          : '',
        monthly_fee: details?.monthly_fee != null ? String(details.monthly_fee) : '',
        overdraft_limit: details?.overdraft_limit != null ? String(details.overdraft_limit) : '',
      });
      setShowOptional(
        !!(details?.bank_name || details?.masked_number || account.institution_name ||
          account.opened_at || details?.interest_rate_annual || details?.monthly_fee || details?.overdraft_limit)
      );
    } else if (!open) {
      reset({
        name: '',
        kind: 'SAVINGS',
        currency_code: 'USD',
        bank_name: '',
        masked_number: '',
        institution_name: '',
        opened_at: '',
        interest_rate_annual: '',
        monthly_fee: '',
        overdraft_limit: '',
      });
      setShowOptional(false);
    }
  }, [open, account, reset]);

  function handleClose() {
    reset();
    setServerError(null);
    setShowOptional(false);
    onOpenChange(false);
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);

    const payload = {
      name: values.name,
      kind: values.kind,
      currency_code: values.currency_code,
      bank_name: values.bank_name || null,
      masked_number: values.masked_number || null,
      institution_name: values.institution_name || null,
      opened_at: values.opened_at || null,
      interest_rate_annual: values.interest_rate_annual
        ? parseFloat(values.interest_rate_annual)
        : null,
      monthly_fee: values.monthly_fee
        ? parseFloat(values.monthly_fee)
        : null,
      overdraft_limit: values.overdraft_limit
        ? parseFloat(values.overdraft_limit)
        : null,
    };

    if (isEditMode && account) {
      const result = await updateBankAccount(account.id, payload);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
    } else {
      const result = await createBankAccount(payload);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
    }

    reset();
    setShowOptional(false);
    onSuccess();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title={isEditMode ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
      description={
        isEditMode
          ? 'Modifica los datos de tu cuenta bancaria.'
          : 'Agrega una cuenta bancaria para empezar a gestionar tus finanzas.'
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* ── Required fields ── */}
        <div className="space-y-5">
          {/* Nombre de la cuenta */}
          <div>
            <FieldLabel required>Nombre de la cuenta</FieldLabel>
            <Input
              placeholder="ej. Bancolombia Ahorro"
              autoComplete="off"
              {...register('name')}
            />
            <FieldError message={errors.name?.message} />
          </div>

          {/* Tipo + Moneda lado a lado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Tipo de cuenta</FieldLabel>
              <Select {...register('kind')}>
                <option value="SAVINGS">Ahorro</option>
                <option value="CHECKING">Corriente</option>
              </Select>
              <FieldError message={errors.kind?.message} />
            </div>
            <div>
              <FieldLabel required>Moneda</FieldLabel>
              <Select {...register('currency_code')}>
                <option value="USD">USD — Dólar</option>
                <option value="COP">COP — Peso</option>
              </Select>
              <FieldError message={errors.currency_code?.message} />
            </div>
          </div>
        </div>

        {/* ── Optional fields toggle ── */}
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          className="
            flex items-center gap-2 mt-6 mb-1
            text-xs font-medium text-neu-muted
            hover:text-white/60 transition-colors duration-150
          "
        >
          {showOptional
            ? <ChevronUp className="w-3.5 h-3.5" />
            : <ChevronDown className="w-3.5 h-3.5" />}
          {showOptional ? 'Ocultar' : 'Mostrar'} detalles adicionales
        </button>

        {/* ── Optional fields ── */}
        {showOptional && (
          <div className="space-y-5 mt-4 pt-5 border-t border-[#1e1e1e]">
            {/* Nombre del banco + Últimos 4 dígitos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Nombre del banco</FieldLabel>
                <Input placeholder="ej. Bancolombia" {...register('bank_name')} />
                <FieldError message={errors.bank_name?.message} />
              </div>
              <div>
                <FieldLabel>Últimos 4 dígitos</FieldLabel>
                <Input
                  placeholder="ej. 4242"
                  maxLength={4}
                  {...register('masked_number')}
                />
                <FieldError message={errors.masked_number?.message} />
              </div>
            </div>

            {/* Nombre de la institución */}
            <div>
              <FieldLabel>Nombre de la institución</FieldLabel>
              <Input
                placeholder="ej. Banco de Bogotá S.A."
                {...register('institution_name')}
              />
              <FieldError message={errors.institution_name?.message} />
            </div>

            {/* Fecha de apertura */}
            <div>
              <FieldLabel>Fecha de apertura</FieldLabel>
              <Input type="date" {...register('opened_at')} />
              <FieldError message={errors.opened_at?.message} />
            </div>

            {/* Tasas y comisiones */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <FieldLabel>Tasa anual %</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0.00"
                  {...register('interest_rate_annual')}
                />
                <FieldError message={errors.interest_rate_annual?.message} />
              </div>
              <div>
                <FieldLabel>Cuota mensual</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register('monthly_fee')}
                />
                <FieldError message={errors.monthly_fee?.message} />
              </div>
              <div>
                <FieldLabel>Límite de sobregiro</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register('overdraft_limit')}
                />
                <FieldError message={errors.overdraft_limit?.message} />
              </div>
            </div>
          </div>
        )}

        {/* ── Server error ── */}
        {serverError && (
          <div className="
            mt-5 px-4 py-3 rounded-[0.75rem]
            bg-luka-expense/10 border border-luka-expense/20
            text-sm text-luka-expense
          ">
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
            className="neu-btn neu-btn-primary text-sm min-w-[120px]"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEditMode ? (
              'Guardar Cambios'
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

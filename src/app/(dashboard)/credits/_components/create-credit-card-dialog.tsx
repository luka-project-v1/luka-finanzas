'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { FieldLabel, FieldError, Input, Select } from '@/components/ui/form-fields';
import { createCreditCard } from '@/lib/actions/credits';
import { cn } from '@/lib/utils/cn';

// ─── Form schema (strings for numeric inputs) ─────────────────────────────
const formSchema = z.object({
  name: z.string().min(1, 'El nombre de la tarjeta es obligatorio').max(100),
  currency_code: z.enum(['USD', 'COP']),
  credit_limit: z
    .string()
    .min(1, 'El límite de crédito es obligatorio')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Debe ser ≥ 0'),
  // Optional details
  bank_name: z.string().max(100).optional(),
  issuer: z.string().max(50).optional(),
  last4: z
    .string()
    .length(4, 'Deben ser exactamente 4 dígitos')
    .regex(/^\d{4}$/, 'Deben ser 4 dígitos')
    .optional()
    .or(z.literal('')),
  interest_rate_annual: z.string().optional(),
  interest_rate_monthly: z.string().optional(),
  billing_cycle_day: z.string().optional(),
  payment_due_day: z.string().optional(),
  management_fee: z.string().optional(),
  management_fee_period: z.enum(['MONTHLY', 'ANNUAL', '']).optional(),
  institution_name: z.string().max(100).optional(),
  opened_at: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────
function toFloat(v?: string): number | null {
  if (!v || v.trim() === '') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}
function toInt(v?: string): number | null {
  if (!v || v.trim() === '') return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

// ─── Component ────────────────────────────────────────────────────────────
interface CreateCreditCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCreditCardDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCreditCardDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showOptional, setShowOptional] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      currency_code: 'USD',
      credit_limit: '',
      bank_name: '',
      issuer: 'VISA',
      last4: '',
      interest_rate_annual: '',
      interest_rate_monthly: '',
      billing_cycle_day: '',
      payment_due_day: '',
      management_fee: '',
      management_fee_period: '',
      institution_name: '',
      opened_at: '',
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = form;

  function handleClose() {
    reset();
    setServerError(null);
    setShowOptional(false);
    onOpenChange(false);
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);

    const result = await createCreditCard({
      name: values.name,
      currency_code: values.currency_code,
      credit_limit: parseFloat(values.credit_limit),
      bank_name: values.bank_name || null,
      issuer: values.issuer || null,
      last4: values.last4 || null,
      interest_rate_annual: toFloat(values.interest_rate_annual),
      interest_rate_monthly: toFloat(values.interest_rate_monthly),
      billing_cycle_day: toInt(values.billing_cycle_day),
      payment_due_day: toInt(values.payment_due_day),
      management_fee: toFloat(values.management_fee),
      management_fee_period: values.management_fee_period || null,
      institution_name: values.institution_name || null,
      opened_at: values.opened_at || null,
    });

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    reset();
    setShowOptional(false);
    onSuccess();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title="Agregar Tarjeta de Crédito"
      description="Registra una tarjeta de crédito para rastrear cargos y pagos."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* ── Required fields ── */}
        <div className="space-y-5">
          {/* Nombre de la tarjeta */}
          <div>
            <FieldLabel required>Nombre de la tarjeta</FieldLabel>
            <Input placeholder="ej. Visa Oro Bancolombia" {...register('name')} />
            <FieldError message={errors.name?.message} />
          </div>

          {/* Moneda + Emisor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Moneda</FieldLabel>
              <Select {...register('currency_code')}>
                <option value="USD">USD — Dólar</option>
                <option value="COP">COP — Peso</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Red / Emisor</FieldLabel>
              <Select {...register('issuer')}>
                <option value="VISA">Visa</option>
                <option value="MASTERCARD">Mastercard</option>
                <option value="AMEX">American Express</option>
                <option value="OTHER">Otro</option>
              </Select>
            </div>
          </div>

          {/* Límite de crédito */}
          <div>
            <FieldLabel required>Límite de crédito</FieldLabel>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="5000.00"
              {...register('credit_limit')}
            />
            <FieldError message={errors.credit_limit?.message} />
          </div>
        </div>

        {/* ── Optional toggle ── */}
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          className="flex items-center gap-2 mt-6 mb-1 text-xs font-medium text-neu-muted hover:text-white/60 transition-colors"
        >
          {showOptional ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showOptional ? 'Ocultar' : 'Mostrar'} detalles adicionales
        </button>

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
                  placeholder="4242"
                  maxLength={4}
                  {...register('last4')}
                />
                <FieldError message={errors.last4?.message} />
              </div>
            </div>

            {/* Día de corte + Día de pago */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Día de corte</FieldLabel>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="15"
                  {...register('billing_cycle_day')}
                />
                <p className="text-[10px] text-neu-muted mt-1">Día del mes (1–31)</p>
              </div>
              <div>
                <FieldLabel>Día de pago</FieldLabel>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="25"
                  {...register('payment_due_day')}
                />
                <p className="text-[10px] text-neu-muted mt-1">Día del mes (1–31)</p>
              </div>
            </div>

            {/* Tasas de interés */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Tasa de interés anual %</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="24.99"
                  {...register('interest_rate_annual')}
                />
              </div>
              <div>
                <FieldLabel>Tasa de interés mensual %</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="1.99"
                  {...register('interest_rate_monthly')}
                />
              </div>
            </div>

            {/* Cuota de manejo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Cuota de manejo</FieldLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register('management_fee')}
                />
              </div>
              <div>
                <FieldLabel>Período de cuota</FieldLabel>
                <Select {...register('management_fee_period')}>
                  <option value="">Ninguno</option>
                  <option value="MONTHLY">Mensual</option>
                  <option value="ANNUAL">Anual</option>
                </Select>
              </div>
            </div>

            {/* Institución + Fecha de apertura */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Nombre de la institución</FieldLabel>
                <Input placeholder="ej. Banco de Bogotá S.A." {...register('institution_name')} />
              </div>
              <div>
                <FieldLabel>Fecha de apertura</FieldLabel>
                <Input type="date" {...register('opened_at')} />
              </div>
            </div>
          </div>
        )}

        {/* ── Server error ── */}
        {serverError && (
          <div className="mt-5 px-4 py-3 rounded-[0.75rem] bg-luka-expense/10 border border-luka-expense/20 text-sm text-luka-expense">
            {serverError}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 mt-7">
          <button type="button" onClick={handleClose} disabled={isSubmitting}
            className="neu-btn text-sm text-white/50 hover:text-white/80">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting}
            className="neu-btn neu-btn-primary text-sm min-w-[130px]">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Agregar Tarjeta'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

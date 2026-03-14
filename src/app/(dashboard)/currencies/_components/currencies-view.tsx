'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  CircleDollarSign,
  Star,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { refreshExchangeRates } from '@/lib/actions/currencies';

// ─── Types ─────────────────────────────────────────────────────────────────

type Currency = {
  id: string;
  user_id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_preferred: number | null;
  created_at?: string;
  updated_at?: string;
};

// ─── Toast ─────────────────────────────────────────────────────────────────

type ToastState = {
  type: 'success' | 'error';
  message: string;
} | null;

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'flex items-center gap-3 px-5 py-3.5 rounded-2xl',
        'text-sm font-medium',
        'shadow-soft-out-lg border',
        'animate-in slide-in-from-bottom-4 fade-in duration-200',
        toast.type === 'success'
          ? 'bg-[#0f1a12] border-luka-income/20 text-luka-income'
          : 'bg-[#1a0f0f] border-luka-expense/20 text-luka-expense',
      )}
      role="alert"
    >
      {toast.type === 'success' ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} />
      ) : (
        <XCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
      )}
      {toast.message}
      <button
        onClick={onDismiss}
        className="ml-2 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

// ─── Currency row ───────────────────────────────────────────────────────────

function CurrencyRow({
  currency,
  preferredCode,
}: {
  currency: Currency;
  preferredCode: string | null;
}) {
  const isPreferred = currency.code === preferredCode;
  const rate = currency.exchange_rate_to_preferred;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-6 py-5',
        'border-b border-[#1a1a1a] last:border-0',
        'transition-colors duration-150 hover:bg-[#141414]',
      )}
    >
      {/* Left: icon + name */}
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full shrink-0',
            isPreferred
              ? 'bg-luka-accent/15 shadow-soft-accent'
              : 'bg-neu-raised shadow-soft-out',
          )}
        >
          <span
            className={cn(
              'text-sm font-bold tabular-nums',
              isPreferred ? 'text-luka-accent' : 'text-white/60',
            )}
          >
            {currency.symbol}
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white/85">{currency.code}</span>
            <span className="text-xs text-neu-muted truncate">{currency.name}</span>
          </div>

          {isPreferred ? (
            <span className="
              inline-flex items-center gap-1 mt-1
              text-[10px] font-semibold uppercase tracking-wider
              px-2 py-0.5 rounded-full
              bg-luka-accent/10 border border-luka-accent/20 text-luka-accent
            ">
              <Star className="w-2.5 h-2.5 fill-current" />
              Moneda base
            </span>
          ) : (
            <span className="
              inline-flex items-center mt-1
              text-[10px] font-medium
              text-neu-muted
            ">
              Moneda de cambio
            </span>
          )}
        </div>
      </div>

      {/* Right: exchange rate */}
      <div className="shrink-0 text-right">
        {isPreferred ? (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-lg font-bold text-white/80 tabular-nums">1.00</span>
            <span className="text-[10px] text-neu-muted uppercase tracking-wider">
              Tasa base
            </span>
          </div>
        ) : rate !== null && rate !== undefined ? (
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-neu-muted" strokeWidth={1.5} />
              <span className="text-lg font-bold text-white/80 tabular-nums">
                {rate.toLocaleString('es-CO', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <span className="text-[10px] text-neu-muted">
              1 {currency.code} = {rate.toLocaleString('es-CO')} {preferredCode}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-sm font-medium text-neu-muted">—</span>
            <span className="text-[10px] text-neu-muted">Tasa no configurada</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-5 py-20 text-center neu-card">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-luka-accent/10 shadow-soft-out">
        <CircleDollarSign className="w-7 h-7 text-luka-accent" strokeWidth={1.5} />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-white/70">Sin divisas configuradas</p>
        <p className="text-sm text-neu-muted max-w-xs">
          No se pudieron crear las divisas predeterminadas. Intenta recargar la página.
        </p>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

interface CurrenciesViewProps {
  currencies: Currency[];
  baseCurrencyCode: string;
}

export function CurrenciesView({ currencies, baseCurrencyCode }: CurrenciesViewProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const preferredCode = baseCurrencyCode;
  const preferredCurrency = currencies.find((c) => c.code === preferredCode) ?? null;

  // Sort: preferred first, then alphabetical
  const sorted = [...currencies].sort((a, b) => {
    if (a.code === preferredCode) return -1;
    if (b.code === preferredCode) return 1;
    return a.code.localeCompare(b.code);
  });

  const lastUpdated = currencies
    .map((c) => c.updated_at)
    .filter(Boolean)
    .sort()
    .at(-1);

  async function handleRefresh() {
    setIsPending(true);
    try {
      const result = await refreshExchangeRates();
      if (result.success) {
        const { updated, skipped } = result.data;
        const msg = skipped > 0
          ? `${updated} divisa(s) actualizada(s), ${skipped} omitida(s).`
          : `${updated} divisa(s) actualizada(s) correctamente.`;
        setToast({ type: 'success', message: msg });
        router.refresh();
      } else {
        setToast({
          type: 'error',
          message: 'error' in result ? result.error : 'Error al actualizar las tasas de cambio.',
        });
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <p className="text-xs font-medium text-neu-muted uppercase tracking-widest">
            Configuración
          </p>
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">Divisas</h1>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isPending || currencies.length === 0}
          className="neu-btn neu-btn-primary text-sm"
        >
          <RefreshCw
            className={cn('w-4 h-4', isPending && 'animate-spin')}
            strokeWidth={2}
          />
          {isPending ? 'Actualizando…' : 'Actualizar Tasas de Cambio'}
        </button>
      </div>

      {currencies.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="max-w-2xl space-y-6">

          {/* ── Auto-update indicator ── */}
          <div className="neu-card px-5 py-3.5 flex items-center gap-3 border-l-4 border-luka-income/40">
            <Clock className="w-4 h-4 text-luka-income shrink-0" strokeWidth={2} />
            <div>
              <p className="text-xs text-neu-muted uppercase tracking-widest">
                Actualización automática
              </p>
              <p className="text-sm font-semibold text-luka-income">
                Activa (cada 12h)
              </p>
            </div>
          </div>

          {/* ── Summary strip ── */}
          <div className="flex flex-wrap gap-3">
            <div className="neu-card px-5 py-3.5 flex items-center gap-3">
              <p className="text-xs text-neu-muted uppercase tracking-widest">Divisas</p>
              <p className="text-lg font-bold text-white/80 tabular-nums">{currencies.length}</p>
            </div>
            {preferredCurrency && (
              <div className="neu-card px-5 py-3.5 flex items-center gap-3">
                <p className="text-xs text-neu-muted uppercase tracking-widest">Base</p>
                <p className="text-lg font-bold text-luka-accent tabular-nums">
                  {preferredCurrency.code}
                </p>
              </div>
            )}
            {lastUpdated && (
              <div className="neu-card px-5 py-3.5 flex items-center gap-3">
                <p className="text-xs text-neu-muted uppercase tracking-widest">Última sincronización</p>
                <p className="text-sm font-medium text-white/60 tabular-nums">
                  {new Date(lastUpdated).toLocaleDateString('es-CO', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
          </div>

          {/* ── Currency list card ── */}
          <div className="neu-card overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
              <div className="flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-luka-accent" strokeWidth={1.5} />
                <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                  Divisas configuradas
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-neu-muted">
                <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                <span>Tasa relativa a la base</span>
              </div>
            </div>

            {/* Rows */}
            {sorted.map((currency) => (
              <CurrencyRow
                key={currency.id}
                currency={currency}
                preferredCode={preferredCode}
              />
            ))}
          </div>

          {/* ── Help note ── */}
          <p className="text-xs text-neu-muted leading-relaxed px-1">
            La <span className="text-white/40">moneda base</span> se utiliza como referencia
            para todas las conversiones de tasas de cambio en la aplicación. Las tasas de cambio
            se almacenan localmente y pueden actualizarse en cualquier momento con el botón de arriba.
          </p>
        </div>
      )}

      {/* ── Toast ── */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

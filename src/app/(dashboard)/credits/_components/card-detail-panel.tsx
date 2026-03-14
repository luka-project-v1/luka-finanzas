'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  CalendarDays,
  CreditCard,
  Percent,
  AlertCircle,
} from 'lucide-react';
import { getCreditCardTransactions } from '@/lib/actions/credits';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import { Skeleton } from '@/components/ui/skeleton';
import type { CreditCard as CreditCardType } from '@/lib/repositories/credit-card-repository';
import type { TransactionWithRelations } from '@/lib/repositories/transaction-repository';

// ─── Helpers ──────────────────────────────────────────────────────────────
function currencySymbol(code: string | null) {
  const map: Record<string, string> = { USD: '$', COP: 'COP$', EUR: '€' };
  return code ? (map[code] ?? code) : '$';
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function utilizationColor(pct: number): string {
  if (pct < 30) return '#4ade80';
  if (pct < 70) return '#fbbf24';
  return '#f87171';
}

// ─── Utilization bar ──────────────────────────────────────────────────────
function UtilizationBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const color = utilizationColor(clamped);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium text-neu-muted uppercase tracking-widest">
          Uso del crédito
        </p>
        <span
          className="text-xs font-bold tabular-nums"
          style={{ color }}
        >
          {clamped.toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-neu-raised overflow-hidden shadow-soft-in">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────
function StatTile({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-1 bg-neu-raised rounded-[1rem] px-4 py-3 shadow-soft-out">
      <p className="text-[10px] font-medium text-neu-muted uppercase tracking-widest">
        {label}
      </p>
      <p
        className={cn('text-lg font-bold tabular-nums tracking-tight', color ?? 'text-white/80')}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-neu-muted">{sub}</p>}
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  POSTED: 'Registrada',
  PENDING: 'Pendiente',
  VOID: 'Anulada',
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    POSTED: 'bg-luka-income/10 text-luka-income border-luka-income/20',
    PENDING: 'bg-luka-warning/10 text-luka-warning border-luka-warning/20',
    VOID: 'bg-neu-raised text-neu-muted border-neu',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full',
        'text-[10px] font-semibold uppercase tracking-wider border',
        styles[status] ?? styles.VOID,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Transaction row ──────────────────────────────────────────────────────
function TxRow({ tx }: { tx: TransactionWithRelations }) {
  const signed = Number(tx.signed_amount ?? 0);
  // Convention: negative = charge/expense (increases debt), positive = payment (reduces debt)
  const isCharge = signed < 0;
  const isPayment = signed > 0;
  const isNeutral = tx.kind === 'ADJUSTMENT';

  // Derive display values without nested ternaries
  let IconComp: typeof ArrowLeftRight = ArrowLeftRight;
  let iconColor = 'text-white/40';
  let iconBg = 'bg-neu-raised';
  let amountColor = 'text-white/60';
  let signPrefix = '';
  let defaultLabel = 'Ajuste';

  if (!isNeutral) {
    if (isCharge) {
      IconComp = ArrowDownRight;
      iconColor = 'text-luka-expense';
      iconBg = 'bg-luka-expense/10';
      amountColor = 'text-luka-expense';
      signPrefix = '−';
      defaultLabel = 'Cargo';
    } else if (isPayment) {
      IconComp = ArrowUpRight;
      iconColor = 'text-luka-income';
      iconBg = 'bg-luka-income/10';
      amountColor = 'text-luka-income';
      signPrefix = '+';
      defaultLabel = 'Pago';
    }
  }

  const label = tx.description || defaultLabel;

  return (
    <div className="
      flex items-center gap-3 px-4 py-3
      border-b border-[#1a1a1a] last:border-0
      hover:bg-[#161616]/60 transition-colors duration-100
      rounded-[0.5rem]
    ">
      {/* Icon */}
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full shrink-0 shadow-soft-out',
          iconBg,
        )}
      >
        <IconComp className={cn('w-3.5 h-3.5', iconColor)} strokeWidth={2} />
      </div>

      {/* Description + category */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/75 truncate">{label}</p>
        <p className="text-xs text-neu-muted truncate">
          {(tx.categories as any)?.name ?? tx.kind}
        </p>
      </div>

      {/* Date */}
      <div className="hidden sm:block text-right shrink-0">
        <p className="text-xs text-white/40 tabular-nums" suppressHydrationWarning>
          {tx.occurred_at ? formatDate(tx.occurred_at, 'MMM d') : '—'}
        </p>
      </div>

      {/* Status */}
      <div className="hidden md:flex shrink-0">
        <StatusBadge status={tx.status} />
      </div>

      {/* Amount: charge = "−" red, payment = "+" green, neutral = no prefix */}
      <p className={cn('text-sm font-semibold tabular-nums shrink-0 text-right min-w-[80px]', amountColor)}>
        {signPrefix}
        {formatCurrency(Math.abs(signed), '$')}
      </p>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="space-y-5 p-6">
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-neu-raised rounded-[1rem] p-3 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      {[0, 1, 2, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-2.5 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
interface CardDetailPanelProps {
  card: CreditCardType;
}

export function CardDetailPanel({ card }: CardDetailPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const d = card.credit_card_details;
  const sym = currencySymbol(card.currency_code);
  const limit = Number(d.credit_limit ?? 0);
  // Convention: balance is negative when in debt (e.g. -5000 means $5,000 owed).
  // "Total Cargado" = absolute value of the negative portion (debt amount).
  // "Disponible"    = credit_limit + balance  (limit minus debt).
  const balance = Number(card.balance ?? 0);
  const charged = Math.abs(Math.min(0, balance));
  const available = Math.max(0, limit + balance);
  const utilPct = limit > 0 ? (charged / limit) * 100 : 0;

  useEffect(() => {
    setLoadError(null);
    startTransition(async () => {
      const result = await getCreditCardTransactions(card.id);
      if (result.success) {
        setTransactions(result.data as TransactionWithRelations[]);
      } else {
        setLoadError((result as any).error);
      }
    });
  }, [card.id]);

  return (
    <div className="neu-card overflow-hidden">
      {isPending ? (
        <DetailSkeleton />
      ) : (
        <div className="p-6 space-y-6">
          {/* ── Stats ── */}
          <div className="grid grid-cols-3 gap-3">
            <StatTile
              label="Total cargado"
              value={formatCurrency(charged, sym)}
              color={charged > 0 ? 'text-luka-expense' : 'text-white/80'}
            />
            <StatTile
              label="Disponible"
              value={formatCurrency(available, sym)}
              color={available < limit * 0.2 ? 'text-luka-expense' : 'text-luka-income'}
            />
            <StatTile
              label="Límite de crédito"
              value={formatCurrency(limit, sym)}
            />
          </div>

          {/* ── Utilization bar ── */}
          {limit > 0 && <UtilizationBar pct={utilPct} />}

          {/* ── Card metadata ── */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {d.billing_cycle_day && (
              <div className="flex items-center gap-1.5 text-xs text-neu-muted">
                <CalendarDays className="w-3.5 h-3.5" />
                Día de corte: <span className="text-white/60">{d.billing_cycle_day}</span>
              </div>
            )}
            {d.payment_due_day && (
              <div className="flex items-center gap-1.5 text-xs text-neu-muted">
                <CreditCard className="w-3.5 h-3.5" />
                Día de pago: <span className="text-white/60">{d.payment_due_day}</span>
              </div>
            )}
            {d.interest_rate_annual && (
              <div className="flex items-center gap-1.5 text-xs text-neu-muted">
                <Percent className="w-3.5 h-3.5" />
                TNA <span className="text-white/60">{Number(d.interest_rate_annual).toFixed(2)}%</span>
              </div>
            )}
            {d.interest_rate_monthly && (
              <div className="flex items-center gap-1.5 text-xs text-neu-muted">
                <Percent className="w-3.5 h-3.5" />
                Tasa mensual <span className="text-white/60">{Number(d.interest_rate_monthly).toFixed(2)}%</span>
              </div>
            )}
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-[#1e1e1e]" />

          {/* ── Transactions ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                Transacciones
              </h3>
              <span className="text-xs text-neu-muted">
                {transactions.length} en total
              </span>
            </div>

            {loadError && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-[0.75rem] bg-luka-expense/10 border border-luka-expense/20 text-sm text-luka-expense">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {loadError}
              </div>
            )}

            {!loadError && transactions.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-sm text-white/40">Aún no hay transacciones en esta tarjeta.</p>
              </div>
            )}

            {transactions.length > 0 && (
              <div className="space-y-0.5">
                {transactions.slice(0, 30).map((tx) => (
                  <TxRow key={tx.id} tx={tx} />
                ))}
                {transactions.length > 30 && (
                  <p className="text-center text-xs text-neu-muted pt-3">
                    Mostrando 30 de {transactions.length} — ver todo en Transacciones
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { HandCoins, AlertCircle, UserRound, Target } from 'lucide-react';
import { getDebtSummary } from '@/lib/actions/transactions';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Skeleton exported for Suspense fallback ───────────────────────────────
export function DebtSummarySkeleton() {
  return (
    <div className="neu-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>
      <Skeleton className="h-8 w-44" />
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Data component ────────────────────────────────────────────────────────
export async function DebtSummary() {
  const result = await getDebtSummary();

  if (!result.success) return null;

  const { totalPending, items } = result.data;
  const activeItems = items.filter((item) => item.pending > 0);

  if (activeItems.length === 0 && totalPending === 0) return null;

  return (
    <div className="neu-card p-6 flex flex-col gap-5 relative overflow-hidden">
      {/* Subtle amber radial accent */}
      <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-15 blur-2xl bg-luka-warning" />

      {/* Header */}
      <div className="flex items-center justify-between relative">
        <span className="text-xs font-medium text-neu-muted uppercase tracking-widest">
          Pendiente por Reponer
        </span>
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-luka-warning/10 shadow-soft-out">
          <HandCoins className="w-4 h-4 text-luka-warning" strokeWidth={1.5} />
        </div>
      </div>

      {/* Total */}
      <div className="relative">
        <p className="text-2xl font-bold tracking-tight text-luka-warning">
          {formatCurrency(totalPending, '$')}
        </p>
        <p className="text-xs text-neu-muted mt-1">
          {activeItems.length} préstamo{activeItems.length !== 1 ? 's' : ''} con saldo pendiente
        </p>
      </div>

      {/* Item list (max 4 shown) */}
      {activeItems.length > 0 && (
        <ul className="space-y-2 relative">
          {activeItems.slice(0, 4).map((item) => {
            const isSelf = item.loan_type === 'SELF';
            const Icon = isSelf ? Target : UserRound;
            const progressPct = item.original_amount > 0
              ? Math.min(100, (item.repaid_amount / item.original_amount) * 100)
              : 0;

            return (
              <li
                key={item.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl border',
                  'bg-neu-raised border-neu shadow-soft-out',
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-full shrink-0',
                  isSelf ? 'bg-luka-info/10' : 'bg-luka-warning/10',
                )}>
                  <Icon
                    className={cn('w-3.5 h-3.5', isSelf ? 'text-luka-info' : 'text-luka-warning')}
                    strokeWidth={2}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/80 truncate">
                    {item.lender_name ?? (isSelf ? 'Auto-préstamo' : 'Prestamista desconocido')}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full bg-neu overflow-hidden">
                      <div
                        className="h-full rounded-full bg-luka-warning/60 transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-neu-muted shrink-0">
                      {progressPct.toFixed(0)}% pagado
                    </span>
                  </div>
                </div>
                <p className="text-xs font-bold text-luka-warning shrink-0">
                  {formatCurrency(item.pending, '$')}
                </p>
              </li>
            );
          })}

          {activeItems.length > 4 && (
            <li className="text-center text-[11px] text-neu-muted py-1">
              +{activeItems.length - 4} más · ve a Transacciones
            </li>
          )}
        </ul>
      )}

      {/* Footer notice */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-luka-warning/5 border border-luka-warning/15 relative">
        <AlertCircle className="w-3.5 h-3.5 text-luka-warning/60 shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-[11px] text-luka-warning/70 leading-relaxed">
          Los montos mostrados deben ser repuestos a tu cuenta. Registra pagos parciales editando cada transacción.
        </p>
      </div>
    </div>
  );
}

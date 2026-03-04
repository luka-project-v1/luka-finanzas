import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, ChevronRight, ReceiptText } from 'lucide-react';
import { getTransactions, getLastAdjustmentDates } from '@/lib/actions/transactions';
import { getBankAccounts } from '@/lib/actions/accounts';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import { Skeleton } from '@/components/ui/skeleton';
import type { TransactionWithRelations } from '@/lib/repositories/transaction-repository';

// ─── Skeleton ──────────────────────────────────────────────────────────────
export function RecentTransactionsSkeleton() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="neu-card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-neu">
          {['Description', 'Account', 'Date', 'Amount'].map((h) => (
            <Skeleton key={h} className="h-3 w-16" />
          ))}
        </div>
        {/* Rows */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-4 border-b border-neu last:border-0"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
            <Skeleton className="h-3.5 w-24 self-center" />
            <Skeleton className="h-3.5 w-20 self-center" />
            <Skeleton className="h-4 w-20 self-center" />
          </div>
        ))}
      </div>
    </section>
  );
}

const STATUS_LABELS: Record<string, string> = {
  POSTED: 'Registrada',
  PENDING: 'Pendiente',
  VOID: 'Anulada',
};

const KIND_LABELS: Record<string, string> = {
  INCOME: 'Ingreso',
  EXPENSE: 'Gasto',
  TRANSFER: 'Transferencia',
  ADJUSTMENT: 'Ajuste',
  FEE: 'Comisión',
  INTEREST: 'Interés',
  NORMAL: 'Normal',
};

// ─── Status badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    POSTED: 'bg-luka-income/10 text-luka-income border-luka-income/20',
    PENDING: 'bg-luka-warning/10 text-luka-warning border-luka-warning/20',
    VOID: 'bg-neu-raised text-neu-muted border-neu',
  };
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border',
      styles[status] ?? styles.VOID,
    )}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Kind icon ────────────────────────────────────────────────────────────
function KindIcon({ kind }: { kind: string }) {
  const config: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
    INCOME: { icon: ArrowUpRight, bg: 'bg-luka-income/10', color: 'text-luka-income' },
    EXPENSE: { icon: ArrowDownRight, bg: 'bg-luka-expense/10', color: 'text-luka-expense' },
    TRANSFER: { icon: ArrowLeftRight, bg: 'bg-luka-info/10', color: 'text-luka-info' },
    ADJUSTMENT: { icon: ArrowLeftRight, bg: 'bg-luka-warning/10', color: 'text-luka-warning' },
  };
  const { icon: Icon, bg, color } = config[kind] ?? config.ADJUSTMENT;
  return (
    <div className={cn(
      'flex items-center justify-center w-8 h-8 rounded-full shrink-0 shadow-soft-out',
      bg,
    )}>
      <Icon className={cn('w-3.5 h-3.5', color)} strokeWidth={2} />
    </div>
  );
}

// ─── Amount display ────────────────────────────────────────────────────────
function Amount({ transaction }: { transaction: TransactionWithRelations }) {
  const signed = Number(transaction.signed_amount ?? 0);
  const isPositive = signed > 0;
  const isNeutral = transaction.kind === 'TRANSFER' || transaction.kind === 'ADJUSTMENT';

  return (
    <span className={cn(
      'text-sm font-semibold tabular-nums',
      isNeutral
        ? 'text-white/60'
        : isPositive
          ? 'text-luka-income'
          : 'text-luka-expense',
    )}>
      {isNeutral ? '' : isPositive ? '+' : '−'}
      {formatCurrency(Math.abs(signed), '$')}
    </span>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────
function EmptyTransactions() {
  return (
    <div className="neu-card flex flex-col items-center gap-4 py-12 text-center">
      <div className="
        flex items-center justify-center w-14 h-14
        rounded-full bg-neu-raised shadow-soft-out
      ">
        <ReceiptText className="w-6 h-6 text-neu-muted" strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-white/50">Aún no hay transacciones</p>
        <p className="text-xs text-neu-muted">Tu actividad reciente aparecerá aquí</p>
      </div>
      <Link
        href="/transactions"
        className="neu-btn-primary neu-btn text-xs"
      >
        Agregar transacción
      </Link>
    </div>
  );
}

// ─── Data component ────────────────────────────────────────────────────────
interface RecentTransactionsProps {
  startDate: string;
  endDate: string;
}

export async function RecentTransactions({ startDate, endDate }: RecentTransactionsProps) {
  // Fetch a larger batch so that after filtering out historical rows we still
  // have enough to fill the 5-row preview. Historical rows are those that
  // occurred at or before the most recent ADJUSTMENT for their account.
  const [result, accountsResult] = await Promise.all([
    getTransactions({ limit: 20, page: 1, startDate, endDate }),
    getBankAccounts(),
  ]);

  const allTransactions = result.success ? result.data.data : [];
  const transferInfo = result.success ? (result.data.transferInfo ?? {}) : {};
  const accounts = accountsResult.success ? accountsResult.data : [];
  const accountIds = accounts.map((a) => a.id);

  const adjResult = accountIds.length > 0
    ? await getLastAdjustmentDates(accountIds)
    : { success: true as const, data: {} as Record<string, { date: string; id: string }> };

  const lastAdjMap: Record<string, { date: string; id: string }> =
    adjResult.success ? adjResult.data : {};

  // Keep only "active" (non-historical) transactions for the dashboard preview.
  const transactions = allTransactions
    .filter((tx) => {
      const lastAdj = tx.account_id ? lastAdjMap[tx.account_id] : undefined;
      if (!lastAdj || !tx.occurred_at) return true;
      if (tx.kind === 'ADJUSTMENT') return tx.id === lastAdj.id;
      return tx.occurred_at > lastAdj.date;
    })
    .slice(0, 5);

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
          Transacciones Recientes
        </h2>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-xs text-luka-accent hover:text-luka-accent/80 transition-colors"
        >
          Ver todo
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <EmptyTransactions />
      ) : (
        <div className="neu-card overflow-hidden">
          {/* Table header */}
          <div className="
            hidden sm:grid sm:grid-cols-[1fr_160px_120px_100px_100px]
            gap-4 px-6 py-3
            border-b border-neu
            text-[10px] font-semibold uppercase tracking-widest text-neu-muted
          ">
            <span>Descripción</span>
            <span>Cuenta</span>
            <span>Fecha</span>
            <span>Estado</span>
            <span className="text-right">Monto</span>
          </div>

          {/* Rows */}
          {transactions.map((tx) => {
            const info = tx.transfer_id ? transferInfo[tx.transfer_id] : null;
            const signed = Number(tx.signed_amount ?? 0);
            const transferLabel =
              info && tx.kind === 'TRANSFER'
                ? signed < 0
                  ? `Hacia: ${info.toAccount.name}`
                  : `Desde: ${info.fromAccount.name}`
                : null;

            return (
              <Link
                key={tx.id}
                href={`/transactions?transactionId=${tx.id}`}
                className={cn(
                  'group flex sm:grid sm:grid-cols-[1fr_160px_120px_100px_100px]',
                  'items-center gap-4 px-6 py-4',
                  'border-b border-neu last:border-0',
                  'transition-colors duration-150',
                  'hover:bg-neu-raised/40 cursor-pointer',
                )}
              >
                {/* Description + category */}
                <div className="flex items-center gap-3 min-w-0">
                  <KindIcon kind={tx.kind} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">
                      {transferLabel ?? tx.description ?? '—'}
                    </p>
                    <p className="text-xs text-neu-muted truncate">
                      {tx.categories?.name ?? (KIND_LABELS[tx.kind] ?? tx.kind)}
                    </p>
                  </div>
                </div>

                {/* Account */}
                <p className="hidden sm:block text-xs text-white/50 truncate">
                  {(tx.accounts as any)?.name ?? '—'}
                </p>

                {/* Date */}
                <p className="hidden sm:block text-xs text-neu-muted tabular-nums">
                  {tx.occurred_at ? formatDate(tx.occurred_at, "d MMM yyyy") : '—'}
                </p>

                {/* Status */}
                <div className="hidden sm:flex">
                  <StatusBadge status={tx.status} />
                </div>

                {/* Amount */}
                <div className="ml-auto sm:ml-0 text-right">
                  <Amount transaction={tx} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

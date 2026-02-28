'use client';

import { useState, useTransition, useCallback } from 'react';
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  SlidersHorizontal,
  X,
  History,
} from 'lucide-react';
import { getLastAdjustmentDates } from '@/lib/actions/transactions';
import { format } from 'date-fns';
import { getTransactions } from '@/lib/actions/transactions';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import { Input, Select } from '@/components/ui/form-fields';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CreateTransactionDialog } from './create-transaction-dialog';
import type { TransactionWithRelations } from '@/lib/repositories/transaction-repository';
import type { AccountWithDetails } from '@/lib/repositories/account-repository';
import type { Database } from '@/lib/types/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

// ─── Helpers ───────────────────────────────────────────────────────────────
const CATEGORY_COLORS = [
  '#D97757','#4ade80','#60a5fa','#f87171','#fbbf24',
  '#a78bfa','#34d399','#fb923c','#e879f9','#22d3ee',
];

function categoryColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

function KindIcon({ kind }: { kind: string }) {
  const config: Record<string, { Icon: React.ElementType; color: string; bg: string }> = {
    NORMAL:     { Icon: ArrowUpRight,   color: 'text-white/40', bg: 'bg-neu-raised' },
    INCOME:     { Icon: ArrowUpRight,   color: 'text-luka-income',  bg: 'bg-luka-income/10' },
    EXPENSE:    { Icon: ArrowDownRight, color: 'text-luka-expense', bg: 'bg-luka-expense/10' },
    TRANSFER:   { Icon: ArrowLeftRight, color: 'text-luka-info',    bg: 'bg-luka-info/10' },
    ADJUSTMENT: { Icon: SlidersHorizontal, color: 'text-luka-warning', bg: 'bg-luka-warning/10' },
    FEE:        { Icon: ArrowDownRight, color: 'text-luka-expense', bg: 'bg-luka-expense/10' },
    INTEREST:   { Icon: ArrowUpRight,   color: 'text-luka-warning', bg: 'bg-luka-warning/10' },
  };
  const { Icon, color, bg } = config[kind] ?? config.NORMAL;
  return (
    <div className={cn(
      'flex items-center justify-center w-8 h-8 rounded-full shrink-0 shadow-soft-out',
      bg,
    )}>
      <Icon className={cn('w-3.5 h-3.5', color)} strokeWidth={2} />
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  POSTED:  'Registrada',
  PENDING: 'Pendiente',
  VOID:    'Anulada',
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    POSTED:  'bg-luka-income/10 text-luka-income border-luka-income/20',
    PENDING: 'bg-luka-warning/10 text-luka-warning border-luka-warning/20',
    VOID:    'bg-neu-raised text-neu-muted border-neu',
  };
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full',
      'text-[10px] font-semibold uppercase tracking-wider border',
      styles[status] ?? styles.VOID,
    )}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

const KIND_LABELS: Record<string, string> = {
  NORMAL:     'Normal',
  INCOME:     'Ingreso',
  EXPENSE:    'Gasto',
  TRANSFER:   'Transferencia',
  ADJUSTMENT: 'Ajuste',
  FEE:        'Comisión',
  INTEREST:   'Interés',
};

function KindBadge({ kind }: { kind: string }) {
  if (kind === 'NORMAL') return null;
  const colors: Record<string, string> = {
    TRANSFER:   'bg-luka-info/10 text-luka-info border-luka-info/20',
    ADJUSTMENT: 'bg-luka-warning/10 text-luka-warning border-luka-warning/20',
    FEE:        'bg-luka-expense/10 text-luka-expense border-luka-expense/20',
    INTEREST:   'bg-luka-warning/10 text-luka-warning border-luka-warning/20',
  };
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full',
      'text-[10px] font-semibold uppercase tracking-wider border',
      colors[kind] ?? 'bg-neu-raised text-neu-muted border-neu',
    )}>
      {KIND_LABELS[kind] ?? kind}
    </span>
  );
}

// ─── Filter bar ────────────────────────────────────────────────────────────
interface Filters {
  startDate: string;
  endDate: string;
  categoryId: string;
  accountId: string;
}

interface FilterBarProps {
  filters: Filters;
  accounts: AccountWithDetails[];
  categories: Category[];
  isPending: boolean;
  onChange: (f: Filters) => void;
  onClear: () => void;
}

function FilterBar({ filters, accounts, categories, isPending, onChange, onClear }: FilterBarProps) {
  const hasActive =
    filters.categoryId !== '' || filters.accountId !== '';

  return (
    <div className="neu-card p-4">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Date range */}
        <div className="flex items-end gap-2">
          <div>
            <p className="text-[10px] font-medium text-neu-muted uppercase tracking-widest mb-1.5">
              Desde
            </p>
            <Input
              type="date"
              className="w-36 text-xs py-2"
              value={filters.startDate}
              onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
            />
          </div>
          <span className="text-neu-muted pb-2.5 text-sm">→</span>
          <div>
            <p className="text-[10px] font-medium text-neu-muted uppercase tracking-widest mb-1.5">
              Hasta
            </p>
            <Input
              type="date"
              className="w-36 text-xs py-2"
              value={filters.endDate}
              onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>

        {/* Category */}
        <div className="min-w-[160px]">
          <p className="text-[10px] font-medium text-neu-muted uppercase tracking-widest mb-1.5">
            Categoría
          </p>
          <Select
            className="text-xs py-2"
            value={filters.categoryId}
            onChange={(e) => onChange({ ...filters, categoryId: e.target.value })}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>

        {/* Account */}
        <div className="min-w-[160px]">
          <p className="text-[10px] font-medium text-neu-muted uppercase tracking-widest mb-1.5">
            Cuenta
          </p>
          <Select
            className="text-xs py-2"
            value={filters.accountId}
            onChange={(e) => onChange({ ...filters, accountId: e.target.value })}
          >
            <option value="">Todas las cuentas</option>
            {accounts.filter((a) => a.status === 'ACTIVE').map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </Select>
        </div>

        {/* Clear */}
        {hasActive && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[0.75rem] text-xs text-neu-muted hover:text-white/60 border border-neu bg-neu-raised shadow-soft-out transition-all duration-150 self-end"
          >
            <X className="w-3 h-3" />
            Limpiar
          </button>
        )}

        {/* Loading indicator */}
        {isPending && (
          <div className="self-end pb-2.5">
            <div className="w-4 h-4 border-2 border-luka-accent/30 border-t-luka-accent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Historical badge ───────────────────────────────────────────────────────
function HistoricalBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border bg-neu-raised text-neu-muted border-neu cursor-default">
      <History className="w-2.5 h-2.5" strokeWidth={2} />
      Histórico
    </span>
  );
}

// ─── Table row ─────────────────────────────────────────────────────────────
function TransactionRow({
  tx,
  categories,
  lastAdjustmentByAccount,
}: {
  tx: TransactionWithRelations;
  categories: Category[];
  lastAdjustmentByAccount: Record<string, { date: string; id: string }>;
}) {
  const signed = Number(tx.signed_amount ?? 0);
  const isIncome = signed > 0;
  const isNeutral = tx.kind === 'TRANSFER' || tx.kind === 'ADJUSTMENT';
  const category = categories.find((c) => c.id === tx.category_id);
  const account = tx.accounts as any;

  // A row is "historical" (does not affect the current balance) when:
  //  - It is an ADJUSTMENT and it is NOT the most recent one for its account, OR
  //  - It is any other kind whose occurred_at is <= the most recent adjustment's date.
  const lastAdj = tx.account_id ? lastAdjustmentByAccount[tx.account_id] : undefined;
  const isHistorical = !!lastAdj && !!tx.occurred_at && (
    tx.kind === 'ADJUSTMENT'
      ? tx.id !== lastAdj.id
      : tx.occurred_at <= lastAdj.date
  );

  const rowContent = (
    <tr className={cn(
      'group border-b border-[#1a1a1a] last:border-0',
      'hover:bg-[#161616]/60 transition-colors duration-100',
      isHistorical && 'opacity-40 grayscale',
    )}>
      {/* Category + Description */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {category ? (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-soft-out"
              style={{ backgroundColor: `${categoryColor(category.name)}22`, color: categoryColor(category.name) }}
            >
              {category.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <KindIcon kind={tx.kind} />
          )}

          <div className="min-w-0">
            <p className={cn(
              'text-sm font-medium truncate max-w-[200px]',
              isHistorical ? 'text-white/40 line-through decoration-white/20' : 'text-white/80',
            )}>
              {tx.description || '—'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs text-neu-muted truncate">
                {category?.name ?? (KIND_LABELS[tx.kind] ?? tx.kind)}
              </p>
              {isHistorical && <HistoricalBadge />}
            </div>
          </div>
        </div>
      </td>

      {/* Account */}
      <td className="hidden md:table-cell px-5 py-4">
        <p className="text-sm text-white/50 truncate max-w-[140px]">
          {account?.name ?? '—'}
        </p>
      </td>

      {/* Date */}
      <td className="hidden sm:table-cell px-5 py-4 whitespace-nowrap">
        <p className="text-sm text-white/50 tabular-nums">
          {tx.occurred_at ? formatDate(tx.occurred_at, 'd MMM yyyy') : '—'}
        </p>
        <p className="text-xs text-neu-muted tabular-nums">
          {tx.occurred_at ? formatDate(tx.occurred_at, 'HH:mm') : ''}
        </p>
      </td>

      {/* Kind + Status */}
      <td className="hidden lg:table-cell px-5 py-4">
        <div className="flex flex-col gap-1.5">
          <StatusBadge status={tx.status} />
          <KindBadge kind={tx.kind} />
        </div>
      </td>

      {/* Amount — always visible */}
      <td className="px-5 py-4 text-right whitespace-nowrap">
        <span className={cn(
          'text-sm font-semibold tabular-nums',
          isHistorical
            ? 'text-white/30 line-through decoration-white/20'
            : isNeutral
              ? 'text-white/60'
              : isIncome
                ? 'text-luka-income'
                : 'text-luka-expense',
        )}>
          {isNeutral ? '' : isIncome ? '+' : '−'}
          {formatCurrency(Math.abs(signed), '$')}
        </span>
      </td>
    </tr>
  );

  if (!isHistorical) return rowContent;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {rowContent}
      </TooltipTrigger>
      <TooltipContent side="top">
        Este registro es histórico y no afecta el balance actual debido a un ajuste posterior.
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-neu-raised shadow-soft-out">
        <ReceiptText className="w-7 h-7 text-neu-muted" strokeWidth={1.5} />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-white/60">No se encontraron transacciones</p>
        <p className="text-sm text-neu-muted max-w-xs">
          Intenta ajustar los filtros o registra tu primera transacción.
        </p>
      </div>
      <button onClick={onAdd} className="neu-btn neu-btn-primary text-sm mt-2">
        <Plus className="w-4 h-4" />
        Nueva Transacción
      </button>
    </div>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────
function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  isPending,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  isPending: boolean;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-2 pt-4 border-t border-[#1a1a1a]">
      <p className="text-xs text-neu-muted">
        {from}–{to} de {total} transacciones
      </p>
      <div className="flex items-center gap-2">
        <button
          disabled={page <= 1 || isPending}
          onClick={() => onPageChange(page - 1)}
          className="neu-btn neu-btn-icon p-2 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-white/50 tabular-nums min-w-[60px] text-center">
          {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages || isPending}
          onClick={() => onPageChange(page + 1)}
          className="neu-btn neu-btn-icon p-2 disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

function defaultFilters(): Filters {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return {
    startDate: `${y}-${m}-01`,
    endDate: format(new Date(y, now.getMonth() + 1, 0), 'yyyy-MM-dd'),
    categoryId: '',
    accountId: '',
  };
}

interface TransactionsViewProps {
  initialTransactions: TransactionWithRelations[];
  initialTotal: number;
  initialTotalPages: number;
  accounts: AccountWithDetails[];
  categories: Category[];
  initialLastAdjustmentByAccount: Record<string, { date: string; id: string }>;
}

export function TransactionsView({
  initialTransactions,
  initialTotal,
  initialTotalPages,
  accounts,
  categories,
  initialLastAdjustmentByAccount,
}: TransactionsViewProps) {
  const [isPending, startTransition] = useTransition();

  const [transactions, setTransactions] = useState(initialTransactions);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lastAdjustmentByAccount, setLastAdjustmentByAccount] = useState<
    Record<string, { date: string; id: string }>
  >(initialLastAdjustmentByAccount);

  const fetchPage = useCallback(
    (newFilters: Filters, newPage: number) => {
      startTransition(async () => {
        const result = await getTransactions({
          startDate: newFilters.startDate || undefined,
          endDate: newFilters.endDate || undefined,
          categoryId: newFilters.categoryId || undefined,
          accountId: newFilters.accountId || undefined,
          page: newPage,
          limit: PAGE_SIZE,
        });

        if (result.success) {
          setTransactions(result.data.data);
          setTotal(result.data.count);
          setTotalPages(result.data.totalPages);
          setPage(newPage);
        }
      });
    },
    [],
  );

  const refreshAdjustmentDates = useCallback(() => {
    const accountIds = accounts.map((a) => a.id);
    getLastAdjustmentDates(accountIds).then((res) => {
      if (res.success) setLastAdjustmentByAccount(res.data);
    });
  }, [accounts]);

  function handleFilterChange(f: Filters) {
    setFilters(f);
    fetchPage(f, 1);
  }

  function handleClearFilters() {
    const fresh = defaultFilters();
    setFilters(fresh);
    fetchPage(fresh, 1);
  }

  function handlePageChange(p: number) {
    fetchPage(filters, p);
  }

  function handleSuccess() {
    setDialogOpen(false);
    refreshAdjustmentDates();
    fetchPage(filters, page);
  }

  return (
    <>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-neu-muted uppercase tracking-widest">Finanzas</p>
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">Transacciones</h1>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="neu-btn neu-btn-primary text-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Transacción
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="mb-5">
        <FilterBar
          filters={filters}
          accounts={accounts}
          categories={categories}
          isPending={isPending}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
      </div>

      {/* ── Table card ── */}
      <div className={cn('neu-card overflow-hidden transition-opacity duration-200', isPending && 'opacity-60')}>
        {transactions.length === 0 ? (
          <EmptyState onAdd={() => setDialogOpen(true)} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Head */}
                <thead>
                  <tr className="border-b border-[#1e1e1e]">
                    {[
                      { label: 'Descripción',  className: 'px-5 py-3 text-left w-full' },
                      { label: 'Cuenta',       className: 'hidden md:table-cell px-5 py-3 text-left' },
                      { label: 'Fecha',        className: 'hidden sm:table-cell px-5 py-3 text-left' },
                      { label: 'Estado',       className: 'hidden lg:table-cell px-5 py-3 text-left' },
                      { label: 'Monto',        className: 'px-5 py-3 text-right' },
                    ].map((h) => (
                      <th
                        key={h.label}
                        className={cn(
                          'text-[10px] font-semibold text-neu-muted uppercase tracking-widest',
                          h.className,
                        )}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body */}
                <TooltipProvider delayDuration={300}>
                  <tbody>
                    {transactions.map((tx) => (
                      <TransactionRow
                        key={tx.id}
                        tx={tx}
                        categories={categories}
                        lastAdjustmentByAccount={lastAdjustmentByAccount}
                      />
                    ))}
                  </tbody>
                </TooltipProvider>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={PAGE_SIZE}
                isPending={isPending}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Dialog ── */}
      <CreateTransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
        accounts={accounts}
        categories={categories}
      />
    </>
  );
}

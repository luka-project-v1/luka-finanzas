'use client';

import { useState, useTransition, useCallback, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  SlidersHorizontal,
  CheckCircle,
  MoreVertical,
  Pencil,
  Trash2,
  CreditCard,
  X,
  History,
  AlertCircle,
} from 'lucide-react';
import { getLastAdjustmentDates, updateTransaction, deleteTransaction } from '@/lib/actions/transactions';
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
import { TransactionDetailSheet } from './transaction-detail-sheet';
import { Dialog } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { TransactionWithRelations } from '@/lib/repositories/transaction-repository';
import type { AccountWithDetails } from '@/lib/repositories/account-repository';
import type { TransferInfo } from '@/lib/actions/transactions';
import type { Database } from '@/lib/types/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

// ─── Helpers ───────────────────────────────────────────────────────────────
const CATEGORY_COLORS = [
  '#D97757', '#4ade80', '#60a5fa', '#f87171', '#fbbf24',
  '#a78bfa', '#34d399', '#fb923c', '#e879f9', '#22d3ee',
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
    NORMAL: { Icon: ArrowUpRight, color: 'text-white/40', bg: 'bg-neu-raised' },
    INCOME: { Icon: ArrowUpRight, color: 'text-luka-income', bg: 'bg-luka-income/10' },
    EXPENSE: { Icon: ArrowDownRight, color: 'text-luka-expense', bg: 'bg-luka-expense/10' },
    TRANSFER: { Icon: ArrowLeftRight, color: 'text-luka-info', bg: 'bg-luka-info/10' },
    ADJUSTMENT: { Icon: SlidersHorizontal, color: 'text-luka-warning', bg: 'bg-luka-warning/10' },
    FEE: { Icon: ArrowDownRight, color: 'text-luka-expense', bg: 'bg-luka-expense/10' },
    INTEREST: { Icon: ArrowUpRight, color: 'text-luka-warning', bg: 'bg-luka-warning/10' },
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
  POSTED: 'Registrada',
  PENDING: 'Pendiente',
  VOID: 'Anulada',
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    POSTED: 'bg-luka-income/10 text-luka-income border-luka-income/20',
    PENDING: 'bg-[#D97757]/10 text-[#D97757] border-[#D97757]/20',
    VOID: 'bg-neu-raised text-neu-muted border-neu',
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
  NORMAL: 'Normal',
  INCOME: 'Ingreso',
  EXPENSE: 'Gasto',
  TRANSFER: 'Transferencia',
  ADJUSTMENT: 'Ajuste',
  FEE: 'Comisión',
  INTEREST: 'Interés',
};

function KindBadge({ kind }: { kind: string }) {
  if (kind === 'NORMAL') return null;
  const colors: Record<string, string> = {
    TRANSFER: 'bg-luka-info/10 text-luka-info border-luka-info/20',
    ADJUSTMENT: 'bg-luka-warning/10 text-luka-warning border-luka-warning/20',
    FEE: 'bg-luka-expense/10 text-luka-expense border-luka-expense/20',
    INTEREST: 'bg-luka-warning/10 text-luka-warning border-luka-warning/20',
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
              className="w-full md:w-36 text-xs py-2"
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
              className="w-full md:w-36 text-xs py-2"
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

// ─── Transaction row actions (Mark as Paid + Edit/Delete menu) ──────────────
function TransactionRowActions({
  tx,
  isPending,
  isMarkingAsPaid,
  isDeletingId,
  onMarkAsPaid,
  onEdit,
  onDelete,
}: {
  tx: TransactionWithRelations;
  isPending: boolean;
  isMarkingAsPaid: boolean;
  isDeletingId: string | null;
  onMarkAsPaid: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isDeleting = isDeletingId === tx.id;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <div className="flex items-center justify-end gap-1" ref={ref}>
      {isPending && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onMarkAsPaid}
              disabled={isMarkingAsPaid}
              className="flex items-center justify-center w-8 h-8 rounded-full text-[#D97757] hover:bg-[#D97757]/15 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Marcar como pagado"
            >
              {isMarkingAsPaid ? (
                <div className="w-4 h-4 border-2 border-[#D97757]/30 border-t-[#D97757] rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" strokeWidth={2} />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Marcar como pagado</TooltipContent>
        </Tooltip>
      )}
      <div className="relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              disabled={isDeleting}
              className="flex items-center justify-center w-8 h-8 rounded-full text-white/40 hover:text-white/70 hover:bg-neu-raised transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Más opciones"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/50 rounded-full animate-spin" />
              ) : (
                <MoreVertical className="w-4 h-4" strokeWidth={2} />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Más opciones</TooltipContent>
        </Tooltip>
        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-1 z-50 min-w-[140px] py-1 rounded-[0.75rem] bg-[#161616] border border-[#1e1e1e] shadow-soft-out-md"
            role="menu"
          >
            <button
              type="button"
              onClick={() => {
                onEdit();
                setMenuOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-[#1a1a1a] hover:text-white transition-colors"
              role="menuitem"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
              Editar
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete();
                setMenuOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-luka-expense/80 hover:bg-luka-expense/10 hover:text-luka-expense transition-colors"
              role="menuitem"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
              Eliminar
            </button>
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

// ─── Transfer grouping helper ──────────────────────────────────────────────
/** When account filter is empty: group transfers into single rows. When account filter is active: no grouping. */
function getDisplayRows(
  transactions: TransactionWithRelations[],
  transferInfo: Record<string, TransferInfo>,
  accountFilterId: string
): TransactionWithRelations[] {
  if (accountFilterId) {
    // Filtered by account: show each leg as-is (backend already returns only matching legs)
    return transactions;
  }
  // No account filter: group transfers, show one row per transfer (use debit leg as representative)
  const seen = new Set<string>();
  const result: TransactionWithRelations[] = [];
  for (const tx of transactions) {
    if (tx.transfer_id && tx.kind === 'TRANSFER') {
      if (seen.has(tx.transfer_id)) continue;
      seen.add(tx.transfer_id);
      // Use debit leg (negative amount) as representative for actions
      const legs = transactions.filter((t) => t.transfer_id === tx.transfer_id);
      const debitLeg = legs.find((t) => Number(t.signed_amount ?? 0) < 0) ?? legs[0];
      result.push(debitLeg);
    } else {
      result.push(tx);
    }
  }
  return result;
}

// ─── Transaction card (mobile) ──────────────────────────────────────────────
function TransactionCard({
  tx,
  categories,
  lastAdjustmentByAccount,
  transferInfo,
  markingAsPaidId,
  deletingId,
  accountFilterId,
  onMarkAsPaid,
  onEdit,
  onDelete,
  onRowClick,
}: {
  tx: TransactionWithRelations;
  categories: Category[];
  lastAdjustmentByAccount: Record<string, { date: string; id: string }>;
  transferInfo: Record<string, TransferInfo>;
  markingAsPaidId: string | null;
  deletingId: string | null;
  accountFilterId: string;
  onMarkAsPaid: (tx: TransactionWithRelations) => void;
  onEdit: (tx: TransactionWithRelations) => void;
  onDelete: (tx: TransactionWithRelations) => void;
  onRowClick?: (tx: TransactionWithRelations) => void;
}) {
  const signed = Number(tx.signed_amount ?? 0);
  const isIncome = signed > 0;
  const isNeutral = tx.kind === 'TRANSFER' || tx.kind === 'ADJUSTMENT';
  const category = categories.find((c) => c.id === tx.category_id);
  const isPaymentCategory = category?.name === 'Pagos Tarjeta';

  const info = tx.transfer_id ? transferInfo[tx.transfer_id] : null;
  const isGroupedTransfer = !accountFilterId && tx.transfer_id && tx.kind === 'TRANSFER';

  let transferLabel: string | null = null;
  if (info && tx.kind === 'TRANSFER') {
    if (isGroupedTransfer) {
      transferLabel = `${info.fromAccount.name} → ${info.toAccount.name}`;
    } else if (signed < 0) {
      transferLabel = `Hacia: ${info.toAccount.name}`;
    } else {
      transferLabel = `Desde: ${info.fromAccount.name}`;
    }
  }

  const lastAdj = tx.account_id ? lastAdjustmentByAccount[tx.account_id] : undefined;
  let isHistorical = false;
  if (lastAdj && tx.occurred_at) {
    isHistorical = tx.kind === 'ADJUSTMENT'
      ? tx.id !== lastAdj.id
      : tx.occurred_at <= lastAdj.date;
  }
  const isPending = tx.status === 'PENDING';

  let amountColor = 'text-luka-expense';
  if (isHistorical) amountColor = 'text-white/30 line-through decoration-white/20';
  else if (isGroupedTransfer) amountColor = 'text-luka-info';
  else if (isPaymentCategory) amountColor = 'text-[#D97757]';
  else if (isNeutral) amountColor = 'text-white/60';
  else if (isIncome) amountColor = 'text-luka-income';

  let signPrefix = '';
  if (!isGroupedTransfer && !isNeutral && !isPaymentCategory) {
    signPrefix = isIncome ? '+' : '−';
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onRowClick?.(tx)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onRowClick?.(tx);
        }
      }}
      className={cn(
        'flex items-center justify-between gap-3 p-4 rounded-xl',
        'bg-neu-raised border border-neu',
        'hover:bg-[#161616]/80 transition-colors duration-100 cursor-pointer',
        isHistorical && 'opacity-40 grayscale',
        isPending && 'border-dashed border-[#D97757]/50 bg-[#D97757]/[0.03]',
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {category?.name === 'Pagos Tarjeta' ? (
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full shrink-0 shadow-soft-out',
            'bg-[#D97757]/15'
          )}>
            <CreditCard className="w-4 h-4 text-[#D97757]" strokeWidth={2} />
          </div>
        ) : isGroupedTransfer ? (
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full shrink-0 shadow-soft-out',
            'bg-luka-info/10',
          )}>
            <ArrowLeftRight className="w-4 h-4 text-luka-info" strokeWidth={2} />
          </div>
        ) : category ? (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-soft-out"
            style={{ backgroundColor: `${categoryColor(category.name)}22`, color: categoryColor(category.name) }}
          >
            {category.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="shrink-0">
            <KindIcon kind={tx.kind} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className={cn(
            'text-sm font-medium truncate',
            isHistorical ? 'text-white/40 line-through decoration-white/20' : 'text-white/80',
            isPending && !isHistorical && 'text-[#D97757]/90',
          )}>
            {transferLabel ?? tx.description ?? '—'}
          </p>
          <p className={cn(
            'text-xs truncate mt-0.5',
            isPending && !isHistorical ? 'text-[#D97757]/70' : 'text-neu-muted',
          )}>
            {category?.name ?? (KIND_LABELS[tx.kind] ?? tx.kind)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
        <span className={cn('text-base font-semibold tabular-nums', amountColor)}>
          {signPrefix}
          {formatCurrency(Math.abs(signed), '$')}
        </span>
        <TransactionRowActions
          tx={tx}
          isPending={isPending}
          isMarkingAsPaid={markingAsPaidId === tx.id}
          isDeletingId={deletingId}
          onMarkAsPaid={() => onMarkAsPaid(tx)}
          onEdit={() => onEdit(tx)}
          onDelete={() => onDelete(tx)}
        />
      </div>
    </div>
  );
}

// ─── Table row ─────────────────────────────────────────────────────────────
function TransactionRow({
  tx,
  categories,
  lastAdjustmentByAccount,
  transferInfo,
  markingAsPaidId,
  deletingId,
  accountFilterId,
  onMarkAsPaid,
  onEdit,
  onDelete,
  onRowClick,
}: {
  tx: TransactionWithRelations;
  categories: Category[];
  lastAdjustmentByAccount: Record<string, { date: string; id: string }>;
  transferInfo: Record<string, TransferInfo>;
  markingAsPaidId: string | null;
  deletingId: string | null;
  accountFilterId: string;
  onMarkAsPaid: (tx: TransactionWithRelations) => void;
  onEdit: (tx: TransactionWithRelations) => void;
  onDelete: (tx: TransactionWithRelations) => void;
  onRowClick?: (tx: TransactionWithRelations) => void;
}) {
  const signed = Number(tx.signed_amount ?? 0);
  const isIncome = signed > 0;
  const isNeutral = tx.kind === 'TRANSFER' || tx.kind === 'ADJUSTMENT';
  const category = categories.find((c) => c.id === tx.category_id);
  const account = tx.accounts as any;
  const isPaymentCategory = category?.name === 'Pagos Tarjeta';

  const info = tx.transfer_id ? transferInfo[tx.transfer_id] : null;
  const isGroupedTransfer = !accountFilterId && tx.transfer_id && tx.kind === 'TRANSFER';

  // Transfer label — resolved without nested ternaries
  let transferLabel: string | null = null;
  if (info && tx.kind === 'TRANSFER') {
    if (isGroupedTransfer) {
      transferLabel = `${info.fromAccount.name} → ${info.toAccount.name}`;
    } else if (signed < 0) {
      transferLabel = `Hacia: ${info.toAccount.name}`;
    } else {
      transferLabel = `Desde: ${info.fromAccount.name}`;
    }
  }

  // A row is "historical" (does not affect the current balance) when:
  //  - It is an ADJUSTMENT and it is NOT the most recent one for its account, OR
  //  - It is any other kind whose occurred_at is <= the most recent adjustment's date.
  const lastAdj = tx.account_id ? lastAdjustmentByAccount[tx.account_id] : undefined;
  let isHistorical = false;
  if (lastAdj && tx.occurred_at) {
    isHistorical = tx.kind === 'ADJUSTMENT'
      ? tx.id !== lastAdj.id
      : tx.occurred_at <= lastAdj.date;
  }
  const isPending = tx.status === 'PENDING';

  // Amount color — resolved without nested ternaries
  let amountColor = 'text-luka-expense';
  if (isHistorical) amountColor = 'text-white/30 line-through decoration-white/20';
  else if (isGroupedTransfer) amountColor = 'text-luka-info';
  else if (isPaymentCategory) amountColor = 'text-[#D97757]';
  else if (isNeutral) amountColor = 'text-white/60';
  else if (isIncome) amountColor = 'text-luka-income';

  // Sign prefix — resolved without nested ternaries
  let signPrefix = '';
  if (!isGroupedTransfer && !isNeutral && !isPaymentCategory) {
    signPrefix = isIncome ? '+' : '−';
  }

  const rowContent = (
    <tr
      role="button"
      tabIndex={0}
      onClick={() => onRowClick?.(tx)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onRowClick?.(tx);
        }
      }}
      className={cn(
        'group border-b last:border-0 cursor-pointer',
        'hover:bg-[#161616]/60 transition-colors duration-100',
        isHistorical && 'opacity-40 grayscale',
        isPending
          ? 'border-dashed border-[#D97757]/50 bg-[#D97757]/[0.03]'
          : 'border-[#1a1a1a]',
      )}>
      {/* Category + Description */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {category?.name === 'Pagos Tarjeta' ? (
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full shrink-0 shadow-soft-out',
              'bg-[#D97757]/15'
            )}>
              <CreditCard className="w-3.5 h-3.5 text-[#D97757]" strokeWidth={2} />
            </div>
          ) : isGroupedTransfer ? (
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full shrink-0 shadow-soft-out',
              'bg-luka-info/10',
            )}>
              <ArrowLeftRight className="w-3.5 h-3.5 text-luka-info" strokeWidth={2} />
            </div>
          ) : category ? (
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
              isPending && !isHistorical && 'text-[#D97757]/90',
            )}>
              {transferLabel ?? tx.description ?? '—'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {category?.name === 'Pagos Tarjeta' && (
                 <span className="inline-flex items-center px-[6px] py-[2px] rounded-full text-[9px] font-bold uppercase tracking-widest bg-[#D97757]/20 text-[#D97757] border border-[#D97757]/30 mr-1">
                   Pago TC
                 </span>
              )}
              {tx.loan_type && tx.loan_type !== 'NONE' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-0.5 px-[6px] py-[2px] rounded-full text-[9px] font-bold uppercase tracking-widest bg-luka-warning/15 text-luka-warning border border-luka-warning/25 cursor-default">
                      <AlertCircle className="w-2.5 h-2.5 shrink-0" strokeWidth={2.5} />
                      {tx.loan_type === 'SELF' ? 'Auto-préstamo' : 'Deuda'}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">
                      Pendiente por pagar a{' '}
                      <span className="font-semibold">
                        {tx.lender_name ?? (tx.loan_type === 'SELF' ? 'Meta propia' : 'Prestamista')}
                      </span>
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}

              <p className={cn(
                'text-xs truncate',
                isPending && !isHistorical ? 'text-[#D97757]/70' : 'text-neu-muted',
              )}>
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
          {isGroupedTransfer ? '—' : (account?.name ?? '—')}
        </p>
      </td>

      {/* Date */}
      <td className="hidden sm:table-cell px-5 py-4 whitespace-nowrap">
        <p className="text-sm text-white/50 tabular-nums" suppressHydrationWarning>
          {tx.occurred_at ? formatDate(tx.occurred_at, 'd MMM yyyy') : '—'}
        </p>
        <p className="text-xs text-neu-muted tabular-nums" suppressHydrationWarning>
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
        <span className={cn('text-sm font-semibold tabular-nums', amountColor)}>
          {signPrefix}
          {formatCurrency(Math.abs(signed), '$')}
        </span>
      </td>

      {/* Actions */}
      <td
        className="px-5 py-4 w-14"
        onClick={(e) => e.stopPropagation()}
      >
        <TransactionRowActions
          tx={tx}
          isPending={isPending}
          isMarkingAsPaid={markingAsPaidId === tx.id}
          isDeletingId={deletingId}
          onMarkAsPaid={() => onMarkAsPaid(tx)}
          onEdit={() => onEdit(tx)}
          onDelete={() => onDelete(tx)}
        />
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
        Este registro es histórico y no afecta el saldo actual debido a un ajuste posterior.
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
  initialTransferInfo: Record<string, TransferInfo>;
  accounts: AccountWithDetails[];
  categories: Category[];
  initialLastAdjustmentByAccount: Record<string, { date: string; id: string }>;
}

export function TransactionsView({
  initialTransactions,
  initialTotal,
  initialTotalPages,
  initialTransferInfo,
  accounts,
  categories,
  initialLastAdjustmentByAccount,
}: TransactionsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [transactions, setTransactions] = useState(initialTransactions);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [transferInfo, setTransferInfo] = useState(initialTransferInfo);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<TransactionWithRelations | null>(null);
  const [lastAdjustmentByAccount, setLastAdjustmentByAccount] = useState<
    Record<string, { date: string; id: string }>
  >(initialLastAdjustmentByAccount);
  const [markingAsPaidId, setMarkingAsPaidId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [txToDelete, setTxToDelete] = useState<TransactionWithRelations | null>(null);

  // Open create dialog when navigating with ?openCreate=1 (e.g. from MobileNav FAB)
  useEffect(() => {
    if (searchParams.get('openCreate') === '1') {
      setDialogOpen(true);
      const params = new URLSearchParams(window.location.search);
      params.delete('openCreate');
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      router.replace(newUrl);
    }
  }, [searchParams, router]);

  const fetchPage = useCallback(
    (newFilters: Filters, newPage: number) => {
      startTransition(async () => {
        let formattedStartDate: string | undefined = undefined;
        let formattedEndDate: string | undefined = undefined;

        if (newFilters.startDate) {
          formattedStartDate = new Date(newFilters.startDate + 'T00:00:00').toISOString();
        }
        if (newFilters.endDate) {
          formattedEndDate = new Date(newFilters.endDate + 'T23:59:59.999').toISOString();
        }

        const result = await getTransactions({
          startDate: formattedStartDate || undefined,
          endDate: formattedEndDate || undefined,
          categoryId: newFilters.categoryId || undefined,
          accountId: newFilters.accountId || undefined,
          page: newPage,
          limit: PAGE_SIZE,
        });

        if (result.success) {
          setTransactions(result.data.data);
          setTotal(result.data.count);
          setTotalPages(result.data.totalPages);
          setTransferInfo(result.data.transferInfo ?? {});
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
    setEditDialogOpen(false);
    setTransactionToEdit(null);
    refreshAdjustmentDates();
    fetchPage(filters, page);
  }

  async function handleMarkAsPaid(tx: TransactionWithRelations) {
    setMarkingAsPaidId(tx.id);
    // Optimistic update
    setTransactions((prev) =>
      prev.map((t) => (t.id === tx.id ? { ...t, status: 'POSTED' as const } : t))
    );
    try {
      const result = await updateTransaction(tx.id, { status: 'POSTED' });
      if (result.success) {
        toast.success('Transacción marcada como pagada');
        refreshAdjustmentDates();
        fetchPage(filters, page);
      } else {
        // Revert optimistic update
        setTransactions((prev) =>
          prev.map((t) => (t.id === tx.id ? { ...t, status: 'PENDING' as const } : t))
        );
        toast.error((result as { success: false; error: string }).error);
      }
    } catch (err) {
      // Revert optimistic update on unexpected error
      setTransactions((prev) =>
        prev.map((t) => (t.id === tx.id ? { ...t, status: 'PENDING' as const } : t))
      );
      toast.error('Error al actualizar la transacción');
    } finally {
      setMarkingAsPaidId(null);
    }
  }

  function handleEdit(tx: TransactionWithRelations) {
    setTransactionToEdit(tx);
    setEditDialogOpen(true);
  }

  function handleDeleteRequest(tx: TransactionWithRelations) {
    setTxToDelete(tx);
  }

  async function handleConfirmDelete() {
    if (!txToDelete) return;
    const id = txToDelete.id;
    setDeletingId(id);
    setTxToDelete(null);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      const result = await deleteTransaction(id);
      if (result.success) {
        toast.success('Transacción eliminada');
        refreshAdjustmentDates();
        fetchPage(filters, page);
      } else {
        toast.error((result as { success: false; error: string }).error);
        fetchPage(filters, page);
      }
    } catch {
      toast.error('Error al eliminar la transacción');
      fetchPage(filters, page);
    } finally {
      setDeletingId(null);
    }
  }

  function handleRowClick(tx: TransactionWithRelations) {
    const params = new URLSearchParams(window.location.search);
    params.set('transactionId', tx.id);
    router.replace(`/transactions?${params.toString()}`);
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

      {/* ── Table / Cards ── */}
      <div className={cn('neu-card overflow-x-hidden overflow-y-visible transition-opacity duration-200', isPending && 'opacity-60')}>
        {transactions.length === 0 ? (
          <EmptyState onAdd={() => setDialogOpen(true)} />
        ) : (
          <>
            {/* Mobile: card layout */}
            <div className="md:hidden overflow-x-hidden">
              <div className="flex flex-col gap-3 p-4">
                {getDisplayRows(transactions, transferInfo, filters.accountId).map((tx) => (
                  <TransactionCard
                    key={tx.id}
                    tx={tx}
                    categories={categories}
                    lastAdjustmentByAccount={lastAdjustmentByAccount}
                    transferInfo={transferInfo}
                    markingAsPaidId={markingAsPaidId}
                    deletingId={deletingId}
                    accountFilterId={filters.accountId}
                    onMarkAsPaid={handleMarkAsPaid}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                    onRowClick={handleRowClick}
                  />
                ))}
              </div>
            </div>

            {/* Desktop: table layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e1e1e]">
                    {[
                      { label: 'Descripción', className: 'px-5 py-3 text-left w-full' },
                      { label: 'Cuenta', className: 'px-5 py-3 text-left' },
                      { label: 'Fecha', className: 'px-5 py-3 text-left' },
                      { label: 'Estado', className: 'hidden lg:table-cell px-5 py-3 text-left' },
                      { label: 'Monto', className: 'px-5 py-3 text-right' },
                      { label: '', className: 'px-5 py-3 text-right w-14' },
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

                <TooltipProvider delayDuration={300}>
                  <tbody>
                    {getDisplayRows(transactions, transferInfo, filters.accountId).map((tx) => (
                      <TransactionRow
                        key={tx.id}
                        tx={tx}
                        categories={categories}
                        lastAdjustmentByAccount={lastAdjustmentByAccount}
                        transferInfo={transferInfo}
                        markingAsPaidId={markingAsPaidId}
                        deletingId={deletingId}
                        accountFilterId={filters.accountId}
                        onMarkAsPaid={handleMarkAsPaid}
                        onEdit={handleEdit}
                        onDelete={handleDeleteRequest}
                        onRowClick={handleRowClick}
                      />
                    ))}
                  </tbody>
                </TooltipProvider>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 md:px-5 py-4">
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

      {/* ── Create Dialog ── */}
      <CreateTransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
        accounts={accounts}
        categories={categories}
      />

      {/* ── Edit Dialog ── */}
      <CreateTransactionDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditDialogOpen(false);
            setTransactionToEdit(null);
          }
        }}
        onSuccess={handleSuccess}
        accounts={accounts}
        categories={categories}
        initialData={transactionToEdit}
        transferInfo={transferInfo}
      />

      {/* ── Transaction Detail Sheet (URL-driven) ── */}
      <Suspense fallback={null}>
        <TransactionDetailSheet
          accounts={accounts}
          categories={categories}
          onSuccess={handleSuccess}
        />
      </Suspense>

      {/* ── Confirm Delete Dialog ── */}
      <Dialog
        open={!!txToDelete}
        onOpenChange={(open) => { if (!open) setTxToDelete(null); }}
        title="Eliminar transacción"
        description="Esta acción es permanente. La transacción será eliminada y el saldo de la cuenta se actualizará automáticamente."
        size="sm"
      >
        <div className="flex flex-col gap-3 pt-2">
          {txToDelete && (
            <div className="rounded-[0.75rem] bg-neu-raised border border-neu px-4 py-3 shadow-soft-in text-sm text-white/70">
              <p className="font-medium text-white/90 truncate">
                {txToDelete.description ?? KIND_LABELS[txToDelete.kind] ?? txToDelete.kind}
              </p>
              <p className="text-xs text-neu-muted mt-0.5">
                {txToDelete.kind === 'TRANSFER' ? 'Se eliminarán ambas piernas de la transferencia.' : (txToDelete.accounts as { name?: string } | null)?.name ?? ''}
              </p>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setTxToDelete(null)}
              className="flex-1 neu-btn text-sm text-white/50 hover:text-white/80 border border-neu bg-neu-raised justify-center"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="flex-1 neu-btn justify-center text-sm bg-luka-expense/15 border border-luka-expense/30 text-luka-expense hover:bg-luka-expense/25 transition-colors"
            >
              <Trash2 className="w-4 h-4" strokeWidth={2} />
              Eliminar
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

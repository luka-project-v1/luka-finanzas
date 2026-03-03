'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Calendar,
  Tag,
  Landmark,
  ArrowRight,
  Pencil,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { getTransactionDetail, updateTransaction } from '@/lib/actions/transactions';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { convertToBase } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import type { TransactionWithRelations } from '@/lib/repositories/transaction-repository';
import type { TransferDetailInfo } from '@/lib/actions/transactions';
import type { AccountWithDetails } from '@/lib/repositories/account-repository';
import type { TransferInfo } from '@/lib/actions/transactions';
import type { Database } from '@/lib/types/database.types';
import { CreateTransactionDialog } from './create-transaction-dialog';

type Category = Database['public']['Tables']['categories']['Row'];

const STATUS_LABELS: Record<string, string> = {
  POSTED: 'Registrada',
  PENDING: 'Pendiente',
  VOID: 'Anulada',
};

const KIND_LABELS: Record<string, string> = {
  NORMAL: 'Normal',
  INCOME: 'Ingreso',
  EXPENSE: 'Gasto',
  TRANSFER: 'Transferencia',
  ADJUSTMENT: 'Ajuste',
  FEE: 'Comisión',
  INTEREST: 'Interés',
};

function currencySymbol(code: string): string {
  const map: Record<string, string> = { USD: '$', COP: 'COP$', EUR: '€' };
  return map[code] ?? code;
}

interface TransactionDetailSheetProps {
  accounts: AccountWithDetails[];
  categories: Category[];
  onSuccess?: () => void;
}

export function TransactionDetailSheet({
  accounts,
  categories,
  onSuccess,
}: TransactionDetailSheetProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const transactionId = searchParams.get('transactionId');
  const open = !!transactionId;

  const [detail, setDetail] = useState<{
    transaction: TransactionWithRelations;
    transferInfo?: TransferDetailInfo;
    rateByCode: Record<string, number>;
    preferredCode: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<TransactionWithRelations | null>(null);
  const [transferInfoForEdit, setTransferInfoForEdit] = useState<Record<string, TransferInfo>>({});

  const clearTransactionId = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('transactionId');
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newUrl);
  }, [router, searchParams]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        clearTransactionId();
      }
    },
    [clearTransactionId],
  );

  useEffect(() => {
    if (!transactionId || !open) {
      setDetail(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    getTransactionDetail(transactionId)
      .then((result) => {
        if (result.success) {
          setDetail(result.data);
          setTransferInfoForEdit(
            result.data.transferInfo
              ? {
                  [result.data.transaction.transfer_id!]: {
                    fromAccount: {
                      id: result.data.transferInfo.fromAccount.id,
                      name: result.data.transferInfo.fromAccount.name,
                    },
                    toAccount: {
                      id: result.data.transferInfo.toAccount.id,
                      name: result.data.transferInfo.toAccount.name,
                    },
                  },
                }
              : {},
          );
        } else {
          setError(result.error);
          setDetail(null);
        }
      })
      .catch(() => {
        setError('Error al cargar el detalle');
        setDetail(null);
      })
      .finally(() => setLoading(false));
  }, [transactionId, open]);

  function handleEdit() {
    if (!detail) return;
    setTransactionToEdit(detail.transaction);
    clearTransactionId();
    setEditDialogOpen(true);
  }

  async function handleConfirmPayment() {
    if (!detail || detail.transaction.status !== 'PENDING') return;
    setConfirmingPayment(true);
    try {
      const result = await updateTransaction(detail.transaction.id, { status: 'POSTED' });
      if (result.success) {
        toast.success('Pago confirmado');
        setDetail((prev) =>
          prev ? { ...prev, transaction: { ...prev.transaction, status: 'POSTED' as const } } : null,
        );
        onSuccess?.();
      } else {
        toast.error((result as { success: false; error: string }).error);
      }
    } catch {
      toast.error('Error al confirmar el pago');
    } finally {
      setConfirmingPayment(false);
    }
  }

  function handleEditSuccess() {
    setEditDialogOpen(false);
    setTransactionToEdit(null);
    onSuccess?.();
    if (transactionId && detail) {
      getTransactionDetail(transactionId).then((result) => {
        if (result.success) setDetail(result.data);
      });
    }
  }

  if (!open) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange} side="right">
        <div className="pr-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 text-luka-accent animate-spin" strokeWidth={2} />
              <p className="text-sm text-neu-muted">Cargando detalle…</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-sm text-luka-expense">{error}</p>
            </div>
          ) : detail ? (
            <TransactionDetailContent
              detail={detail}
              onEdit={handleEdit}
              onConfirmPayment={
                detail.transaction.status === 'PENDING' ? handleConfirmPayment : undefined
              }
              confirmingPayment={confirmingPayment}
            />
          ) : null}
        </div>
      </Sheet>

      <CreateTransactionDialog
        open={editDialogOpen}
        onOpenChange={(o) => {
          if (!o) {
            setEditDialogOpen(false);
            setTransactionToEdit(null);
          }
        }}
        onSuccess={handleEditSuccess}
        accounts={accounts}
        categories={categories}
        initialData={transactionToEdit}
        transferInfo={transferInfoForEdit}
      />
    </>
  );
}

// ─── Content layout ───────────────────────────────────────────────────────
interface TransactionDetailContentProps {
  detail: {
    transaction: TransactionWithRelations;
    transferInfo?: TransferDetailInfo;
    rateByCode: Record<string, number>;
    preferredCode: string;
  };
  onEdit: () => void;
  onConfirmPayment?: () => void;
  confirmingPayment: boolean;
}

function TransactionDetailContent({
  detail,
  onEdit,
  onConfirmPayment,
  confirmingPayment,
}: TransactionDetailContentProps) {
  const { transaction, transferInfo, rateByCode, preferredCode } = detail;
  const signed = Number(transaction.signed_amount ?? 0);
  const isIncome = signed > 0;
  const isNeutral = transaction.kind === 'TRANSFER' || transaction.kind === 'ADJUSTMENT';
  const isPending = transaction.status === 'PENDING';

  const account = transaction.accounts as { name?: string; currency_code?: string } | null;
  const category = transaction.categories as { name?: string } | null;
  const currencyCode = account?.currency_code ?? 'COP';
  const amountAbs = Math.abs(signed);

  const amountColor = isPending
    ? 'text-[#D97757]'
    : isNeutral
      ? 'text-white/70'
      : isIncome
        ? 'text-luka-income'
        : 'text-luka-expense';

  const amountPrefix = isNeutral ? '' : isIncome ? '+' : '−';

  const needsConversion =
    transferInfo &&
    transferInfo.fromAccount.currencyCode !== transferInfo.toAccount.currencyCode;
  const convertedAmount =
    transferInfo && needsConversion
      ? convertToBase(
          amountAbs,
          transferInfo.fromAccount.currencyCode,
          preferredCode,
          new Map(Object.entries(rateByCode)),
        )
      : null;

  return (
    <div className="space-y-6">
      {/* ── Header: Amount ── */}
      <div className="pt-2">
        <p className={cn('text-3xl font-bold tabular-nums tracking-tight', amountColor)}>
          {amountPrefix}
          {formatCurrency(amountAbs, currencySymbol(currencyCode))}
        </p>
        {convertedAmount != null && (
          <p className="mt-1 text-sm text-neu-muted">
            ≈ {formatCurrency(convertedAmount, currencySymbol(preferredCode))} (convertido)
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span
            className={cn(
              'inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border',
              isPending
                ? 'bg-[#D97757]/10 text-[#D97757] border-[#D97757]/20'
                : 'bg-neu-raised text-neu-muted border-neu',
            )}
          >
            {STATUS_LABELS[transaction.status] ?? transaction.status}
          </span>
          {transaction.kind !== 'NORMAL' && (
            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border bg-neu-raised text-neu-muted border-neu">
              {KIND_LABELS[transaction.kind] ?? transaction.kind}
            </span>
          )}
        </div>
      </div>

      {/* ── Flow: Transfer visual ── */}
      {transferInfo && (
        <div className="rounded-[1rem] bg-neu-raised border border-neu p-4 shadow-soft-out">
          <p className="text-[10px] font-medium text-neu-muted uppercase tracking-widest mb-3">
            Flujo del traspaso
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0 rounded-lg bg-neu-surface px-3 py-2.5 shadow-soft-in">
              <p className="text-xs text-neu-muted">Cuenta origen</p>
              <p className="text-sm font-medium text-white/90 truncate">
                {transferInfo.fromAccount.name}
              </p>
              <p className="text-[10px] text-neu-muted">{transferInfo.fromAccount.currencyCode}</p>
            </div>
            <div className="flex items-center justify-center shrink-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-luka-info/10 border border-luka-info/20">
                <ArrowRight className="w-5 h-5 text-luka-info" strokeWidth={2} />
              </div>
            </div>
            <div className="flex-1 min-w-0 rounded-lg bg-neu-surface px-3 py-2.5 shadow-soft-in">
              <p className="text-xs text-neu-muted">Cuenta destino</p>
              <p className="text-sm font-medium text-white/90 truncate">
                {transferInfo.toAccount.name}
              </p>
              <p className="text-[10px] text-neu-muted">{transferInfo.toAccount.currencyCode}</p>
            </div>
          </div>
          {needsConversion && (
            <div className="mt-3 pt-3 border-t border-neu">
              <p className="text-xs text-neu-muted">
                Monto original: {formatCurrency(amountAbs, currencySymbol(transferInfo.fromAccount.currencyCode))} →{' '}
                {formatCurrency(
                  convertToBase(
                    amountAbs,
                    transferInfo.fromAccount.currencyCode,
                    transferInfo.toAccount.currencyCode,
                    new Map(Object.entries(rateByCode)),
                  ),
                  currencySymbol(transferInfo.toAccount.currencyCode),
                )}{' '}
                en destino
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Body: Details list ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neu-raised shadow-soft-out shrink-0">
            <Calendar className="w-3.5 h-3.5 text-neu-muted" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[10px] text-neu-muted uppercase tracking-widest">Fecha</p>
            <p className="text-white/90">
              {transaction.occurred_at
                ? formatDate(transaction.occurred_at, "d 'de' MMMM yyyy, HH:mm")
                : '—'}
            </p>
          </div>
        </div>

        {!transferInfo && account && (
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neu-raised shadow-soft-out shrink-0">
              <Landmark className="w-3.5 h-3.5 text-neu-muted" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[10px] text-neu-muted uppercase tracking-widest">Cuenta</p>
              <p className="text-white/90">{account.name ?? '—'}</p>
            </div>
          </div>
        )}

        {category && (
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neu-raised shadow-soft-out shrink-0">
              <Tag className="w-3.5 h-3.5 text-neu-muted" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[10px] text-neu-muted uppercase tracking-widest">Categoría</p>
              <p className="text-white/90">{category.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Notes: Description ── */}
      {transaction.description && (
        <div className="rounded-[1rem] bg-neu-surface px-4 py-3 shadow-soft-in border border-neu">
          <p className="text-[10px] font-medium text-neu-muted uppercase tracking-widest mb-1.5">
            Notas
          </p>
          <p className="text-sm text-white/80 whitespace-pre-wrap break-words">
            {transaction.description}
          </p>
        </div>
      )}

      {/* ── Quick actions ── */}
      <div className="flex flex-col gap-2 pt-2">
        {onConfirmPayment && (
          <button
            type="button"
            onClick={onConfirmPayment}
            disabled={confirmingPayment}
            className="neu-btn neu-btn-primary w-full justify-center text-sm"
          >
            {confirmingPayment ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Confirmar Pago
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="neu-btn w-full justify-center text-sm text-white/50 hover:text-white/80 border border-neu bg-neu-raised"
        >
          <Pencil className="w-4 h-4" />
          Editar
        </button>
      </div>
    </div>
  );
}

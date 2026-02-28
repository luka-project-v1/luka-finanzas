'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Landmark,
  PiggyBank,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Pencil,
} from 'lucide-react';
import { CreateAccountDialog } from './create-account-dialog';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils/cn';
import type { AccountWithDetails } from '@/lib/repositories/account-repository';

// ─── Helpers ───────────────────────────────────────────────────────────────
function currencySymbol(code: string | null): string {
  const map: Record<string, string> = { USD: '$', COP: 'COP$', EUR: '€', GBP: '£' };
  return code ? (map[code] ?? code) : '$';
}

function kindIcon(kind?: string | null) {
  if (kind === 'CHECKING') return CreditCard;
  return PiggyBank;
}

// ─── Account card ──────────────────────────────────────────────────────────
function AccountCard({
  account,
  onEdit,
}: {
  account: AccountWithDetails;
  onEdit: (account: AccountWithDetails) => void;
}) {
  const details = account.bank_account_details;
  const balance = account.balance ?? 0;
  const isPositive = balance >= 0;
  const KindIcon = kindIcon(details?.kind);
  const isClosed = account.status === 'CLOSED';

  const kindLabel: Record<string, string> = {
    SAVINGS: 'Ahorro',
    CHECKING: 'Corriente',
  };

  const statusLabel: Record<string, string> = {
    ACTIVE: 'Activo',
    CLOSED: 'Cerrado',
  };

  return (
    <div
      className={cn(
        'neu-card p-6 flex flex-col gap-5',
        'transition-shadow duration-200 hover:shadow-soft-hover',
        isClosed && 'opacity-60',
      )}
    >
      {/* Fila superior */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="
            flex items-center justify-center w-10 h-10 rounded-full
            bg-luka-accent/10 shadow-soft-out shrink-0
          ">
            <KindIcon className="w-4.5 h-4.5 text-luka-accent" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white/85 truncate">{account.name}</p>
            {details?.bank_name && (
              <p className="text-xs text-neu-muted truncate">{details.bank_name}</p>
            )}
          </div>
        </div>

        {/* Estado + Editar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(account)}
            className="
              flex items-center justify-center w-8 h-8 rounded-full
              bg-neu-raised border border-neu
              text-white/50 hover:text-luka-accent hover:border-luka-accent/30
              shadow-soft-out hover:shadow-soft-hover
              transition-all duration-150
            "
            aria-label="Editar cuenta"
          >
            <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
          <span className={cn(
            'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border',
            isClosed
              ? 'bg-neu-raised border-neu text-neu-muted'
              : 'bg-luka-income/10 border-luka-income/20 text-luka-income',
          )}>
            {statusLabel[account.status] ?? account.status}
          </span>
        </div>
      </div>

      {/* Saldo */}
      <div>
        <p className="text-[10px] font-medium text-neu-muted uppercase tracking-widest mb-1">
          Saldo
        </p>
        <p className={cn(
          'text-2xl font-bold tabular-nums tracking-tight',
          isPositive ? 'text-white/90' : 'text-luka-expense',
        )}>
          {isPositive ? '' : '−'}
          {formatCurrency(Math.abs(balance), currencySymbol(account.currency_code))}
        </p>
        <p className="text-xs text-neu-muted mt-0.5">{account.currency_code}</p>
      </div>

      {/* Fila de detalles */}
      <div className="flex items-center justify-between pt-4 border-t border-[#1e1e1e]">
        <div className="flex flex-col gap-0.5">
          <span className="
            text-[10px] font-semibold uppercase tracking-wider
            px-2 py-0.5 rounded-full
            bg-neu-raised border border-neu text-neu-muted
            w-fit
          ">
            {kindLabel[details?.kind ?? ''] ?? (details?.kind ?? 'Ahorro')}
          </span>
          {details?.masked_number && (
            <p className="text-xs font-mono text-neu-subtle mt-1">
              •••• {details.masked_number.slice(-4)}
            </p>
          )}
        </div>

        {account.opened_at && (
          <p className="text-xs text-neu-muted text-right">
            Apertura<br />
            <span className="text-white/40">{formatDate(account.opened_at, 'MMM yyyy')}</span>
          </p>
        )}
      </div>

      {/* Tasas — solo si están presentes */}
      {(details?.interest_rate_annual || details?.monthly_fee) && (
        <div className="flex items-center gap-4 text-xs text-neu-muted -mt-2">
          {details.interest_rate_annual && (
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {Number(details.interest_rate_annual).toFixed(2)}% anual
            </span>
          )}
          {details.monthly_fee && (
            <span className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              {formatCurrency(Number(details.monthly_fee), currencySymbol(account.currency_code))}/mes
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Estado vacío ──────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="
      flex flex-col items-center gap-5 py-20 text-center
      neu-card
    ">
      <div className="
        flex items-center justify-center w-16 h-16 rounded-full
        bg-luka-accent/10 shadow-soft-out
      ">
        <Landmark className="w-7 h-7 text-luka-accent" strokeWidth={1.5} />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-white/70">Aún no tienes cuentas bancarias</p>
        <p className="text-sm text-neu-muted max-w-xs">
          Agrega tu primera cuenta bancaria para comenzar a registrar saldos y transacciones.
        </p>
      </div>
      <button
        onClick={onAdd}
        className="neu-btn neu-btn-primary text-sm mt-2"
      >
        <Plus className="w-4 h-4" />
        Agregar Cuenta Bancaria
      </button>
    </div>
  );
}

// ─── Barra de estadísticas ─────────────────────────────────────────────────
function StatsBar({ accounts }: { accounts: AccountWithDetails[] }) {
  const active = accounts.filter((a) => a.status === 'ACTIVE');
  const totalUSD = active
    .filter((a) => a.currency_code === 'USD')
    .reduce((sum, a) => sum + (a.balance ?? 0), 0);
  const totalCOP = active
    .filter((a) => a.currency_code === 'COP')
    .reduce((sum, a) => sum + (a.balance ?? 0), 0);

  return (
    <div className="flex flex-wrap gap-4">
      <div className="neu-card px-5 py-4 flex items-center gap-3">
        <p className="text-xs text-neu-muted uppercase tracking-widest">Cuentas activas</p>
        <p className="text-lg font-bold text-white/80 tabular-nums">{active.length}</p>
      </div>
      {totalUSD !== 0 && (
        <div className="neu-card px-5 py-4 flex items-center gap-3">
          <p className="text-xs text-neu-muted uppercase tracking-widest">Saldo USD</p>
          <p className={cn(
            'text-lg font-bold tabular-nums',
            totalUSD >= 0 ? 'text-luka-income' : 'text-luka-expense',
          )}>
            {formatCurrency(totalUSD, '$')}
          </p>
        </div>
      )}
      {totalCOP !== 0 && (
        <div className="neu-card px-5 py-4 flex items-center gap-3">
          <p className="text-xs text-neu-muted uppercase tracking-widest">Saldo COP</p>
          <p className={cn(
            'text-lg font-bold tabular-nums',
            totalCOP >= 0 ? 'text-luka-income' : 'text-luka-expense',
          )}>
            {formatCurrency(totalCOP, 'COP$')}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
interface AccountsViewProps {
  accounts: AccountWithDetails[];
}

export function AccountsView({ accounts }: AccountsViewProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountWithDetails | null>(null);

  function handleSuccess() {
    setDialogOpen(false);
    setEditingAccount(null);
    router.refresh();
  }

  function handleEdit(account: AccountWithDetails) {
    setEditingAccount(account);
    setDialogOpen(true);
  }

  function handleOpenChange(open: boolean) {
    if (!open) setEditingAccount(null);
    setDialogOpen(open);
  }

  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE');
  const closedAccounts = accounts.filter((a) => a.status === 'CLOSED');

  return (
    <>
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <p className="text-xs font-medium text-neu-muted uppercase tracking-widest">
            Finanzas
          </p>
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">
            Cuentas Bancarias
          </h1>
        </div>

        <button
          onClick={() => {
            setEditingAccount(null);
            setDialogOpen(true);
          }}
          className="neu-btn neu-btn-primary text-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Cuenta
        </button>
      </div>

      {/* ── Estadísticas ── */}
      {accounts.length > 0 && (
        <div className="mb-8">
          <StatsBar accounts={accounts} />
        </div>
      )}

      {/* ── Lista de cuentas ── */}
      {accounts.length === 0 ? (
        <EmptyState onAdd={() => { setEditingAccount(null); setDialogOpen(true); }} />
      ) : (
        <div className="space-y-8">
          {/* Activas */}
          {activeAccounts.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                Activas · {activeAccounts.length}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} onEdit={handleEdit} />
                ))}
              </div>
            </section>
          )}

          {/* Cerradas */}
          {closedAccounts.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest">
                Cerradas · {closedAccounts.length}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {closedAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} onEdit={handleEdit} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Diálogo ── */}
      <CreateAccountDialog
        open={dialogOpen}
        onOpenChange={handleOpenChange}
        onSuccess={handleSuccess}
        account={editingAccount}
      />
    </>
  );
}

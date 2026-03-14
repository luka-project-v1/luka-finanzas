'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ChevronDown, ChevronUp, CreditCard as CreditCardIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import { CreateCreditCardDialog } from './create-credit-card-dialog';
import { CardDetailPanel } from './card-detail-panel';
import type { CreditCard } from '@/lib/repositories/credit-card-repository';

// ─── Helpers ──────────────────────────────────────────────────────────────
function currencySymbol(code: string | null) {
  const map: Record<string, string> = { USD: '$', COP: 'COP$', EUR: '€' };
  return code ? (map[code] ?? code) : '$';
}

function issuerGradient(issuer: string | null): string {
  switch ((issuer ?? '').toUpperCase()) {
    case 'VISA':
      return 'from-[#050D1E] via-[#0A1830] to-[#0F2248]';
    case 'MASTERCARD':
      return 'from-[#1A0808] via-[#2B1010] to-[#3D1818]';
    case 'AMEX':
    case 'AMERICAN EXPRESS':
      return 'from-[#071A1A] via-[#0C2525] to-[#133333]';
    default:
      return 'from-[#0E0E0E] via-[#131313] to-[#181818]';
  }
}

function utilizationColor(pct: number): string {
  if (pct < 30) return '#4ade80';
  if (pct < 70) return '#fbbf24';
  return '#f87171';
}

function issuerAccent(issuer: string | null): string {
  switch ((issuer ?? '').toUpperCase()) {
    case 'VISA':       return 'rgba(30,80,200,0.25)';
    case 'MASTERCARD': return 'rgba(180,30,30,0.25)';
    case 'AMEX':       return 'rgba(20,140,140,0.25)';
    default:           return 'rgba(217,119,87,0.15)';
  }
}

// ─── Chip SVG ─────────────────────────────────────────────────────────────
function ChipSvg() {
  return (
    <svg width="34" height="26" viewBox="0 0 34 26" fill="none" className="opacity-70">
      <rect width="34" height="26" rx="4" fill="#C8A855" />
      {/* Horizontal lines */}
      <rect x="1" y="9"  width="32" height="1.5" fill="#9A7B30" opacity="0.6" />
      <rect x="1" y="15" width="32" height="1.5" fill="#9A7B30" opacity="0.6" />
      {/* Vertical lines */}
      <rect x="10" y="1" width="1.5" height="24" fill="#9A7B30" opacity="0.6" />
      <rect x="22" y="1" width="1.5" height="24" fill="#9A7B30" opacity="0.6" />
      {/* Center contact */}
      <rect x="10" y="9" width="14" height="8" rx="1.5" fill="#9A7B30" opacity="0.35" />
    </svg>
  );
}

// ─── Issuer wordmark ──────────────────────────────────────────────────────
function IssuerMark({ issuer }: { issuer: string | null }) {
  const name = (issuer ?? '').toUpperCase();
  if (name === 'MASTERCARD') {
    return (
      <div className="flex items-center -space-x-2">
        <div className="w-6 h-6 rounded-full bg-red-500/80" />
        <div className="w-6 h-6 rounded-full bg-orange-400/80" />
      </div>
    );
  }
  if (name === 'VISA') {
    return (
      <span className="text-sm font-black italic tracking-wider text-white/70">VISA</span>
    );
  }
  if (name === 'AMEX' || name === 'AMERICAN EXPRESS') {
    return (
      <span className="text-xs font-bold tracking-widest text-teal-300/70">AMEX</span>
    );
  }
  return (
    <span className="text-xs font-semibold text-white/40">{issuer}</span>
  );
}

// ─── Physical card ────────────────────────────────────────────────────────
interface CreditCardChipProps {
  card: CreditCard;
  isSelected: boolean;
  onClick: () => void;
}

function CreditCardChip({ card, isSelected, onClick }: CreditCardChipProps) {
  const d = card.credit_card_details;
  const sym = currencySymbol(card.currency_code);
  const limit   = Number(d.credit_limit ?? 0);
  const balance = Number(card.balance ?? 0);
  const charged  = Math.abs(Math.min(0, balance));
  const available = Math.max(0, limit + balance);
  const utilPct = limit > 0 ? (charged / limit) * 100 : 0;

  const gradientClass = issuerGradient(d.issuer);
  const accent = issuerAccent(d.issuer);
  const isClosed = card.status === 'CLOSED';

  return (
    <button
      onClick={onClick}
      disabled={isClosed}
      className={cn(
        'relative w-full overflow-hidden select-none cursor-pointer',
        'rounded-[1.25rem]',
        // Standard credit card aspect ratio (85.6×53.98mm)
        'aspect-[1.586/1]',
        // Background gradient
        'bg-gradient-to-br',
        gradientClass,
        // Elevation — selected = pressed in, deselected = raised
        isSelected
          ? 'shadow-[inset_4px_4px_10px_rgba(0,0,0,0.7),inset_-2px_-2px_6px_rgba(255,255,255,0.04)]'
          : 'shadow-[6px_6px_16px_#000000,_-4px_-4px_12px_#1a1a1a] hover:shadow-[8px_8px_20px_#000000,_-5px_-5px_14px_#1c1c1c]',
        'transition-all duration-200',
        isClosed && 'opacity-50 cursor-not-allowed grayscale',
      )}
    >
      {/* Subtle radial glow from card accent color */}
      <div
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: accent }}
      />
      {/* Top-right shine */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-black/20 pointer-events-none" />

      {/* Card content */}
      <div className="absolute inset-0 flex flex-col justify-between p-5">
        {/* ── Top row ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/35 leading-none">
              {d.bank_name ?? card.institution_name ?? 'Bank'}
            </p>
            <p className="text-sm font-semibold text-white/75 mt-1 leading-tight">
              {card.name}
            </p>
          </div>
          <IssuerMark issuer={d.issuer} />
        </div>

        {/* ── Chip + NFC ── */}
        <div className="flex items-center gap-3">
          <ChipSvg />
          {/* NFC icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-30">
            <path d="M1 6a11 11 0 010 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M5 8.5a7 7 0 010 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9 11a3 3 0 010 2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        {/* ── Card number ── */}
        <p className="font-mono text-[13px] tracking-[0.22em] text-white/60">
          •••• &nbsp;•••• &nbsp;•••• &nbsp;{d.last4 ?? '????'}
        </p>

        {/* ── Bottom row ── */}
        <div className="flex items-end justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] uppercase tracking-widest text-white/25">Disponible</p>
            <p className="text-sm sm:text-base font-bold text-white/80 tabular-nums leading-tight break-words">
              {formatCurrency(available, sym)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] uppercase tracking-widest text-white/25">Límite</p>
            <p className="text-[10px] sm:text-xs font-medium text-white/45 tabular-nums">
              {formatCurrency(limit, sym)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Selected indicator stripe ── */}
      {isSelected && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-luka-accent" />
      )}

      {/* ── Utilization stripe (top) ── */}
      {limit > 0 && (
        <div
          className="absolute top-0 left-0 h-[2px] transition-all duration-500 rounded-tl-[1.25rem]"
            style={{
            width: `${Math.min(100, utilPct)}%`,
            backgroundColor: utilizationColor(utilPct),
          }}
        />
      )}
    </button>
  );
}

// ─── Expand / collapse row ────────────────────────────────────────────────
function CardRow({
  card,
  isExpanded,
  onToggle,
}: {
  card: CreditCard;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-4">
        {/* Physical card */}
        <div className="max-w-[340px]">
          <CreditCardChip card={card} isSelected={isExpanded} onClick={onToggle} />
        </div>

        {/* Quick stats column */}
        <div className="flex sm:flex-col gap-3 sm:gap-2 sm:min-w-[180px]">
          <QuickStat
            label="Cargado"
            value={formatCurrency(
              Math.abs(Math.min(0, Number(card.balance ?? 0))),
              currencySymbol(card.currency_code),
            )}
            color="text-luka-expense"
          />
          <QuickStat
            label="Límite"
            value={formatCurrency(
              Number(card.credit_card_details.credit_limit ?? 0),
              currencySymbol(card.currency_code),
            )}
          />
          {/* Expand toggle */}
          <button
            onClick={onToggle}
            className="
              flex items-center gap-1.5 self-start
              text-xs text-neu-muted hover:text-white/60
              transition-colors duration-150
            "
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {isExpanded ? 'Contraer' : 'Detalles y transacciones'}
          </button>
        </div>
      </div>

      {/* Detail panel */}
      {isExpanded && <CardDetailPanel card={card} />}
    </div>
  );
}

function QuickStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium text-neu-muted uppercase tracking-widest">
        {label}
      </p>
      <p className={cn('text-sm font-bold tabular-nums', color ?? 'text-white/70')}>
        {value}
      </p>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-20 text-center neu-card">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-luka-accent/10 shadow-soft-out">
        <CreditCardIcon className="w-7 h-7 text-luka-accent" strokeWidth={1.5} />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-white/70">Aún no tienes tarjetas de crédito</p>
        <p className="text-sm text-neu-muted max-w-xs">
          Agrega tus tarjetas de crédito para rastrear gastos, límites y fechas de pago.
        </p>
      </div>
      <button onClick={onAdd} className="neu-btn neu-btn-primary text-sm mt-2">
        <Plus className="w-4 h-4" />
        Agregar Tarjeta de Crédito
      </button>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export function CreditsView({ cards }: { cards: CreditCard[] }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleSuccess() {
    setDialogOpen(false);
    router.refresh();
  }

  const activeCards = cards.filter((c) => c.status === 'ACTIVE');
  const closedCards = cards.filter((c) => c.status === 'CLOSED');

  return (
    <>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-neu-muted uppercase tracking-widest">Finanzas</p>
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">Tarjetas de Crédito</h1>
        </div>
        <button onClick={() => setDialogOpen(true)} className="neu-btn neu-btn-primary text-sm">
          <Plus className="w-4 h-4" />
          Agregar Tarjeta
        </button>
      </div>

      {/* ── Card list ── */}
      {cards.length === 0 ? (
        <EmptyState onAdd={() => setDialogOpen(true)} />
      ) : (
        <div className="space-y-10">
          {activeCards.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                Activas · {activeCards.length}
              </h2>
              <div className="space-y-8">
                {activeCards.map((card) => (
                  <CardRow
                    key={card.id}
                    card={card}
                    isExpanded={expandedId === card.id}
                    onToggle={() => toggle(card.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {closedCards.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest">
                Cerradas · {closedCards.length}
              </h2>
              <div className="space-y-8 opacity-60">
                {closedCards.map((card) => (
                  <CardRow
                    key={card.id}
                    card={card}
                    isExpanded={false}
                    onToggle={() => {}}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Dialog ── */}
      <CreateCreditCardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}

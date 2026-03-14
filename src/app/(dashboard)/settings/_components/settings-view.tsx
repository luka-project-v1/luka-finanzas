'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Check, CircleDollarSign } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { updateBaseCurrency } from '@/lib/actions/preferences';

type SettingsData = {
  baseCurrency: { code: string; symbol: string };
  currencies: { code: string; name: string; symbol: string }[];
};

interface SettingsViewProps {
  data: SettingsData | null;
}

export function SettingsView({ data }: SettingsViewProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const baseCurrency = data?.baseCurrency ?? { code: 'COP', symbol: '$' };
  const currencies = data?.currencies ?? [];

  const handleSelect = useCallback(
    async (code: string) => {
      if (code === baseCurrency.code) {
        setIsOpen(false);
        return;
      }
      setIsPending(true);
      try {
        const result = await updateBaseCurrency(code);
        if (result.success) {
          router.refresh();
          setIsOpen(false);
        }
      } finally {
        setIsPending(false);
      }
    },
    [baseCurrency.code, router]
  );

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleMouseDown);
    }
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  const handleItemMouseDown = useCallback(
    (e: React.MouseEvent, code: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (code === baseCurrency.code) {
        setIsOpen(false);
        return;
      }
      handleSelect(code);
    },
    [baseCurrency.code, handleSelect]
  );

  const selectedCurrency = currencies.find((c) => c.code === baseCurrency.code);

  return (
    <>
      <div className="flex flex-col gap-8 max-w-2xl">
        {/* Page header */}
        <div>
          <p className="text-xs font-medium text-neu-muted uppercase tracking-widest">
            Configuración
          </p>
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">Ajustes</h1>
        </div>

        {/* Moneda base — neumorphic selector */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="w-4 h-4 text-luka-accent" strokeWidth={1.5} />
            <h2 className="text-xs font-semibold text-white/50 uppercase tracking-widest">
              Moneda base
            </h2>
          </div>
          <p className="text-sm text-neu-muted">
            Los balances del Dashboard y los reportes se mostrarán en esta moneda.
          </p>

          <div className="relative" ref={containerRef}>
            <button
              type="button"
              onClick={() => !isPending && setIsOpen((o) => !o)}
              disabled={isPending || currencies.length === 0}
              className={cn(
                'w-full flex items-center justify-between gap-3',
                'px-5 py-4 rounded-neu',
                'bg-neu-raised border border-neu',
                'shadow-soft-out hover:shadow-soft-hover',
                'transition-all duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isOpen && 'shadow-soft-in border-luka-accent/30'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full shrink-0',
                    'bg-luka-accent/15 shadow-soft-out',
                    isOpen && 'shadow-soft-accent'
                  )}
                >
                  <span className="text-sm font-bold text-luka-accent tabular-nums">
                    {selectedCurrency?.symbol ?? baseCurrency.symbol}
                  </span>
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-semibold text-white/85 truncate">
                    {selectedCurrency?.name ?? baseCurrency.code}
                  </p>
                  <p className="text-[10px] text-neu-muted uppercase tracking-wider">
                    {baseCurrency.code}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 shrink-0 text-white/40 transition-transform duration-150',
                  isOpen && 'rotate-180 text-luka-accent'
                )}
                strokeWidth={2}
              />
            </button>

            {/* Dropdown — neumorphic raised */}
            {isOpen && (
              <div
                className={cn(
                  'absolute top-full left-0 right-0 mt-2 z-50',
                  'rounded-neu overflow-hidden',
                  'bg-neu-raised border border-neu',
                  'shadow-soft-out-lg',
                  'animate-in fade-in slide-in-from-top-2 duration-150'
                )}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {currencies.map((currency) => {
                  const isSelected = currency.code === baseCurrency.code;
                  return (
                    <button
                      key={currency.code}
                      type="button"
                      onMouseDown={(e) => handleItemMouseDown(e, currency.code)}
                      disabled={isPending}
                      className={cn(
                        'w-full flex items-center justify-between gap-3 px-5 py-4',
                        'text-left transition-colors duration-100 cursor-pointer',
                        'border-b border-[#1a1a1a] last:border-0',
                        'hover:bg-neu-highlight',
                        isSelected && 'bg-luka-accent-dim'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'flex items-center justify-center w-9 h-9 rounded-full shrink-0',
                            isSelected ? 'bg-luka-accent/20' : 'bg-neu-highlight'
                          )}
                        >
                          <span
                            className={cn(
                              'text-sm font-bold tabular-nums',
                              isSelected ? 'text-luka-accent' : 'text-white/60'
                            )}
                          >
                            {currency.symbol}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white/85">{currency.name}</p>
                          <p className="text-[10px] text-neu-muted">{currency.code}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-luka-accent shrink-0" strokeWidth={2.5} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {currencies.length === 0 && (
            <p className="text-xs text-neu-muted">
              No hay divisas configuradas. Ve a la página de Divisas para agregar USD y COP.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

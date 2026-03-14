'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { CreditCard, ChevronDown, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Database } from '@/lib/types/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

interface CategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  /** When false, hides the quick-access section and removes "Pagos Tarjeta" from the list */
  isExpense?: boolean;
  disabled?: boolean;
}

const PAGOS_TARJETA_NAME = 'Pagos Tarjeta';

export function CategorySelect({ categories, value, onChange, isExpense = true, disabled }: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // "Pagos Tarjeta" is only meaningful for expenses — exclude it from income
  const visibleCategories = isExpense
    ? categories
    : categories.filter((c) => c.name !== PAGOS_TARJETA_NAME);

  const pagosTarjetaCategory = isExpense
    ? categories.find((c) => c.name === PAGOS_TARJETA_NAME)
    : undefined;

  const selectedCategory = visibleCategories.find((c) => c.id === value);

  const filteredCategories = search.trim()
    ? visibleCategories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : visibleCategories;

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setSearch('');
  }, [disabled]);

  const handleSelect = useCallback(
    (categoryId: string) => {
      onChange(categoryId);
      setIsOpen(false);
      setSearch('');
    },
    [onChange],
  );

  const handleQuickAccess = useCallback(() => {
    if (!pagosTarjetaCategory) return;
    // Toggle off if already selected
    if (value === pagosTarjetaCategory.id) {
      onChange('');
    } else {
      onChange(pagosTarjetaCategory.id);
    }
    setIsOpen(false);
    setSearch('');
  }, [pagosTarjetaCategory, value, onChange]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleMouseDown);
    }
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const isQuickSelected = !!pagosTarjetaCategory && value === pagosTarjetaCategory.id;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between',
          'rounded-[0.75rem] px-4 py-2.5',
          'bg-[#0e0e0e] border border-[#1e1e1e]',
          'text-sm transition-all duration-150',
          'shadow-[inset_3px_3px_7px_#000,inset_-2px_-2px_5px_#1d1d1d]',
          isOpen
            ? 'border-[#D97757]/50 ring-1 ring-[#D97757]/20'
            : 'hover:border-[#2a2a2a]',
          disabled && 'opacity-40 cursor-not-allowed',
        )}
      >
        <span className={cn(selectedCategory ? 'text-white/80' : 'text-[#444444]')}>
          {selectedCategory ? selectedCategory.name : 'Sin categoría'}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-white/30 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 w-full mt-1.5',
            'bg-[#121212] border border-[#222222]',
            'rounded-[0.875rem] overflow-hidden',
            'shadow-[8px_8px_20px_#000,-4px_-4px_12px_#1d1d1d]',
          )}
        >
          {/* ── Quick access section (expense only) ── */}
          {isExpense && pagosTarjetaCategory && (
            <>
              <div className="px-3 pt-3 pb-2.5">
                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-2 px-1">
                  Accesos Rápidos
                </p>
                <button
                  type="button"
                  onClick={handleQuickAccess}
                  className={cn(
                    'w-full flex items-center gap-2.5',
                    'rounded-xl px-3.5 py-2.5',
                    'text-sm font-medium border',
                    'transition-all duration-150',
                    isQuickSelected
                      ? 'bg-luka-info/10 border-luka-info/30 text-luka-info shadow-[inset_3px_3px_8px_#000,inset_-2px_-2px_6px_#1d1d1d]'
                      : 'bg-[#161616] border-[#222222] text-white/60 shadow-[4px_4px_10px_#000,-3px_-3px_8px_#1d1d1d] hover:text-white/90 hover:border-[#2a2a2a] hover:shadow-[6px_6px_14px_#000,-4px_-4px_10px_#1d1d1d]',
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-7 h-7 rounded-lg shrink-0',
                      isQuickSelected ? 'bg-luka-info/15' : 'bg-[#1d1d1d]',
                    )}
                  >
                    <CreditCard
                      className={cn('w-3.5 h-3.5', isQuickSelected ? 'text-luka-info' : 'text-white/40')}
                      strokeWidth={2}
                    />
                  </div>
                  <span>Pago Tarjeta</span>
                  {isQuickSelected && (
                    <Check className="w-3.5 h-3.5 ml-auto text-luka-info shrink-0" strokeWidth={2.5} />
                  )}
                </button>
              </div>
              {/* Separator between quick access and list */}
              <div className="mx-3 border-t border-[#222222]/60" />
            </>
          )}

          {/* Search input */}
          <div className="px-3 py-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar categoría…"
                className={cn(
                  'w-full rounded-[0.625rem] pl-8 pr-3 py-2',
                  'bg-[#0e0e0e] border border-[#1e1e1e]',
                  'text-sm text-white/70 placeholder-[#333333]',
                  'shadow-[inset_2px_2px_5px_#000,inset_-1px_-1px_4px_#1d1d1d]',
                  'focus:outline-none focus:border-[#D97757]/30',
                  'transition-colors duration-150',
                )}
              />
            </div>
          </div>

          {/* Separator */}
          <div className="mx-3 border-t border-[#222222]/60" />

          {/* Category list */}
          <div className="py-1.5 max-h-[180px] overflow-y-auto">
            {/* "No category" option */}
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={cn(
                'w-full text-left px-4 py-2 text-sm transition-colors duration-100',
                value === ''
                  ? 'text-white/70 bg-[#1a1a1a]'
                  : 'text-white/35 hover:bg-[#181818] hover:text-white/55',
              )}
            >
              Sin categoría
            </button>

            {filteredCategories.length === 0 ? (
              <p className="px-4 py-3 text-sm text-white/25 text-center">Sin resultados</p>
            ) : (
              filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelect(cat.id)}
                  className={cn(
                    'w-full text-left flex items-center justify-between px-4 py-2 text-sm transition-colors duration-100',
                    value === cat.id
                      ? 'text-white/90 bg-[#1a1a1a]'
                      : 'text-white/60 hover:bg-[#181818] hover:text-white/80',
                  )}
                >
                  <span>{cat.name}</span>
                  {value === cat.id && (
                    <Check className="w-3.5 h-3.5 text-luka-accent shrink-0" strokeWidth={2.5} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

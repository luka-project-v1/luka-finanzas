'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Utensils,
  Car,
  Smile,
  Heart,
  BookOpen,
  Home,
  Zap,
  Shirt,
  MoreHorizontal,
  Briefcase,
  Code2,
  TrendingUp,
  PlusCircle,
  Tag,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { CreateCategoryDialog } from './create-category-dialog';

// ─── Icon registry ──────────────────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  smile: Smile,
  heart: Heart,
  book: BookOpen,
  home: Home,
  zap: Zap,
  shirt: Shirt,
  'more-horizontal': MoreHorizontal,
  briefcase: Briefcase,
  code: Code2,
  'trending-up': TrendingUp,
  'plus-circle': PlusCircle,
  tag: Tag,
};

// ─── Types ───────────────────────────────────────────────────────────────────
export type EnrichedCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
};

interface CategoriesViewProps {
  incomeCategories: EnrichedCategory[];
  expenseCategories: EnrichedCategory[];
}

// ─── Category card ───────────────────────────────────────────────────────────
function CategoryCard({ category }: { category: EnrichedCategory }) {
  const Icon = ICON_MAP[category.icon] ?? Tag;

  return (
    <div
      className={cn(
        'neu-card p-5 flex items-center gap-4',
        'transition-shadow duration-200 hover:shadow-soft-hover',
      )}
    >
      {/* Colored icon bubble */}
      <div
        className="flex items-center justify-center w-11 h-11 rounded-full shrink-0 shadow-soft-out"
        style={{
          backgroundColor: `${category.color}1a`,
          border: `1px solid ${category.color}35`,
        }}
      >
        <Icon
          className="w-5 h-5"
          style={{ color: category.color }}
          strokeWidth={1.5}
        />
      </div>

      {/* Name + color swatch */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white/85 truncate">
          {category.name}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <span className="text-[10px] font-medium text-neu-muted uppercase tracking-wider">
            {category.color}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionHeader({
  title,
  count,
  accentColor,
}: {
  title: string;
  count: number;
  accentColor: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className="w-0.5 h-5 rounded-full"
        style={{ backgroundColor: accentColor }}
      />
      <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40">
        {title}
      </h2>
      <span className="text-xs text-neu-muted">· {count}</span>
    </div>
  );
}

// ─── Stats strip ─────────────────────────────────────────────────────────────
function StatsStrip({
  incomeCount,
  expenseCount,
}: {
  incomeCount: number;
  expenseCount: number;
}) {
  return (
    <div className="flex flex-wrap gap-4 mb-8">
      <div className="neu-card px-5 py-4 flex items-center gap-3">
        <p className="text-xs text-neu-muted uppercase tracking-widest">
          Categorías de ingresos
        </p>
        <p className="text-lg font-bold text-luka-income tabular-nums">
          {incomeCount}
        </p>
      </div>
      <div className="neu-card px-5 py-4 flex items-center gap-3">
        <p className="text-xs text-neu-muted uppercase tracking-widest">
          Categorías de gastos
        </p>
        <p className="text-lg font-bold text-luka-expense tabular-nums">
          {expenseCount}
        </p>
      </div>
      <div className="neu-card px-5 py-4 flex items-center gap-3">
        <p className="text-xs text-neu-muted uppercase tracking-widest">
          Total
        </p>
        <p className="text-lg font-bold text-white/80 tabular-nums">
          {incomeCount + expenseCount}
        </p>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="neu-card flex flex-col items-center gap-5 py-20 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-luka-accent/10 shadow-soft-out">
        <Tag className="w-7 h-7 text-luka-accent" strokeWidth={1.5} />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-white/70">
          Aún no hay categorías
        </p>
        <p className="text-sm text-neu-muted max-w-xs">
          Las categorías predeterminadas se crean automáticamente cuando visitas esta página por primera vez.
        </p>
      </div>
    </div>
  );
}

// ─── Tab type ─────────────────────────────────────────────────────────────────
type TabType = 'income' | 'expense';

// ─── Main component ───────────────────────────────────────────────────────────
export function CategoriesView({
  incomeCategories,
  expenseCategories,
}: CategoriesViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('expense');
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();

  const total = incomeCategories.length + expenseCategories.length;
  const currentCategories = activeTab === 'income' ? incomeCategories : expenseCategories;

  function handleCreateSuccess() {
    router.refresh();
  }

  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <p className="text-xs font-medium text-neu-muted uppercase tracking-widest">
            Finanzas
          </p>
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">
            Categorías
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="neu-btn neu-btn-primary text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </button>
      </div>

      <CreateCategoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
      />

      {total === 0 ? (
        <EmptyState />
      ) : (
        <>
          <StatsStrip
            incomeCount={incomeCategories.length}
            expenseCount={expenseCategories.length}
          />

          {/* Tabs — Ingresos / Gastos */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('income')}
              className={cn(
                'neu-btn text-sm px-5 py-2.5 transition-all duration-150',
                activeTab === 'income'
                  ? 'neu-btn-primary shadow-soft-accent'
                  : 'text-white/60 hover:text-white/80'
              )}
            >
              Ingresos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expense')}
              className={cn(
                'neu-btn text-sm px-5 py-2.5 transition-all duration-150',
                activeTab === 'expense'
                  ? 'neu-btn-primary shadow-soft-accent'
                  : 'text-white/60 hover:text-white/80'
              )}
            >
              Gastos
            </button>
          </div>

          {/* Category grid — Soft UI cards */}
          <section>
            <SectionHeader
              title={activeTab === 'income' ? 'Ingresos' : 'Gastos'}
              count={currentCategories.length}
              accentColor={activeTab === 'income' ? '#4ade80' : '#f87171'}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentCategories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}

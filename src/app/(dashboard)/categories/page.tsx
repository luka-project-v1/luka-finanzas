import { getOrCreateDefaultCategories } from '@/lib/actions/categories';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/constants/categories';
import { CategoriesView, type EnrichedCategory } from './_components/categories-view';

export const metadata = {
  title: 'Categorías — Luka',
};

// Names of the default income categories (used to classify unknown rows)
const INCOME_NAMES = new Set<string>(INCOME_CATEGORIES.map((c) => c.name));

// Build a flat lookup: category name → { icon, color }
const META_MAP: Record<string, { icon: string; color: string }> = {};
for (const c of [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]) {
  META_MAP[c.name] = { icon: c.icon, color: c.color };
}

type RawCategory = {
  id: string;
  name: string;
  parent_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  type?: string | null;
  color?: string | null;
  icon?: string | null;
  is_system_category?: boolean | null;
};

function enrichCategory(cat: RawCategory): EnrichedCategory {
  const meta = META_MAP[cat.name];
  let type: EnrichedCategory['type'];
  if (cat.type === 'income' || cat.type === 'expense' || cat.type === 'both') {
    type = cat.type;
  } else {
    type = INCOME_NAMES.has(cat.name) ? 'income' : 'expense';
  }
  return {
    id: cat.id,
    name: cat.name,
    icon: cat.icon ?? meta?.icon ?? 'tag',
    color: cat.color ?? meta?.color ?? '#6B7280',
    type,
    is_system_category: cat.is_system_category ?? false,
  };
}

export default async function CategoriesPage() {
  const result = await getOrCreateDefaultCategories();
  const raw: RawCategory[] = result.success ? (result.data as RawCategory[]) : [];

  const enriched = raw.map(enrichCategory);

  // 'both' categories appear in both income and expense sections
  const incomeCategories = enriched.filter((c) => c.type === 'income' || c.type === 'both');
  const expenseCategories = enriched.filter((c) => c.type === 'expense' || c.type === 'both');

  return (
    <CategoriesView
      incomeCategories={incomeCategories}
      expenseCategories={expenseCategories}
    />
  );
}

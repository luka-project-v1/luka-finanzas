export const EXPENSE_CATEGORIES = [
  { name: 'Alimentación', icon: 'utensils', color: '#F59E0B' },
  { name: 'Transporte', icon: 'car', color: '#3B82F6' },
  { name: 'Entretenimiento', icon: 'smile', color: '#EC4899' },
  { name: 'Salud', icon: 'heart', color: '#DC2626' },
  { name: 'Educación', icon: 'book', color: '#8B5CF6' },
  { name: 'Vivienda', icon: 'home', color: '#10B981' },
  { name: 'Servicios', icon: 'zap', color: '#F59E0B' },
  { name: 'Ropa', icon: 'shirt', color: '#06B6D4' },
  { name: 'Otros Gastos', icon: 'more-horizontal', color: '#6B7280' },
] as const;

export const INCOME_CATEGORIES = [
  { name: 'Salario', icon: 'briefcase', color: '#10B981' },
  { name: 'Freelance', icon: 'code', color: '#8B5CF6' },
  { name: 'Inversiones', icon: 'trending-up', color: '#3B82F6' },
  { name: 'Otros Ingresos', icon: 'plus-circle', color: '#6B7280' },
] as const;

export type CategoryType = 'income' | 'expense';

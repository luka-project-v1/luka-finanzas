import { z } from 'zod';

const CATEGORY_ICONS = [
  'utensils',
  'car',
  'smile',
  'heart',
  'book',
  'home',
  'zap',
  'shirt',
  'more-horizontal',
  'briefcase',
  'code',
  'trending-up',
  'plus-circle',
  'tag',
] as const;

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export const createCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  type: z.enum(['income', 'expense'], {
    required_error: 'El tipo de categoría es obligatorio',
  }),
  color: z
    .string()
    .min(1, 'El color es obligatorio')
    .regex(hexColorRegex, 'Color debe ser un hex válido (ej. #F59E0B)'),
  icon: z.enum(CATEGORY_ICONS, {
    required_error: 'El ícono es obligatorio',
    invalid_type_error: 'Ícono no válido',
  }),
  is_system_category: z.boolean().default(false),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100).optional(),
  type: z.enum(['income', 'expense']).optional(),
  color: z
    .string()
    .regex(hexColorRegex, 'Color debe ser un hex válido (ej. #F59E0B)')
    .optional(),
  icon: z.enum(CATEGORY_ICONS, { invalid_type_error: 'Ícono no válido' }).optional(),
  is_system_category: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

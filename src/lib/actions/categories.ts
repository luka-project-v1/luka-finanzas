'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  createCategorySchema,
  updateCategorySchema,
} from '@/lib/validations/category-schema';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getCategories(): Promise<
  ActionResult<Array<Record<string, unknown>>>
> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { success: false, error: 'Error al obtener las categorías' };
  }
}

export async function getOrCreateDefaultCategories(): Promise<
  ActionResult<Array<Record<string, unknown>>>
> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const supabase = await createClient();

    // Check if user has categories
    const { data: existing } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (existing && existing.length > 0) {
      return await getCategories();
    }

    // Create default categories
    const defaultCategories = [
      // Expense categories
      { user_id: user.id, name: 'Alimentación', type: 'expense', color: '#F59E0B', icon: 'utensils', is_system_category: true },
      { user_id: user.id, name: 'Transporte', type: 'expense', color: '#3B82F6', icon: 'car', is_system_category: true },
      { user_id: user.id, name: 'Entretenimiento', type: 'expense', color: '#EC4899', icon: 'smile', is_system_category: true },
      { user_id: user.id, name: 'Salud', type: 'expense', color: '#DC2626', icon: 'heart', is_system_category: true },
      { user_id: user.id, name: 'Educación', type: 'expense', color: '#8B5CF6', icon: 'book', is_system_category: true },
      { user_id: user.id, name: 'Vivienda', type: 'expense', color: '#10B981', icon: 'home', is_system_category: true },
      { user_id: user.id, name: 'Servicios', type: 'expense', color: '#F59E0B', icon: 'zap', is_system_category: true },
      { user_id: user.id, name: 'Ropa', type: 'expense', color: '#06B6D4', icon: 'shirt', is_system_category: true },
      { user_id: user.id, name: 'Otros Gastos', type: 'expense', color: '#6B7280', icon: 'more-horizontal', is_system_category: true },
      // Income categories
      { user_id: user.id, name: 'Salario', type: 'income', color: '#10B981', icon: 'briefcase', is_system_category: true },
      { user_id: user.id, name: 'Freelance', type: 'income', color: '#8B5CF6', icon: 'code', is_system_category: true },
      { user_id: user.id, name: 'Inversiones', type: 'income', color: '#3B82F6', icon: 'trending-up', is_system_category: true },
      { user_id: user.id, name: 'Otros Ingresos', type: 'income', color: '#6B7280', icon: 'plus-circle', is_system_category: true },
    ];

    const { error } = await supabase
      .from('categories')
      .insert(defaultCategories as any);

    if (error) throw error;

    return await getCategories();
  } catch (error) {
    console.error('Error creating default categories:', error);
    return { success: false, error: 'Error al crear las categorías predeterminadas' };
  }
}

export async function createCategory(
  data: unknown
): Promise<ActionResult<Record<string, unknown>>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const validated = createCategorySchema.parse(data);

    const supabase = await createClient();
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: validated.name,
        type: validated.type,
        color: validated.color,
        icon: validated.icon,
        is_system_category: validated.is_system_category ?? false,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/categories');
    revalidatePath('/dashboard');
    revalidatePath('/transactions');

    return { success: true, data: category };
  } catch (error: unknown) {
    console.error('Error creating category:', error);

    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues?: Array<{ path: unknown; message: string }> };
      const messages = zodError.issues?.map((i) => i.message).join(', ') ?? 'Error de validación';
      return { success: false, error: messages };
    }

    return { success: false, error: 'Error al crear la categoría' };
  }
}

export async function updateCategory(
  id: string,
  data: unknown
): Promise<ActionResult<Record<string, unknown>>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const validated = updateCategorySchema.parse(data);

    const supabase = await createClient();

    // Verify category belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: 'Categoría no encontrada' };
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (validated.name !== undefined) updatePayload.name = validated.name;
    if (validated.type !== undefined) updatePayload.type = validated.type;
    if (validated.color !== undefined) updatePayload.color = validated.color;
    if (validated.icon !== undefined) updatePayload.icon = validated.icon;
    if (validated.is_system_category !== undefined)
      updatePayload.is_system_category = validated.is_system_category;

    const { data: category, error } = await supabase
      .from('categories')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/categories');
    revalidatePath('/dashboard');
    revalidatePath('/transactions');

    return { success: true, data: category };
  } catch (error: unknown) {
    console.error('Error updating category:', error);

    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues?: Array<{ path: unknown; message: string }> };
      const messages = zodError.issues?.map((i) => i.message).join(', ') ?? 'Error de validación';
      return { success: false, error: messages };
    }

    return { success: false, error: 'Error al actualizar la categoría' };
  }
}

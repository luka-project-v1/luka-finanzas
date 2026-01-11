'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

export async function getCategories() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { success: false, error: 'Failed to fetch categories' };
  }
}

export async function getOrCreateDefaultCategories() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

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
    return { success: false, error: 'Failed to create default categories' };
  }
}

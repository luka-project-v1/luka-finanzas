import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database.types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

// Extended type with related data
export type TransactionWithRelations = Transaction & {
  accounts?: Database['public']['Tables']['accounts']['Row'] | null;
  categories?: Database['public']['Tables']['categories']['Row'] | null;
  account_types?: Database['public']['Tables']['account_types']['Row'] | null;
};

export const transactionRepository = {
  async getAll(
    userId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      categoryId?: string;
      accountId?: string;
      kind?: Database['public']['Enums']['transaction_kind'];
      status?: Database['public']['Enums']['transaction_status'];
      limit?: number;
      offset?: number;
    }
  ): Promise<{ data: TransactionWithRelations[]; count: number }> {
    const supabase = await createClient();
    
    let query = supabase
      .from('transactions')
      .select(`
        *,
        accounts (
          *,
          account_types (*)
        ),
        categories (*)
      `, { count: 'exact' })
      .eq('user_id', userId);

    if (filters?.startDate) {
      query = query.gte('occurred_at', `${filters.startDate} 00:00:00`);
    }
    if (filters?.endDate) {
      query = query.lte('occurred_at', `${filters.endDate} 23:59:59`);
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters?.accountId) {
      query = query.eq('account_id', filters.accountId);
    }
    if (filters?.kind) {
      query = query.eq('kind', filters.kind);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('occurred_at', { ascending: false });

    if (filters?.limit) {
      query = query.range(
        filters.offset || 0,
        (filters.offset || 0) + filters.limit - 1
      );
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: (data || []) as TransactionWithRelations[], count: count || 0 };
  },

  async getById(id: string, userId: string): Promise<TransactionWithRelations | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts (
          *,
          account_types (*)
        ),
        categories (*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as TransactionWithRelations;
  },

  async create(transaction: TransactionInsert): Promise<TransactionWithRelations> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select(`
        *,
        accounts (
          *,
          account_types (*)
        ),
        categories (*)
      `)
      .single();

    if (error) throw error;
    return data as TransactionWithRelations;
  },

  async update(id: string, userId: string, updates: TransactionUpdate): Promise<TransactionWithRelations> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        accounts (
          *,
          account_types (*)
        ),
        categories (*)
      `)
      .single();

    if (error) throw error;
    return data as TransactionWithRelations;
  },

  async delete(id: string, userId: string): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async getSummary(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ totalIncome: number; totalExpense: number; balance: number }> {
    const supabase = await createClient();
    
    // Get all transactions in date range
    // Exclude TRANSFER and ADJUSTMENT from income/expense calculations
    const { data, error } = await supabase
      .from('transactions')
      .select('signed_amount, kind, accounts!inner(account_types!inner(balance_nature))')
      .eq('user_id', userId)
      .eq('status', 'POSTED')
      .gte('occurred_at', `${startDate} 00:00:00`)
      .lte('occurred_at', `${endDate} 23:59:59`)
      .not('kind', 'in', '(TRANSFER,ADJUSTMENT)');

    if (error) throw error;

    let totalIncome = 0;
    let totalExpense = 0;

    (data || []).forEach((t) => {
      const amount = Number(t.signed_amount);
      const account = t.accounts as any;
      const balanceNature = account?.account_types?.balance_nature;
      
      // ASSET: positive = income, negative = expense
      // LIABILITY: positive = charge (expense), negative = payment (reduces debt, not income)
      if (balanceNature === 'ASSET') {
        if (amount > 0) {
          totalIncome += amount;
        } else {
          totalExpense += Math.abs(amount);
        }
      } else if (balanceNature === 'LIABILITY') {
        // For credit cards, positive amount = charge (expense)
        if (amount > 0) {
          totalExpense += amount;
        }
        // Negative amount = payment (reduces debt, not counted as income)
      }
    });

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  },
};

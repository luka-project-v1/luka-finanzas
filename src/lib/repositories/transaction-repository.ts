import { createClient } from '@/lib/supabase/server';
import { convertToBase } from '@/lib/utils/currency';
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

  // Returns a map of accountId → { date: ISO occurred_at, id: UUID } for the most recent
  // POSTED ADJUSTMENT per account. The id is needed to visually distinguish the active
  // adjustment from older (historical) adjustment rows in the UI.
  async getLastAdjustmentPerAccount(
    userId: string,
    accountIds: string[]
  ): Promise<Map<string, { date: string; id: string }>> {
    if (accountIds.length === 0) return new Map();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('transactions')
      .select('id, account_id, occurred_at')
      .eq('user_id', userId)
      .eq('kind', 'ADJUSTMENT')
      .eq('status', 'POSTED')
      .in('account_id', accountIds)
      .order('occurred_at', { ascending: false });

    if (error) throw error;

    const map = new Map<string, { date: string; id: string }>();
    for (const t of data || []) {
      if (t.account_id && !map.has(t.account_id)) {
        map.set(t.account_id, { date: t.occurred_at, id: t.id });
      }
    }
    return map;
  },

  async getSummary(
    userId: string,
    startDate: string,
    endDate: string,
    rateByCode?: Map<string, number>,
    preferredCode?: string
  ): Promise<{ totalIncome: number; totalExpense: number; balance: number }> {
    const supabase = await createClient();

    // Fetch the most recent POSTED ADJUSTMENT per account so we can filter out
    // historical (pre-adjustment) transactions from the income/expense totals.
    const { data: adjData } = await supabase
      .from('transactions')
      .select('account_id, occurred_at')
      .eq('user_id', userId)
      .eq('kind', 'ADJUSTMENT')
      .eq('status', 'POSTED')
      .order('occurred_at', { ascending: false });

    const lastAdjMap = new Map<string, string>();
    for (const adj of adjData || []) {
      if (adj.account_id && !lastAdjMap.has(adj.account_id)) {
        lastAdjMap.set(adj.account_id, adj.occurred_at);
      }
    }

    // Fetch transactions with account currency code for conversion.
    // Exclude TRANSFER and ADJUSTMENT from income/expense calculations.
    // Include account_id to apply the per-account adjustment filter below.
    const { data, error } = await supabase
      .from('transactions')
      .select('signed_amount, kind, account_id, occurred_at, accounts!inner(currency_code, account_types!inner(balance_nature))')
      .eq('user_id', userId)
      .eq('status', 'POSTED')
      .gte('occurred_at', `${startDate} 00:00:00`)
      .lte('occurred_at', `${endDate} 23:59:59`)
      .not('kind', 'in', '(TRANSFER,ADJUSTMENT)');

    if (error) throw error;

    let totalIncome = 0;
    let totalExpense = 0;

    (data || []).forEach((t) => {
      // Skip transactions that are "historical" — i.e., occurred at or before the
      // most recent ADJUSTMENT for their account. The ADJUSTMENT amount already
      // captures everything up to that point, so adding earlier transactions would
      // double-count (or add noise to) the balance.
      const lastAdj = t.account_id ? lastAdjMap.get(t.account_id) : undefined;
      if (lastAdj && t.occurred_at <= lastAdj) return;

      const rawAmount = Number(t.signed_amount);
      const account = t.accounts as any;
      const balanceNature = account?.account_types?.balance_nature;
      const currencyCode: string = account?.currency_code ?? '';

      // Convert to preferred currency using convertToBase.
      // Falls back to the raw amount when rates or preferred code are unavailable.
      let amount = rawAmount;
      if (rateByCode && preferredCode) {
        if (!rateByCode.has(currencyCode)) {
          console.warn(
            `[getSummary] No exchange rate found for currency "${currencyCode}" — using raw amount as fallback`
          );
        } else {
          amount = convertToBase(rawAmount, currencyCode, preferredCode, rateByCode);
        }
      }

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
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      balance: Math.round((totalIncome - totalExpense) * 100) / 100,
    };
  },
};

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database.types';

type Account = Database['public']['Tables']['accounts']['Row'];
type AccountInsert = Database['public']['Tables']['accounts']['Insert'];
type AccountUpdate = Database['public']['Tables']['accounts']['Update'];
type AccountType = Database['public']['Tables']['account_types']['Row'];
type BankAccountDetails = Database['public']['Tables']['bank_account_details']['Row'];
type BankAccountDetailsInsert = Database['public']['Tables']['bank_account_details']['Insert'];

// Extended type that includes related data
export type AccountWithDetails = Account & {
  account_types: AccountType;
  bank_account_details?: BankAccountDetails | null;
  credit_card_details?: Database['public']['Tables']['credit_card_details']['Row'] | null;
  // Calculated balance from transactions
  balance?: number;
};

export const accountRepository = {
  async getAll(userId: string): Promise<AccountWithDetails[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('accounts')
      .select(`
        *,
        account_types (*),
        bank_account_details (*),
        credit_card_details (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Calculate balance for each account
    const accountsWithBalance = await Promise.all(
      (data || []).map(async (account) => {
        const balance = await this.calculateBalance(account.id);
        return { ...account, balance };
      })
    );
    
    return accountsWithBalance as AccountWithDetails[];
  },

  async getById(id: string, userId: string): Promise<AccountWithDetails | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('accounts')
      .select(`
        *,
        account_types (*),
        bank_account_details (*),
        credit_card_details (*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    const balance = await this.calculateBalance(id);
    return { ...data, balance } as AccountWithDetails;
  },

  async create(
    account: AccountInsert,
    details?: BankAccountDetailsInsert | Database['public']['Tables']['credit_card_details']['Insert']
  ): Promise<AccountWithDetails> {
    const supabase = await createClient();
    
    // Create account
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .insert(account)
      .select(`
        *,
        account_types (*),
        bank_account_details (*),
        credit_card_details (*)
      `)
      .single();

    if (accountError) throw accountError;
    
    // Create details if provided
    if (details) {
      const accountType = await this.getAccountType(account.account_type_id);
      
      if (accountType?.code === 'BANK_ACCOUNT' && 'kind' in details) {
        const { error: detailsError } = await supabase
          .from('bank_account_details')
          .insert({ ...details, account_id: accountData.id });
        
        if (detailsError) throw detailsError;
      } else if (accountType?.code === 'CREDIT_CARD' && 'credit_limit' in details) {
        const { error: detailsError } = await supabase
          .from('credit_card_details')
          .insert({ ...details, account_id: accountData.id });
        
        if (detailsError) throw detailsError;
      }
    }
    
    // Fetch complete account with details
    const completeAccount = await this.getById(accountData.id, account.user_id);
    if (!completeAccount) throw new Error('Failed to fetch created account');
    
    return completeAccount;
  },

  async update(id: string, userId: string, updates: AccountUpdate): Promise<AccountWithDetails> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        account_types (*),
        bank_account_details (*),
        credit_card_details (*)
      `)
      .single();

    if (error) throw error;
    
    const balance = await this.calculateBalance(id);
    return { ...data, balance } as AccountWithDetails;
  },

  async delete(id: string, userId: string): Promise<void> {
    const supabase = await createClient();
    
    // Delete details first (if any)
    await supabase.from('bank_account_details').delete().eq('account_id', id);
    await supabase.from('credit_card_details').delete().eq('account_id', id);
    
    // Delete account
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  },

  // Calculate balance from transactions (ledger-based)
  async calculateBalance(accountId: string): Promise<number> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('transactions')
      .select('signed_amount')
      .eq('account_id', accountId)
      .eq('status', 'POSTED');

    if (error) throw error;
    
    return (data || []).reduce((sum, t) => sum + Number(t.signed_amount), 0);
  },

  // Get account type by ID
  async getAccountType(accountTypeId: string): Promise<AccountType | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('account_types')
      .select('*')
      .eq('id', accountTypeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return data;
  },

  // Get account type by code
  async getAccountTypeByCode(code: string): Promise<AccountType | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('account_types')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    
    return data;
  },
};

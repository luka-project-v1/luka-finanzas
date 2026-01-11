import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database.types';
import { accountRepository } from './account-repository';

type Account = Database['public']['Tables']['accounts']['Row'];
type CreditCardDetails = Database['public']['Tables']['credit_card_details']['Row'];
type CreditCardDetailsInsert = Database['public']['Tables']['credit_card_details']['Insert'];
type CreditCardDetailsUpdate = Database['public']['Tables']['credit_card_details']['Update'];

// Credit card is an account with credit_card_details
export type CreditCard = Account & {
  account_types: Database['public']['Tables']['account_types']['Row'];
  credit_card_details: CreditCardDetails;
  balance?: number; // Calculated from transactions (negative for liability)
};

export const creditCardRepository = {
  async create(data: {
    account: Database['public']['Tables']['accounts']['Insert'];
    details: CreditCardDetailsInsert;
  }): Promise<CreditCard> {
    const supabase = await createClient();
    
    // Get CREDIT_CARD account type
    const accountType = await accountRepository.getAccountTypeByCode('CREDIT_CARD');
    if (!accountType) {
      throw new Error('CREDIT_CARD account type not found');
    }
    
    // Create account with CREDIT_CARD type
    const account = await accountRepository.create(
      {
        ...data.account,
        account_type_id: accountType.id,
      },
      data.details
    );
    
    if (!account.credit_card_details) {
      throw new Error('Failed to create credit card details');
    }
    
    return {
      ...account,
      credit_card_details: account.credit_card_details,
    } as CreditCard;
  },

  async getById(id: string, userId: string): Promise<CreditCard | null> {
    const account = await accountRepository.getById(id, userId);
    
    if (!account || !account.credit_card_details) {
      return null;
    }
    
    return {
      ...account,
      credit_card_details: account.credit_card_details,
    } as CreditCard;
  },

  async getAll(userId: string): Promise<CreditCard[]> {
    const supabase = await createClient();
    
    // Get CREDIT_CARD account type
    const accountType = await accountRepository.getAccountTypeByCode('CREDIT_CARD');
    if (!accountType) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('accounts')
      .select(`
        *,
        account_types (*),
        credit_card_details (*)
      `)
      .eq('user_id', userId)
      .eq('account_type_id', accountType.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Calculate balance for each credit card
    const creditCardsWithBalance = await Promise.all(
      (data || [])
        .filter(account => account.credit_card_details)
        .map(async (account) => {
          const balance = await accountRepository.calculateBalance(account.id);
          return {
            ...account,
            credit_card_details: account.credit_card_details,
            balance,
          };
        })
    );
    
    return creditCardsWithBalance as CreditCard[];
  },

  async update(id: string, userId: string, updates: {
    account?: Database['public']['Tables']['accounts']['Update'];
    details?: CreditCardDetailsUpdate;
  }): Promise<CreditCard> {
    const supabase = await createClient();
    
    // Update account if provided
    if (updates.account) {
      await accountRepository.update(id, userId, updates.account);
    }
    
    // Update details if provided
    if (updates.details) {
      const { error } = await supabase
        .from('credit_card_details')
        .update(updates.details)
        .eq('account_id', id);
      
      if (error) throw error;
    }
    
    const creditCard = await this.getById(id, userId);
    if (!creditCard) {
      throw new Error('Credit card not found after update');
    }
    
    return creditCard;
  },

  async delete(id: string, userId: string): Promise<void> {
    await accountRepository.delete(id, userId);
  },
};

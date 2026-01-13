'use server';

import { createClient } from '@/lib/supabase/server';

// Currency type (not in Prisma schema, but exists in Supabase)
type Currency = {
  id: string;
  user_id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_preferred: number | null;
  created_at?: string;
  updated_at?: string;
};

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };

export async function getCurrencies(): Promise<ActionResult<Currency[]>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('currencies')
      .select('*')
      .eq('user_id', user.id)
      .order('code');

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return { success: false, error: 'Failed to fetch currencies' };
  }
}

export async function getOrCreateDefaultCurrencies(): Promise<ActionResult<Currency[]>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user has currencies
    const { data: existing } = await supabase
      .from('currencies')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (existing && existing.length > 0) {
      return await getCurrencies();
    }

    // Create default currencies (USD and COP)
    const defaultCurrencies = [
      {
        user_id: user.id,
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        exchange_rate_to_preferred: null, // Will be set by user preference or API
      },
      {
        user_id: user.id,
        code: 'COP',
        name: 'Colombian Peso',
        symbol: '$',
        exchange_rate_to_preferred: 1, // Default preferred currency
      },
    ];

    const { error } = await supabase
      .from('currencies')
      .insert(defaultCurrencies as any);

    if (error) throw error;

    return await getCurrencies();
  } catch (error) {
    console.error('Error creating default currencies:', error);
    return { success: false, error: 'Failed to create default currencies' };
  }
}

export async function refreshExchangeRates(): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get all currencies for the user
    const { data: currencies, error: fetchError } = await supabase
      .from('currencies')
      .select('*')
      .eq('user_id', user.id);

    if (fetchError) throw fetchError;

    if (!currencies || currencies.length === 0) {
      return { success: false, error: 'No currencies found' };
    }

    // Find preferred currency (COP by default)
    const preferredCurrency = currencies.find(c => c.code === 'COP') || currencies[0];
    
    // Update exchange rates (simplified - in production, fetch from API)
    // For now, we'll just set a default rate for USD to COP
    const usdCurrency = currencies.find(c => c.code === 'USD');
    if (usdCurrency && preferredCurrency.code === 'COP') {
      // Default rate: 1 USD = 4000 COP (this should come from an API in production)
      const defaultRate = 4000;
      
      const { error: updateError } = await supabase
        .from('currencies')
        .update({ exchange_rate_to_preferred: defaultRate })
        .eq('id', usdCurrency.id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
    }

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Error refreshing exchange rates:', error);
    return { success: false, error: 'Failed to refresh exchange rates' };
  }
}

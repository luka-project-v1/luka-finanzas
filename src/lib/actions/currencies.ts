'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database.types';
import { getRateToCOP, updateCurrencyRates } from '@/lib/services/exchange-rate';

type Currency = Database['public']['Tables']['currencies']['Row'];

export async function getCurrencies() {
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

export async function getOrCreateDefaultCurrencies() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update user's preferred currency to COP if not set
    const { data: userData } = await supabase
      .from('users')
      .select('preferred_currency')
      .eq('id', user.id)
      .single();

    if (!userData?.preferred_currency || userData.preferred_currency !== 'COP') {
      await supabase
        .from('users')
        .update({ preferred_currency: 'COP' })
        .eq('id', user.id);
    }

    // Check if user has currencies
    const { data: existing } = await supabase
      .from('currencies')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (existing && existing.length > 0) {
      // Update exchange rates before returning
      await updateCurrencyRates(user.id);
      return await getCurrencies();
    }

    // Fetch current exchange rates
    const usdRate = await getRateToCOP('USD');
    const eurRate = await getRateToCOP('EUR');

    // Create default currencies with current exchange rates to COP
    const defaultCurrencies = [
      { 
        user_id: user.id, 
        code: 'USD', 
        name: 'US Dollar', 
        symbol: '$', 
        exchange_rate_to_preferred: usdRate, 
        is_system_currency: true 
      },
      { 
        user_id: user.id, 
        code: 'COP', 
        name: 'Colombian Peso', 
        symbol: '$', 
        exchange_rate_to_preferred: 1.0, // COP is the base
        is_system_currency: true 
      },
      { 
        user_id: user.id, 
        code: 'EUR', 
        name: 'Euro', 
        symbol: '€', 
        exchange_rate_to_preferred: eurRate, 
        is_system_currency: true 
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

/**
 * Refresh exchange rates for all user currencies
 */
export async function refreshExchangeRates() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    await updateCurrencyRates(user.id);
    
    return { success: true };
  } catch (error) {
    console.error('Error refreshing exchange rates:', error);
    return { success: false, error: 'Failed to refresh exchange rates' };
  }
}

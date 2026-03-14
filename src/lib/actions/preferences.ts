'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };

export type BaseCurrencyInfo = {
  code: string;
  symbol: string;
};

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Gets the user's base currency from preferences.
 * Falls back to first currency with exchange_rate_to_preferred = 1 (USD from API),
 * then first currency, then 'COP' with '$'.
 * Returns { code, symbol } for use in conversions and display.
 */
export async function getBaseCurrency(userId: string): Promise<BaseCurrencyInfo> {
  const supabase = await createClient();

  // Fetch user preferences
  const { data: prefs } = await (supabase as any)
    .from('user_preferences')
    .select('base_currency_code')
    .eq('user_id', userId)
    .single();

  // Fetch user currencies for validation and symbol lookup
  const { data: currencies } = await (supabase as any)
    .from('currencies')
    .select('code, symbol, exchange_rate_to_preferred')
    .eq('user_id', userId)
    .order('code');

  const currencyList = (currencies ?? []) as {
    code: string;
    symbol: string;
    exchange_rate_to_preferred: number | null;
  }[];

  if (currencyList.length === 0) {
    return { code: 'COP', symbol: '$' };
  }

  // If user has a preference and it exists in their currencies, use it
  const preferredCode = prefs?.base_currency_code;
  if (preferredCode) {
    const match = currencyList.find((c) => c.code === preferredCode);
    if (match) {
      return { code: match.code, symbol: match.symbol || '$' };
    }
  }

  // Fallback: currency with rate = 1 (USD from API), then first, then COP
  const preferredCurrency =
    currencyList.find((c) => c.exchange_rate_to_preferred === 1) ??
    currencyList.find((c) => c.exchange_rate_to_preferred === null) ??
    currencyList[0];

  return {
    code: preferredCurrency.code,
    symbol: preferredCurrency.symbol || '$',
  };
}

/**
 * Ensures the user has a user_preferences row.
 * Called before updateBaseCurrency to avoid insert errors.
 */
async function ensureUserPreferences(userId: string): Promise<void> {
  const supabase = await createClient();
  const { data: existing } = await (supabase as any)
    .from('user_preferences')
    .select('user_id')
    .eq('user_id', userId)
    .single();

  if (!existing) {
    await (supabase as any)
      .from('user_preferences')
      .insert({ user_id: userId, base_currency_code: 'COP' });
  }
}

/**
 * Updates the user's base currency preference.
 * Validates that the currency exists in the user's currencies table.
 * Triggers full revalidation so dashboard and all balance displays update.
 */
export async function updateBaseCurrency(
  baseCurrencyCode: string
): Promise<ActionResult<BaseCurrencyInfo>> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    // Validate currency exists for this user
    const supabase = await createClient();
    const { data: currency } = await (supabase as any)
      .from('currencies')
      .select('code, symbol')
      .eq('user_id', user.id)
      .eq('code', baseCurrencyCode)
      .single();

    if (!currency) {
      return {
        success: false,
        error: `La divisa "${baseCurrencyCode}" no está configurada. Ve a Divisas para agregarla.`,
      };
    }

    await ensureUserPreferences(user.id);

    const { error } = await (supabase as any)
      .from('user_preferences')
      .update({
        base_currency_code: baseCurrencyCode,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) throw error;

    // Full revalidation so all pages showing balances update
    revalidatePath('/', 'layout');

    return {
      success: true,
      data: {
        code: currency.code,
        symbol: currency.symbol || '$',
      },
    };
  } catch (error) {
    console.error('Error updating base currency:', error);
    return {
      success: false,
      error: 'Error al actualizar la moneda base',
    };
  }
}

/**
 * Gets user preferences for display (e.g. settings page).
 */
export async function getUserPreferences(): Promise<
  ActionResult<{ baseCurrency: BaseCurrencyInfo; currencies: { code: string; name: string; symbol: string }[] }>
> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'No autorizado' };
    }

    const baseCurrency = await getBaseCurrency(user.id);

    const supabase = await createClient();
    const { data: currencies, error } = await (supabase as any)
      .from('currencies')
      .select('code, name, symbol')
      .eq('user_id', user.id)
      .order('code');

    if (error) throw error;

    return {
      success: true,
      data: {
        baseCurrency,
        currencies: (currencies ?? []).map((c: { code: string; name: string; symbol: string }) => ({
          code: c.code,
          name: c.name,
          symbol: c.symbol,
        })),
      },
    };
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return { success: false, error: 'Error al obtener preferencias' };
  }
}

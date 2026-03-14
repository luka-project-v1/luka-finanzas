'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';

// --------------------------------
// Types
// --------------------------------

/** Shape of the response from currencyapi.net /v2/rates endpoint. */
interface CurrencyApiResponse {
  /** Whether the request was valid and the data is trustworthy. */
  valid: boolean;
  /** Unix timestamp (seconds) of when the rates were last updated by the provider. */
  updated: number;
  /** The base currency used for all rates (always "USD" in our setup). */
  base: string;
  /** Map of currency code → units of that currency per 1 unit of base. */
  rates: Record<string, number>;
}

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

// --------------------------------
// Internal API helper
// --------------------------------

/**
 * Fetches live exchange rates from currencyapi.net using USD as the base.
 * Throws a descriptive error if the request fails or the response is invalid.
 */
async function fetchExchangeRatesFromApi(): Promise<CurrencyApiResponse> {
  const apiKey = process.env.CURRENCY_API_KEY;
  if (!apiKey) {
    throw new Error('CURRENCY_API_KEY is not configured in environment variables');
  }
  console.log('apiKey responseresponse', apiKey);

  const url = `https://currencyapi.net/api/v2/rates?base=USD&output=json&key=${apiKey}`;
  const response = await fetch(url, { cache: 'no-store' });
  console.log('responseresponseresponse', response);
  if (!response.ok) {
    throw new Error(
      `Currency API request failed — HTTP ${response.status} ${response.statusText}`
    );
  }

  const data: CurrencyApiResponse = await response.json();

  if (!data.valid) {
    throw new Error(
      'Currency API returned an invalid response (valid=false). Check your API key or plan limits.'
    );
  }

  return data;
}

export async function getCurrencies(): Promise<ActionResult<Currency[]>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'No autorizado' };
    }

    const { data, error } = await (supabase as any)
      .from('currencies')
      .select('*')
      .eq('user_id', user.id)
      .order('code');

    if (error) throw error;

    return { success: true, data: (data as Currency[]) || [] };
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return { success: false, error: 'Error al obtener las divisas' };
  }
}

export async function getOrCreateDefaultCurrencies(): Promise<ActionResult<Currency[]>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'No autorizado' };
    }

    // Check if user has currencies
    const { data: existing } = await (supabase as any)
      .from('currencies')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    if (existing && existing.length > 0) {
      return await getCurrencies();
    }

    // Create default currencies (USD and COP).
    // Both start with exchange_rate_to_preferred = 1 as a safe placeholder
    // until the user refreshes rates from the API.
    // COP is the base/preferred currency; USD will get its real rate on first refresh.
    const defaultCurrencies = [
      {
        user_id: user.id,
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        exchange_rate_to_preferred: 1,
      },
      {
        user_id: user.id,
        code: 'COP',
        name: 'Colombian Peso',
        symbol: '$',
        exchange_rate_to_preferred: 1,
      },
    ];

    const { error } = await (supabase as any)
      .from('currencies')
      .insert(defaultCurrencies);

    // Another concurrent request already inserted the defaults — that's fine.
    if (error && (error as { code?: string }).code !== '23505') throw error;

    return await getCurrencies();
  } catch (error) {
    const err = error as { code?: string; message?: string };
    console.error('Error creating default currencies:', err?.message ?? err, err);
    return { success: false, error: 'Error al crear las divisas predeterminadas' };
  }
}

/**
 * Refreshes exchange rates for the authenticated user by calling currencyapi.net.
 * Stores the raw rate vs USD (1 USD = X units of the currency).
 * USD itself is always stored as 1.
 */
export async function refreshExchangeRates(): Promise<ActionResult<{ updated: number; skipped: number }>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'No autorizado' };
    }

    const { data: currenciesRaw, error: fetchError } = await (supabase as any)
      .from('currencies')
      .select('*')
      .eq('user_id', user.id);

    if (fetchError) throw fetchError;

    const currencies = (currenciesRaw ?? []) as Currency[];

    if (currencies.length === 0) {
      return { success: false, error: 'No hay divisas configuradas. Ve a la página de Divisas primero.' };
    }

    const apiData = await fetchExchangeRatesFromApi();
    const ratesUpdatedAt = new Date(apiData.updated * 1000).toISOString();

    let updated = 0;
    let skipped = 0;

    for (const currency of currencies) {
      const rate = currency.code === apiData.base
        ? 1
        : apiData.rates[currency.code];

      if (rate === undefined) {
        console.warn(`Currency ${currency.code} not found in API response — skipping`);
        skipped++;
        continue;
      }

      const { error: updateError } = await (supabase as any)
        .from('currencies')
        .update({ exchange_rate_to_preferred: rate, updated_at: ratesUpdatedAt })
        .eq('id', currency.id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error(`Failed to update rate for ${currency.code}:`, updateError);
        skipped++;
      } else {
        updated++;
      }
    }

    if (updated === 0) {
      return {
        success: false,
        error: `No se actualizó ninguna divisa (${skipped} omitidas). Revisa los logs del servidor.`,
      };
    }

    return { success: true, data: { updated, skipped } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error refreshing exchange rates:', error);
    return { success: false, error: `Error al actualizar las tasas de cambio: ${message}` };
  }
}

/**
 * Refreshes exchange rates for ALL users in the database.
 * Uses the service-role client (bypasses RLS). Intended for cron jobs only.
 * Fetches rates from currencyapi.net once and applies them to every currency row.
 */
export async function refreshAllUsersExchangeRates(): Promise<ActionResult<{ updated: number }>> {
  try {
    // Fetch rates once and reuse across all users
    const apiData = await fetchExchangeRatesFromApi();
    const ratesUpdatedAt = new Date(apiData.updated * 1000).toISOString();

    const supabase = createAdminClient();
    // currencies table exists in Supabase but is not part of the generated Prisma/Database types
    const { data: currencies, error: fetchError } = await (supabase as any)
      .from('currencies')
      .select('id, user_id, code')
      .order('user_id');

    if (fetchError) throw fetchError;

    const list = (currencies ?? []) as { id: string; user_id: string; code: string }[];
    if (list.length === 0) {
      return { success: true, data: { updated: 0 } };
    }

    let updated = 0;

    for (const currency of list) {
      const rate = currency.code === apiData.base
        ? 1
        : apiData.rates[currency.code];

      if (rate === undefined) {
        console.warn(`Currency ${currency.code} not found in API response — skipping`);
        continue;
      }

      const { error: updateError } = await (supabase as any)
        .from('currencies')
        .update({ exchange_rate_to_preferred: rate, updated_at: ratesUpdatedAt })
        .eq('id', currency.id);

      if (updateError) {
        console.error(`Failed to update rate for ${currency.code} (id: ${currency.id}):`, updateError);
      } else {
        updated++;
      }
    }

    return { success: true, data: { updated } };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error refreshing all exchange rates:', error);
    return {
      success: false,
      error: `Error al actualizar las tasas de cambio: ${message}`,
    };
  }
}

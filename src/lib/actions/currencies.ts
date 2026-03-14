'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { getBaseCurrency } from './preferences';

// --------------------------------
// Types
// --------------------------------

/** Shape of the response from currencyapi.net /v2/rates endpoint. */
interface CurrencyApiResponse {
  /** Whether the request was valid and the data is trustworthy. */
  valid: boolean;
  /** Unix timestamp (seconds) of when the rates were last updated by the provider. */
  updated: number;
  /** The base currency used for all rates. */
  base: string;
  /** Map of currency code → units of that currency per 1 unit of base. */
  rates: Record<string, number>;
}

// Currency action data type
type CurrencyActionData = {
  id: string;
  user_id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_preferred: number | any; // Decimal type from Prisma
  created_at?: string | Date;
  updated_at?: string | Date;
};

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown };

// --------------------------------
// Internal API helper
// --------------------------------

/**
 * Fetches live exchange rates from currencyapi.net using a dynamic base currency.
 * Throws a descriptive error if the request fails or the response is invalid.
 */
async function fetchExchangeRatesFromApi(base: string = 'USD'): Promise<CurrencyApiResponse> {
  const apiKey = process.env.CURRENCY_API_KEY;
  if (!apiKey) {
    throw new Error('CURRENCY_API_KEY is not configured in environment variables');
  }

  const url = `https://currencyapi.net/api/v2/rates?base=${base}&output=json&key=${apiKey}`;
  const response = await fetch(url, { cache: 'no-store' });
  
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

export async function getCurrencies(): Promise<ActionResult<CurrencyActionData[]>> {
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

    return { success: true, data: (data as CurrencyActionData[]) || [] };
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return { success: false, error: 'Error al obtener las divisas' };
  }
}

export async function ensureDefaultCurrencies(): Promise<ActionResult<CurrencyActionData[]>> {
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
    const defaultCurrencies = [
      {
        user_id: user.id,
        code: 'USD',
        name: 'US Dollar',
        symbol: 'USD $',
        exchange_rate_to_preferred: 1,
      },
      {
        user_id: user.id,
        code: 'COP',
        name: 'Colombian Peso',
        symbol: 'COP $',
        exchange_rate_to_preferred: 1,
      },
    ];

    const { error } = await (supabase as any)
      .from('currencies')
      .insert(defaultCurrencies);

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
 * Uses the user's preferred base currency for the request.
 * Stores the rates using Prisma upsert logic.
 */
export async function refreshExchangeRates(): Promise<ActionResult<{ updated: number; skipped: number }>> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'No autorizado' };
    }

    // 1. Get user's base currency dynamically from user_preferences
    const baseCurrencyInfo = await getBaseCurrency(user.id);
    const baseCode = baseCurrencyInfo.code;

    // 2. Fetch existing currency rates for this user
    const currenciesInDb = await prisma.currencyRate.findMany({
      where: { userId: user.id },
    });

    if (currenciesInDb.length === 0) {
      return { success: false, error: 'No hay divisas configuradas. Ve a la página de Divisas primero.' };
    }

    // 3. Fetch live rates using the dynamic base currency
    const apiData = await fetchExchangeRatesFromApi(baseCode);
    const ratesUpdatedAt = new Date(apiData.updated * 1000);

    let updated = 0;
    let skipped = 0;

    // 4. Update rates using upsert
    for (const currency of currenciesInDb) {
      const rateFromApi = currency.code === apiData.base
        ? 1
        : apiData.rates[currency.code];

      if (rateFromApi === undefined) {
        console.warn(`Currency ${currency.code} not found in API response for base ${baseCode} — skipping`);
        skipped++;
        continue;
      }

      try {
        await prisma.currencyRate.upsert({
          where: {
            userId_code: {
              userId: user.id,
              code: currency.code,
            },
          },
          update: {
            exchangeRateToPreferred: rateFromApi,
            updatedAt: ratesUpdatedAt,
          },
          create: {
            userId: user.id,
            code: currency.code,
            name: currency.name,
            symbol: currency.symbol,
            exchangeRateToPreferred: rateFromApi,
            updatedAt: ratesUpdatedAt,
          },
        });
        updated++;
      } catch (upsertError) {
        console.error(`Failed to upsert rate for ${currency.code}:`, upsertError);
        skipped++;
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
 * Refreshes exchange rates for ALL users in the database using USD as a common base.
 * Intended for cron jobs.
 */
export async function refreshAllUsersExchangeRates(): Promise<ActionResult<{ updated: number }>> {
  try {
    const apiDataUSD = await fetchExchangeRatesFromApi('USD');
    const ratesUpdatedAt = new Date(apiDataUSD.updated * 1000);

    const allCurrencies = await prisma.currencyRate.findMany();

    if (allCurrencies.length === 0) {
      return { success: true, data: { updated: 0 } };
    }

    let updated = 0;

    for (const currency of allCurrencies) {
      const rate = currency.code === 'USD' ? 1 : apiDataUSD.rates[currency.code];

      if (rate !== undefined) {
        await prisma.currencyRate.update({
          where: { id: currency.id },
          data: {
            exchangeRateToPreferred: rate,
            updatedAt: ratesUpdatedAt,
          },
        });
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

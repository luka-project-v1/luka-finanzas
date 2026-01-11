'use server';

/**
 * Exchange Rate Service
 * Uses exchangerate.host (completely free, no API key required)
 * Base currency: USD
 */

interface ExchangeRateResponse {
  motd?: {
    msg: string;
    url: string;
  };
  success: boolean;
  base: string;
  date: string;
  rates: {
    [key: string]: number;
  };
}

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
let cachedRates: { rates: ExchangeRateResponse['rates']; timestamp: number } | null = null;

/**
 * Fetch exchange rates from API
 */
async function fetchExchangeRates(): Promise<ExchangeRateResponse['rates']> {
  try {
    // Using exchangerate.host (completely free, no API key needed)
    const response = await fetch('https://api.exchangerate.host/latest?base=USD', {
      next: { revalidate: 3600 }, // Revalidate every hour
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data: ExchangeRateResponse = await response.json();
    
    if (!data.success || !data.rates) {
      throw new Error('Failed to fetch exchange rates');
    }

    // Add USD to rates (base currency)
    return {
      USD: 1,
      ...data.rates,
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // Fallback rates (approximate, should be updated manually if API fails)
    return {
      USD: 1,
      COP: 4200,
      EUR: 0.92,
      GBP: 0.79,
      MXN: 17.5,
      BRL: 5.2,
    };
  }
}

/**
 * Get exchange rates with caching
 */
export async function getExchangeRates(): Promise<ExchangeRateResponse['rates']> {
  const now = Date.now();

  // Return cached rates if still valid
  if (cachedRates && (now - cachedRates.timestamp) < CACHE_DURATION) {
    return cachedRates.rates;
  }

  // Fetch new rates
  const rates = await fetchExchangeRates();
  
  // Cache the rates
  cachedRates = {
    rates,
    timestamp: now,
  };

  return rates;
}

/**
 * Convert amount from one currency to another
 */
export async function convertToCOP(
  amount: number,
  fromCurrency: string
): Promise<number> {
  if (fromCurrency === 'COP') {
    return amount;
  }

  const rates = await getExchangeRates();
  
  // All rates are relative to USD
  // To convert to COP: amount * (COP_rate / fromCurrency_rate)
  const fromRate = rates[fromCurrency] || 1;
  const copRate = rates['COP'] || 4200;

  if (fromCurrency === 'USD') {
    return amount * copRate;
  }

  // Convert fromCurrency -> USD -> COP
  const amountInUSD = amount / fromRate;
  return amountInUSD * copRate;
}

/**
 * Get exchange rate from currency to COP
 */
export async function getRateToCOP(currencyCode: string): Promise<number> {
  if (currencyCode === 'COP') {
    return 1;
  }

  const rates = await getExchangeRates();
  const fromRate = rates[currencyCode] || 1;
  const copRate = rates['COP'] || 4200;

  if (currencyCode === 'USD') {
    return copRate;
  }

  // Rate = COP_rate / fromCurrency_rate
  return copRate / fromRate;
}

/**
 * Update exchange rates in database for all user currencies
 */
export async function updateCurrencyRates(userId: string): Promise<void> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  try {
    const rates = await getExchangeRates();
    const copRate = rates['COP'] || 4200;

    // Get all currencies for this user
    const { data: currencies, error: fetchError } = await supabase
      .from('currencies')
      .select('id, code')
      .eq('user_id', userId);

    if (fetchError) throw fetchError;

    if (!currencies || currencies.length === 0) {
      return;
    }

    // Update each currency's exchange rate to COP
    for (const currency of currencies) {
      const rateToCOP = await getRateToCOP(currency.code);
      
      const { error: updateError } = await supabase
        .from('currencies')
        .update({
          exchange_rate_to_preferred: rateToCOP,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currency.id)
        .eq('user_id', userId);

      if (updateError) {
        console.error(`Error updating rate for ${currency.code}:`, updateError);
      }
    }
  } catch (error) {
    console.error('Error updating currency rates:', error);
    throw error;
  }
}

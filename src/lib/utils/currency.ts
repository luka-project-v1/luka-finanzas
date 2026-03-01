import Decimal from 'decimal.js';

/**
 * Format amount as currency with symbol
 */
export function formatCurrency(amount: number, symbol: string = '$', decimals: number = 2): string {
  const decimalValue = new Decimal(amount).toDecimalPlaces(decimals);
  const value = decimalValue.toNumber();
  // Check if decimal part is zero using Decimal.js for precision
  const hasDecimals = !decimalValue.mod(1).isZero();
  // Only show decimals if they exist and are non-zero
  const displayDecimals = hasDecimals ? decimals : 0;
  return `${symbol}${value.toLocaleString('es-CO', { 
    minimumFractionDigits: displayDecimals, 
    maximumFractionDigits: displayDecimals 
  })}`;
}

/**
 * Format amount in COP (Colombian Peso)
 */
export function formatCOP(amount: number, decimals: number = 0): string {
  const decimalValue = new Decimal(amount).toDecimalPlaces(decimals);
  const value = decimalValue.toNumber();
  // Check if decimal part is zero using Decimal.js for precision
  const hasDecimals = !decimalValue.mod(1).isZero();
  // Only show decimals if they exist and are non-zero
  const displayDecimals = hasDecimals ? decimals : 0;
  return `$${value.toLocaleString('es-CO', { 
    minimumFractionDigits: displayDecimals, 
    maximumFractionDigits: displayDecimals 
  })}`;
}

/**
 * Convert amount from one currency to another using exchange rates
 */
export function convertCurrency(
  amount: number,
  fromRate: number,
  toRate: number
): number {
  return new Decimal(amount)
    .times(fromRate)
    .dividedBy(toRate)
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * Convert an amount from one currency to another using a rate map.
 *
 * Rates are stored as "units of that currency per 1 USD" (the API base), e.g.:
 *   USD → 1      (1 USD = 1 USD)
 *   COP → 4200   (1 USD = 4200 COP)
 *
 * Formula: amount × (rateDest / rateOrigin)
 *   - COP → USD: 1_000_000 × (1 / 3761) ≈ 265.89 USD
 *   - USD → COP: 1_000    × (4200 / 1) = 4_200_000 COP
 *
 * Uses Decimal.js for full precision and to avoid floating-point errors.
 * Returns the original amount when both codes are the same.
 */
export function convertToBase(
  amount: number,
  fromCurrencyCode: string,
  toCurrencyCode: string,
  rateByCode: Map<string, number>
): number {
  if (fromCurrencyCode === toCurrencyCode) return amount;

  const rateOrigin = rateByCode.get(fromCurrencyCode) ?? 1;
  const rateDest = rateByCode.get(toCurrencyCode) ?? 1;

  if (rateOrigin === 0) return 0;

  // amount × (rateDest / rateOrigin) — e.g. COP→USD: monto × (1/3761)
  return new Decimal(amount)
    .times(rateDest)
    .dividedBy(rateOrigin)
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * Convert amount to COP using exchange rate
 */
export function convertToCOP(amount: number, exchangeRateToCOP: number): number {
  return new Decimal(amount)
    .times(exchangeRateToCOP)
    .toDecimalPlaces(0) // COP doesn't use decimals typically
    .toNumber();
}

/**
 * Add two amounts with precision
 */
export function addAmounts(...amounts: number[]): number {
  return amounts
    .reduce((acc, amount) => acc.plus(amount), new Decimal(0))
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * Subtract amounts with precision
 */
export function subtractAmounts(from: number, ...amounts: number[]): number {
  return amounts
    .reduce((acc, amount) => acc.minus(amount), new Decimal(from))
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * Multiply amount with precision
 */
export function multiplyAmount(amount: number, multiplier: number): number {
  return new Decimal(amount)
    .times(multiplier)
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * Calculate percentage of an amount
 */
export function calculatePercentage(amount: number, percentage: number): number {
  return new Decimal(amount)
    .times(percentage)
    .dividedBy(100)
    .toDecimalPlaces(2)
    .toNumber();
}

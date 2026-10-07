// All monetary amounts are stored/computed as integer minor units (cents) to avoid
// floating point rounding errors.

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatMoney(cents: number, currency: string, locale = "en-US"): string {
  const value = fromCents(cents);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

/**
 * Splits `total` (in cents) into `count` integer cent parts that sum exactly to
 * `total`. The leftover cents go to `remainder` consecutive parts starting at `offset`
 * (wrapping around), so callers can rotate who gets them instead of it always being
 * the first person.
 */
export function splitEvenly(total: number, count: number, offset = 0): number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, i) => {
    const rank = (((i - offset) % count) + count) % count;
    return base + (rank < remainder ? 1 : 0);
  });
}

export const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "CHF",
  "CNY",
  "INR",
  "MXN",
  "BRL",
  "SEK",
  "NOK",
  "AED",
] as const;

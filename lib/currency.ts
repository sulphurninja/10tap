/**
 * SMS-BUS OTP activation prices (`list/prices` → `cost`) are in USD.
 * Rental API amounts (`unit_price`, order `amount`) are in USD cents.
 * User-facing INR is computed in `lib/pricing.ts` from MongoDB `PricingSettings` (admin UI).
 * This module only seeds the **fallback** `usdInrRate` when the DB is empty; env vars are optional.
 */
const DEFAULT_USD_INR = 83;

export function getUsdInrRate(): number {
  const raw = process.env.USD_INR_RATE ?? process.env.NEXT_PUBLIC_USD_INR_RATE;
  const n = raw ? Number.parseFloat(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_USD_INR;
}

/** SMS-BUS activation price field: dollars (e.g. 0.76) */
export function smsbusUsdToInr(usd: number): number {
  const rate = getUsdInrRate();
  return Math.round(usd * rate * 100) / 100;
}

/** SMS-BUS rental amounts: integer USD cents */
export function smsbusUsdCentsToInr(cents: number): number {
  const usd = cents / 100;
  return smsbusUsdToInr(usd);
}

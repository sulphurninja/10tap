"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * All monetary values in the database are stored in **INR** (`user.walletBalance`,
 * `Transaction.amount`, product prices from `/api/numbers/prices`, etc.).
 *
 * The customer-facing UI displays everything in **USDT** (≈ USD via admin FX rate).
 */

export type DisplayCurrency = "USDT";
export const DISPLAY_CURRENCIES: DisplayCurrency[] = ["USDT"];
export const DEFAULT_DISPLAY_CURRENCY: DisplayCurrency = "USDT";
const STORAGE_KEY = "10tap.displayCurrency";

export interface PricingInfo {
  usdInrRate: number;
  cryptoTopupMarkupPercent: number;
}

export interface FormatOptions {
  /** Remove fractional component. */
  whole?: boolean;
  /** Decimal places (default 2). */
  decimals?: number;
  /** Hide "USDT" suffix, show only the number. */
  noSymbol?: boolean;
}

export interface CurrencyContextValue {
  currency: DisplayCurrency;
  setCurrency: (c: DisplayCurrency) => void;
  pricing: PricingInfo;
  pricingReady: boolean;
  /** Format an INR amount as USDT. */
  format: (inrAmount: number, opts?: FormatOptions) => string;
  /** INR → USDT number (no formatting). */
  convert: (inrAmount: number) => number;
  /** USDT number → INR (wallet debits/credits). */
  toInr: (usdtAmount: number) => number;
  symbol: string;
}

const FALLBACK_RATE = 83;
const FALLBACK_PRICING: PricingInfo = {
  usdInrRate: FALLBACK_RATE,
  cryptoTopupMarkupPercent: 0,
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function readStoredCurrency(): DisplayCurrency {
  if (typeof window === "undefined") return DEFAULT_DISPLAY_CURRENCY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "USDT") return "USDT";
    // Migrate legacy USD / INR preference.
    if (raw === "USD" || raw === "INR") {
      window.localStorage.setItem(STORAGE_KEY, "USDT");
      return "USDT";
    }
  } catch {
    // ignore
  }
  return DEFAULT_DISPLAY_CURRENCY;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency] = useState<DisplayCurrency>(DEFAULT_DISPLAY_CURRENCY);
  const [pricing, setPricing] = useState<PricingInfo>(FALLBACK_PRICING);
  const [pricingReady, setPricingReady] = useState(false);

  useEffect(() => {
    readStoredCurrency();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchPricing = async () => {
      try {
        const res = await fetch("/api/pricing/public", { cache: "no-store" });
        if (!res.ok) throw new Error("bad status");
        const json = (await res.json()) as {
          data?: { usdInrRate?: number; cryptoTopupMarkupPercent?: number };
        };
        if (cancelled) return;
        const rate = Number(json.data?.usdInrRate);
        const markup = Number(json.data?.cryptoTopupMarkupPercent);
        setPricing({
          usdInrRate: Number.isFinite(rate) && rate > 0 ? rate : FALLBACK_RATE,
          cryptoTopupMarkupPercent:
            Number.isFinite(markup) && markup >= 0 ? markup : 0,
        });
        setPricingReady(true);
      } catch {
        if (!cancelled) setPricingReady(true);
      }
    };
    void fetchPricing();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = useCallback((_c: DisplayCurrency) => {
    /* USDT-only — no-op for API compatibility */
  }, []);

  const convert = useCallback(
    (inrAmount: number) => {
      if (!Number.isFinite(inrAmount)) return 0;
      const rate = pricing.usdInrRate > 0 ? pricing.usdInrRate : FALLBACK_RATE;
      return inrAmount / rate;
    },
    [pricing.usdInrRate]
  );

  const toInr = useCallback(
    (usdtAmount: number) => {
      if (!Number.isFinite(usdtAmount)) return 0;
      return usdtAmount * (pricing.usdInrRate || FALLBACK_RATE);
    },
    [pricing.usdInrRate]
  );

  const format = useCallback(
    (inrAmount: number, opts?: FormatOptions) => {
      const converted = convert(inrAmount);
      const fractionDigits =
        typeof opts?.decimals === "number"
          ? opts.decimals
          : opts?.whole
            ? 0
            : 2;
      const absStr = Math.abs(converted).toLocaleString("en-US", {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      });
      const sign = converted < 0 ? "-" : "";
      if (opts?.noSymbol) return `${sign}${absStr}`;
      return `${sign}${absStr} USDT`;
    },
    [convert]
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      pricing,
      pricingReady,
      format,
      convert,
      toInr,
      symbol: "₮",
    }),
    [currency, setCurrency, pricing, pricingReady, format, convert, toInr]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    return {
      currency: "USDT",
      setCurrency: () => {},
      pricing: FALLBACK_PRICING,
      pricingReady: false,
      format: (inr: number) =>
        `${(inr / FALLBACK_RATE).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} USDT`,
      convert: (inr: number) => inr / FALLBACK_RATE,
      toInr: (v: number) => v * FALLBACK_RATE,
      symbol: "₮",
    };
  }
  return ctx;
}

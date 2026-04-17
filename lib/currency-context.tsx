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
 * This context lets the UI *display* those amounts in USD, INR, or USDT based
 * on a user-level preference persisted in `localStorage`. It also exposes the
 * server-configured FX rate and crypto top-up markup so components (especially
 * the wallet top-up dialog) can render accurate previews.
 */

export type DisplayCurrency = "USD" | "INR" | "USDT";
export const DISPLAY_CURRENCIES: DisplayCurrency[] = ["USD", "INR", "USDT"];
export const DEFAULT_DISPLAY_CURRENCY: DisplayCurrency = "USD";
const STORAGE_KEY = "10tap.displayCurrency";

export interface PricingInfo {
  usdInrRate: number;
  cryptoTopupMarkupPercent: number;
}

export interface FormatOptions {
  /** Override display currency for a single call (e.g. forced INR). */
  currency?: DisplayCurrency;
  /** Remove fractional component even for USD/USDT. */
  whole?: boolean;
  /** Always show decimals (USD/USDT default has 2dp, INR default has 0dp). */
  decimals?: number;
  /** Hide currency symbol/prefix, show only the number. */
  noSymbol?: boolean;
}

export interface CurrencyContextValue {
  currency: DisplayCurrency;
  setCurrency: (c: DisplayCurrency) => void;
  pricing: PricingInfo;
  /** True until the public pricing payload arrives from the server. */
  pricingReady: boolean;
  /** Format an INR amount in the currently-selected display currency. */
  format: (inrAmount: number, opts?: FormatOptions) => string;
  /** INR → display-currency number (no formatting). */
  convert: (inrAmount: number, target?: DisplayCurrency) => number;
  /** Display-currency number → INR. */
  toInr: (displayAmount: number, source?: DisplayCurrency) => number;
  /** Short symbol used in UI, e.g. "$", "₹", "₮". */
  symbol: string;
}

const FALLBACK_RATE = 83;
const FALLBACK_PRICING: PricingInfo = {
  usdInrRate: FALLBACK_RATE,
  cryptoTopupMarkupPercent: 0,
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function symbolFor(currency: DisplayCurrency): string {
  if (currency === "INR") return "₹";
  if (currency === "USDT") return "₮";
  return "$";
}

function readStoredCurrency(): DisplayCurrency {
  if (typeof window === "undefined") return DEFAULT_DISPLAY_CURRENCY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && (DISPLAY_CURRENCIES as string[]).includes(raw)) {
      return raw as DisplayCurrency;
    }
  } catch {
    // localStorage can be unavailable (private mode, SSR); fall through.
  }
  return DEFAULT_DISPLAY_CURRENCY;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>(
    DEFAULT_DISPLAY_CURRENCY
  );
  const [pricing, setPricing] = useState<PricingInfo>(FALLBACK_PRICING);
  const [pricingReady, setPricingReady] = useState(false);

  // Hydrate preference on mount (avoids SSR/client mismatch).
  useEffect(() => {
    setCurrencyState(readStoredCurrency());
  }, []);

  // Fetch live rate + crypto markup.
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

  const setCurrency = useCallback((c: DisplayCurrency) => {
    setCurrencyState(c);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, c);
      }
    } catch {
      // ignore
    }
  }, []);

  const convert = useCallback(
    (inrAmount: number, target?: DisplayCurrency) => {
      const t = target ?? currency;
      if (!Number.isFinite(inrAmount)) return 0;
      if (t === "INR") return inrAmount;
      const rate = pricing.usdInrRate > 0 ? pricing.usdInrRate : FALLBACK_RATE;
      return inrAmount / rate;
    },
    [currency, pricing.usdInrRate]
  );

  const toInr = useCallback(
    (displayAmount: number, source?: DisplayCurrency) => {
      const s = source ?? currency;
      if (!Number.isFinite(displayAmount)) return 0;
      if (s === "INR") return displayAmount;
      return displayAmount * (pricing.usdInrRate || FALLBACK_RATE);
    },
    [currency, pricing.usdInrRate]
  );

  const format = useCallback(
    (inrAmount: number, opts?: FormatOptions) => {
      const target = opts?.currency ?? currency;
      const converted = convert(inrAmount, target);

      const fractionDigits =
        typeof opts?.decimals === "number"
          ? opts.decimals
          : opts?.whole
          ? 0
          : target === "INR"
          ? 0
          : 2;

      const absStr = Math.abs(converted).toLocaleString(
        target === "INR" ? "en-IN" : "en-US",
        {
          minimumFractionDigits: fractionDigits,
          maximumFractionDigits: fractionDigits,
        }
      );

      const sign = converted < 0 ? "-" : "";
      if (opts?.noSymbol) {
        return `${sign}${absStr}`;
      }
      if (target === "INR") {
        return `${sign}₹${absStr}`;
      }
      if (target === "USDT") {
        return `${sign}${absStr} USDT`;
      }
      return `${sign}$${absStr}`;
    },
    [currency, convert]
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
      symbol: symbolFor(currency),
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
    // Graceful fallback when used outside a provider (e.g. on the landing page).
    return {
      currency: "INR",
      setCurrency: () => {},
      pricing: FALLBACK_PRICING,
      pricingReady: false,
      format: (inr: number) =>
        `₹${inr.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
      convert: (inr: number) => inr,
      toInr: (v: number) => v,
      symbol: "₹",
    };
  }
  return ctx;
}

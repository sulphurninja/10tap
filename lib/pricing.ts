import { connectDB } from "@/lib/db";
import {
  PricingSettings,
  type IPricingSettings,
  type MarkupRule,
  type MarkupKind,
} from "@/models/PricingSettings";
import { getUsdInrRate } from "@/lib/currency";

const DEFAULT_MARKUP: MarkupRule = { type: "percent", value: 0 };

/**
 * How rates work:
 * 1. SMS-BUS sends **USD** (OTP `cost`) or **USD cents** (rentals).
 * 2. We multiply by **usdInrRate** (admin-configurable, stored in MongoDB; env is fallback when seeding).
 * 3. We apply **global** markup (% or fixed ₹) for OTP or rental separately.
 * 4. We apply **per-service** (OTP) or **per-area** (rental) markup on top, if configured.
 */
export function applyMarkupRule(inr: number, rule: MarkupRule): number {
  if (!rule || rule.value === 0) return round2(inr);
  if (rule.type === "percent") {
    return round2(inr * (1 + rule.value / 100));
  }
  return round2(inr + rule.value);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function getPricingSettings(): Promise<IPricingSettings> {
  await connectDB();
  let doc = await PricingSettings.findOne().sort({ updatedAt: -1 });
  if (!doc) {
    const fallbackRate = getUsdInrRate();
    doc = await PricingSettings.create({
      usdInrRate: fallbackRate,
      globalOtpMarkup: { ...DEFAULT_MARKUP },
      globalRentalMarkup: { ...DEFAULT_MARKUP },
      otpServiceMarkups: [],
      rentalAreaMarkups: [],
    });
  }
  return doc;
}

/** OTP activation: USD (dollars) from SMS-BUS → final INR for wallet */
export function priceOtpInr(settings: IPricingSettings, usd: number, projectId: number): number {
  let inr = usd * settings.usdInrRate;
  inr = applyMarkupRule(inr, settings.globalOtpMarkup ?? DEFAULT_MARKUP);
  const row = settings.otpServiceMarkups?.find((s) => s.projectId === projectId);
  if (row?.markup) {
    inr = applyMarkupRule(inr, row.markup);
  }
  return round2(inr);
}

/** Rental: `unit_price` / order amounts are USD cents from SMS-BUS */
export function priceRentalInrFromCents(settings: IPricingSettings, usdCents: number, areaCode: string): number {
  const usd = usdCents / 100;
  let inr = usd * settings.usdInrRate;
  inr = applyMarkupRule(inr, settings.globalRentalMarkup ?? DEFAULT_MARKUP);
  const code = areaCode.trim().toUpperCase();
  const row = settings.rentalAreaMarkups?.find((a) => a.areaCode === code);
  if (row?.markup) {
    inr = applyMarkupRule(inr, row.markup);
  }
  return round2(inr);
}

export function emptyMarkup(kind: MarkupKind = "percent"): MarkupRule {
  return { type: kind, value: 0 };
}

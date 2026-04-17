import { NextResponse } from "next/server";
import { getPricingSettings } from "@/lib/pricing";

/**
 * Public, read-only view of the pricing parameters that the client needs for
 * display-currency conversion and crypto top-up previews.
 *
 * We only expose the USD→INR rate and the crypto top-up markup. Nothing else
 * from PricingSettings (per-service markups, upstream costs, etc.) is leaked.
 */
export async function GET() {
  try {
    const s = await getPricingSettings();
    return NextResponse.json(
      {
        success: true,
        data: {
          usdInrRate: s.usdInrRate,
          cryptoTopupMarkupPercent: s.cryptoTopupMarkupPercent ?? 0,
        },
      },
      {
        headers: {
          // Rate changes are rare; let the browser cache for a minute.
          "Cache-Control": "public, max-age=60, s-maxage=60",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

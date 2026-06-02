import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Transaction } from "@/models/Transaction";
import { getPricingSettings } from "@/lib/pricing";
import {
  buildHostedCheckoutUrl,
  getCloudpayaApiKey,
} from "@/lib/cloudpaya";

/** USDT only (TRC-20 — cheapest & fastest stablecoin rail). */
const CRYPTO_CODE = "USDT_TRC20";

/**
 * Create a crypto top-up.
 *
 * Request shape (flexible):
 *   { amount_usd?: number, amount_inr?: number, amount?: number }
 *
 * - `amount_usd` is the **credit amount** the user wants added to their
 *   wallet (in USD). CloudPaya is invoiced for
 *   `amount_usd × (1 + cryptoTopupMarkupPercent/100)`.
 * - `amount_inr` / `amount` is back-converted via the admin FX rate.
 *
 * We then redirect the user to CloudPaya's hosted checkout page with a
 * per-transaction unique `checkout_id` so the amount is honoured verbatim.
 */

const MIN_USD = 1;
const MIN_INR = 50;

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!getCloudpayaApiKey()) {
      return NextResponse.json(
        {
          success: false,
          error: "Crypto payments are not configured on the server",
        },
        { status: 503 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      amount_usd?: unknown;
      amount_inr?: unknown;
      amount?: unknown;
    } | null;

    const settings = await getPricingSettings();
    const rate =
      Number.isFinite(settings.usdInrRate) && settings.usdInrRate > 0
        ? settings.usdInrRate
        : 83;
    const markupPct = Math.max(
      0,
      Math.min(50, Number(settings.cryptoTopupMarkupPercent ?? 0))
    );

    // Resolve the base USD amount the user wants credited.
    let baseUsd: number | null = null;
    if (body?.amount_usd !== undefined) {
      const v = Number(body.amount_usd);
      if (!Number.isFinite(v) || v < MIN_USD) {
        return NextResponse.json(
          { success: false, error: `Amount must be at least ${MIN_USD} USDT` },
          { status: 400 }
        );
      }
      baseUsd = Math.round(v * 100) / 100;
    } else {
      const rawInr = body?.amount_inr ?? body?.amount;
      const v = Number(rawInr);
      if (!Number.isFinite(v) || v < MIN_INR) {
        return NextResponse.json(
          { success: false, error: `Amount must be at least ₹${MIN_INR}` },
          { status: 400 }
        );
      }
      baseUsd = Math.round((v / rate) * 100) / 100;
      if (baseUsd < MIN_USD) {
        return NextResponse.json(
          {
            success: false,
            error: `Amount must be at least ${MIN_USD} USDT`,
          },
          { status: 400 }
        );
      }
    }

    const chargedUsd = Math.round(baseUsd * (1 + markupPct / 100) * 100) / 100;
    const creditedInr = Math.round(baseUsd * rate * 100) / 100;

    const tx = await Transaction.create({
      userId: session.userId,
      type: "credit",
      amount: creditedInr,
      description: `Wallet top-up (USDT, $${baseUsd.toFixed(2)})`,
      method: "cloudpaya",
      cloudpayaUsdAmount: chargedUsd,
      cloudpayaCryptocurrency: CRYPTO_CODE,
      status: "pending",
    });

    const origin = (
      process.env.NEXT_PUBLIC_APP_URL ||
      request.nextUrl.origin ||
      "https://10tapdemo.vercel.app"
    ).replace(/\/$/, "");
    const redirectUrl = `${origin}/dashboard/wallet?cp=pending&tx=${tx._id.toString()}`;

    const checkoutUrl = buildHostedCheckoutUrl({
      txId: tx._id.toString(),
      priceUsd: chargedUsd,
      cryptocurrencyCode: CRYPTO_CODE,
      externalReference: tx._id.toString(),
      redirectUrl,
      title: `10tap wallet top-up ($${baseUsd.toFixed(2)})`,
    });

    return NextResponse.json({
      success: true,
      data: {
        transactionId: tx._id.toString(),
        baseUsd,
        chargedUsd,
        creditedInr,
        usdInrRate: rate,
        cryptoTopupMarkupPercent: markupPct,
        checkoutUrl,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

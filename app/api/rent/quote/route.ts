import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { smsbusRent } from "@/lib/smsbus-rent";
import { getPricingSettings, priceRentalInrFromCents } from "@/lib/pricing";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const area_code = searchParams.get("area_code");
    const monthsRaw = searchParams.get("months");
    if (!area_code || !monthsRaw) {
      return NextResponse.json({ success: false, error: "area_code and months required" }, { status: 400 });
    }
    const m = Number(monthsRaw);
    if (!Number.isFinite(m) || m < 1 || m > 24) {
      return NextResponse.json({ success: false, error: "invalid months" }, { status: 400 });
    }

    const [areas, settings] = await Promise.all([smsbusRent.listAreas(), getPricingSettings()]);
    if (areas.code !== 200 || !areas.data) {
      return NextResponse.json({ success: false, error: "Could not load areas" }, { status: 400 });
    }
    const area = areas.data.find((a) => a.area_code.toUpperCase() === area_code.toUpperCase());
    if (!area) {
      return NextResponse.json({ success: false, error: "Invalid area" }, { status: 400 });
    }
    if (m < area.min_month) {
      return NextResponse.json(
        { success: false, error: `Minimum rental is ${area.min_month} month(s)` },
        { status: 400 }
      );
    }

    const totalUsdCents = area.unit_price * m;
    const amountInr = priceRentalInrFromCents(settings, totalUsdCents, area.area_code);
    const monthlyInr = priceRentalInrFromCents(settings, area.unit_price, area.area_code);

    return NextResponse.json({
      success: true,
      data: { amountInr, monthlyInr, totalUsd: totalUsdCents / 100, area_title: area.area_title },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

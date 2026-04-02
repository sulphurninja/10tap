import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { smsbusRent } from "@/lib/smsbus-rent";
import { getPricingSettings, priceRentalInrFromCents } from "@/lib/pricing";

export async function GET() {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const res = await smsbusRent.listAreas();
    if (res.code !== 200 || !res.data) {
      return NextResponse.json(
        { success: false, error: res.message || "Rental areas unavailable", data: res },
        { status: 400 }
      );
    }

    const settings = await getPricingSettings();
    const enriched = res.data.map((a) => ({
      ...a,
      unit_price_inr: priceRentalInrFromCents(settings, a.unit_price, a.area_code),
    }));

    return NextResponse.json({ success: true, data: { code: 200, message: res.message, data: enriched } });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

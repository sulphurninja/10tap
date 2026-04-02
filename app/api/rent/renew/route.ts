import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";
import { RentalOrder } from "@/models/RentalOrder";
import { smsbusRent } from "@/lib/smsbus-rent";
import { getPricingSettings, priceRentalInrFromCents } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { area_code, mobile_number, months } = body as {
      area_code?: string;
      mobile_number?: string;
      months?: number;
    };

    if (!area_code || !mobile_number) {
      return NextResponse.json({ success: false, error: "area_code and mobile_number required" }, { status: 400 });
    }
    const m = Number(months);
    if (!Number.isFinite(m) || m < 1 || m > 24) {
      return NextResponse.json({ success: false, error: "months must be 1–24" }, { status: 400 });
    }

    const [areas, settings] = await Promise.all([smsbusRent.listAreas(), getPricingSettings()]);
    if (areas.code !== 200 || !areas.data) {
      return NextResponse.json({ success: false, error: "Could not load rental areas" }, { status: 400 });
    }
    const area = areas.data.find((a) => a.area_code.toUpperCase() === area_code.toUpperCase());
    if (!area) {
      return NextResponse.json({ success: false, error: "Invalid area" }, { status: 400 });
    }
    if (m < area.min_month) {
      return NextResponse.json(
        { success: false, error: `Minimum renewal is ${area.min_month} month(s)` },
        { status: 400 }
      );
    }

    const totalUsdCents = area.unit_price * m;
    const amountInr = priceRentalInrFromCents(settings, totalUsdCents, area.area_code);

    const user = await User.findById(session.userId);
    if (!user || user.walletBalance < amountInr) {
      return NextResponse.json({ success: false, error: "Insufficient wallet balance" }, { status: 400 });
    }

    const debit = await User.findOneAndUpdate(
      { _id: session.userId, walletBalance: { $gte: amountInr } },
      { $inc: { walletBalance: -amountInr } },
      { new: true }
    );
    if (!debit) {
      return NextResponse.json({ success: false, error: "Insufficient wallet balance" }, { status: 400 });
    }

    const api = await smsbusRent.renew(area_code, mobile_number.replace(/\D/g, ""), m);

    if (api.code !== 200 || !api.data) {
      await User.findByIdAndUpdate(session.userId, { $inc: { walletBalance: amountInr } });
      return NextResponse.json(
        { success: false, error: api.message || "Renewal failed", data: api },
        { status: 400 }
      );
    }

    const d = api.data;
    await Transaction.create({
      userId: session.userId,
      type: "debit",
      amount: amountInr,
      description: `Rental renewal — ${area.area_title} (${m} mo)`,
      status: "completed",
    });

    await RentalOrder.create({
      userId: session.userId,
      orderId: d.order_id,
      areaCode: d.area_code,
      areaName: area.area_title,
      dialingCode: d.dialing_code,
      mobileNumber: d.mobile_number,
      months: m,
      amountInr,
      amountUsdCents: totalUsdCents,
      status: "active",
      expireAt: new Date(d.expire_at),
      keepAt: new Date(d.keep_at),
    });

    return NextResponse.json({ success: true, data: { order: api.data, amountInr } });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

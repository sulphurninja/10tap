import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";
import { Order } from "@/models/Order";
import { smsbus } from "@/lib/smsbus";
import { getPricingSettings, priceOtpInr } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      country_id,
      project_id,
      country_name,
      country_code,
      project_name,
      cost,
    } = body as {
      country_id?: number;
      project_id?: number;
      country_name?: string;
      country_code?: string;
      project_name?: string;
      cost?: number;
    };

    if (
      country_id === undefined ||
      country_id === null ||
      project_id === undefined ||
      project_id === null ||
      !country_name ||
      !country_code ||
      !project_name ||
      cost === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "country_id, project_id, country_name, country_code, project_name, and cost are required" },
        { status: 400 }
      );
    }

    const countryIdNum = Number(country_id);
    const projectIdNum = Number(project_id);
    if (!Number.isFinite(countryIdNum) || !Number.isFinite(projectIdNum)) {
      return NextResponse.json({ success: false, error: "Invalid country_id or project_id" }, { status: 400 });
    }

    const costNum = Number(cost);
    if (!Number.isFinite(costNum) || costNum <= 0) {
      return NextResponse.json({ success: false, error: "Invalid cost" }, { status: 400 });
    }

    const [priceCheck, settings] = await Promise.all([
      smsbus.getPrices(countryIdNum),
      getPricingSettings(),
    ]);
    if (priceCheck.code !== 200 || !priceCheck.data) {
      return NextResponse.json({ success: false, error: "Could not verify price" }, { status: 400 });
    }
    let expectedInr: number | null = null;
    for (const p of Object.values(priceCheck.data)) {
      if (p.project_id === projectIdNum) {
        expectedInr = priceOtpInr(settings, p.cost, projectIdNum);
        break;
      }
    }
    if (expectedInr === null) {
      return NextResponse.json({ success: false, error: "Service not available for this country" }, { status: 400 });
    }
    if (Math.abs(costNum - expectedInr) > 0.5) {
      return NextResponse.json(
        { success: false, error: "Price changed — refresh and try again", data: { expectedInr } },
        { status: 400 }
      );
    }

    const user = await User.findById(session.userId);
    if (!user || user.walletBalance < costNum) {
      return NextResponse.json({ success: false, error: "Insufficient wallet balance" }, { status: 400 });
    }

    const smsResult = await smsbus.getNumber(countryIdNum, projectIdNum);
    if (smsResult.code !== 200 || !smsResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: smsResult.message || "Failed to get number",
          data: smsResult,
        },
        { status: 400 }
      );
    }

    const updated = await User.findOneAndUpdate(
      { _id: session.userId, walletBalance: { $gte: costNum } },
      { $inc: { walletBalance: -costNum } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Insufficient wallet balance" }, { status: 400 });
    }

    await Transaction.create({
      userId: session.userId,
      type: "debit",
      amount: costNum,
      description: `Number purchase — ${project_name} (${country_name})`,
      status: "completed",
    });

    const requestIdStr = String(smsResult.data.request_id);
    const order = await Order.create({
      userId: session.userId,
      requestId: requestIdStr,
      countryId: countryIdNum,
      countryName: country_name,
      countryCode: country_code,
      projectId: projectIdNum,
      projectName: project_name,
      number: smsResult.data.number,
      cost: costNum,
      status: "pending",
    });

    return NextResponse.json({ success: true, data: { order: order.toObject() } });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

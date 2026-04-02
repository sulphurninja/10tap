import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Order } from "@/models/Order";
import { smsbus } from "@/lib/smsbus";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("request_id");
    if (!requestId) {
      return NextResponse.json({ success: false, error: "request_id is required" }, { status: 400 });
    }

    const order = await Order.findOne({
      requestId,
      userId: session.userId,
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const result = await smsbus.getSms(requestId);

    if (result.code === 200 && result.data !== undefined && result.data !== null) {
      order.smsCode = String(result.data);
      order.status = "completed";
      await order.save();
    }

    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

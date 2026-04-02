import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { User } from "@/models/User";
import { Order } from "@/models/Order";
import { Transaction } from "@/models/Transaction";
import { smsbus } from "@/lib/smsbus";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { request_id } = body as { request_id?: string | number };

    if (request_id === undefined || request_id === null || request_id === "") {
      return NextResponse.json({ success: false, error: "request_id is required" }, { status: 400 });
    }

    const requestIdStr = String(request_id);

    const order = await Order.findOne({
      requestId: requestIdStr,
      userId: session.userId,
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (order.status === "cancelled") {
      return NextResponse.json({ success: true, data: { message: "Already cancelled" } });
    }

    const result = await smsbus.cancelRequest(requestIdStr);

    if (result.code !== 200) {
      return NextResponse.json(
        { success: false, error: result.message || "Failed to cancel request", data: result },
        { status: 400 }
      );
    }

    order.status = "cancelled";
    await order.save();

    const refund = order.cost;
    await User.findByIdAndUpdate(session.userId, { $inc: { walletBalance: refund } });

    await Transaction.create({
      userId: session.userId,
      type: "credit",
      amount: refund,
      description: `Refund — cancelled order ${requestIdStr}`,
      status: "completed",
    });

    return NextResponse.json({ success: true, data: { message: "Order cancelled and wallet refunded" } });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

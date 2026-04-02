import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";
import { RentalOrder } from "@/models/RentalOrder";
import { smsbusRent } from "@/lib/smsbus-rent";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { order_id } = body as { order_id?: string };
    if (!order_id) {
      return NextResponse.json({ success: false, error: "order_id required" }, { status: 400 });
    }

    const local = await RentalOrder.findOne({ userId: session.userId, orderId: order_id });
    const api = await smsbusRent.cancelOrder(order_id);

    if (api.code !== 200) {
      return NextResponse.json(
        { success: false, error: api.message || "Cancel failed", data: api },
        { status: 400 }
      );
    }

    if (local) {
      await User.findByIdAndUpdate(session.userId, { $inc: { walletBalance: local.amountInr } });
      await Transaction.create({
        userId: session.userId,
        type: "credit",
        amount: local.amountInr,
        description: `Rental cancelled — refund order ${order_id}`,
        status: "completed",
      });
      local.status = "cancelled";
      await local.save();
    }

    return NextResponse.json({ success: true, data: api });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

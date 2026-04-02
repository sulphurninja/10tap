import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Transaction } from "@/models/Transaction";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount < 50) {
      return NextResponse.json(
        { success: false, error: "Amount must be at least ₹50 (INR)" },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const tx = await Transaction.create({
      userId: session.userId,
      type: "credit",
      amount,
      description: "Wallet top-up",
      status: "pending",
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: tx._id.toString(),
    });

    await Transaction.findByIdAndUpdate(tx._id, { razorpayOrderId: order.id });

    const updated = await Transaction.findById(tx._id).lean();

    return NextResponse.json({
      success: true,
      data: {
        razorpayOrder: order,
        transaction: updated,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

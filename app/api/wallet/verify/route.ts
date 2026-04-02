import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transaction_id,
    } = body as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      transaction_id?: string;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !transaction_id) {
      return NextResponse.json(
        { success: false, error: "Missing payment verification fields" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(transaction_id)) {
      return NextResponse.json({ success: false, error: "Invalid transaction" }, { status: 400 });
    }

    const tx = await Transaction.findOne({
      _id: transaction_id,
      userId: session.userId,
    });

    if (!tx || tx.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Transaction not found or already processed" },
        { status: 400 }
      );
    }

    const hmacBody = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(hmacBody)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, error: "Invalid payment signature" }, { status: 400 });
    }

    if (tx.razorpayOrderId && tx.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json({ success: false, error: "Order mismatch" }, { status: 400 });
    }

    tx.status = "completed";
    tx.razorpayPaymentId = razorpay_payment_id;
    tx.razorpayOrderId = razorpay_order_id;
    await tx.save();

    const user = await User.findByIdAndUpdate(
      session.userId,
      { $inc: { walletBalance: tx.amount } },
      { new: true }
    ).select("walletBalance");

    return NextResponse.json({
      success: true,
      data: { walletBalance: user?.walletBalance ?? 0 },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

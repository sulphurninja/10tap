import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, amount, reason } = body as {
      userId?: string;
      amount?: number;
      reason?: string;
    };

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt === 0) {
      return NextResponse.json(
        { success: false, error: "amount must be a non-zero number (positive to add, negative to deduct)" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const newBalance = user.walletBalance + amt;
    if (newBalance < 0) {
      return NextResponse.json(
        { success: false, error: `Cannot deduct ₹${Math.abs(amt)} — user only has ₹${user.walletBalance}` },
        { status: 400 }
      );
    }

    user.walletBalance = newBalance;
    await user.save();

    const desc = reason?.trim()
      ? `Admin: ${reason.trim()}`
      : amt > 0
        ? "Admin wallet credit"
        : "Admin wallet deduction";

    await Transaction.create({
      userId: user._id,
      type: amt > 0 ? "credit" : "debit",
      amount: Math.abs(amt),
      description: desc,
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        newBalance: user.walletBalance,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

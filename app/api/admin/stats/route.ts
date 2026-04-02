import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { User } from "@/models/User";
import { Order } from "@/models/Order";
import { Transaction } from "@/models/Transaction";

export async function GET() {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const [totalUsers, totalOrders, revenueAgg, totalActiveOrders] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Transaction.aggregate<{ total: number }>([
        { $match: { type: "credit", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Order.countDocuments({ status: "pending" }),
    ]);

    const totalRevenue = revenueAgg[0]?.total ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalOrders,
        totalRevenue,
        totalActiveOrders,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

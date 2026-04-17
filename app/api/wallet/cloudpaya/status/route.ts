import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { fetchCloudpayaTransaction } from "@/lib/cloudpaya";

/**
 * Lets the user (or our wallet page) force a status re-check against
 * CloudPaya for a pending crypto top-up and credit the wallet if complete.
 * Useful when the browser redirects back from pay.php before the webhook
 * has arrived.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      transaction_id?: unknown;
    } | null;
    const transactionId =
      typeof body?.transaction_id === "string" ? body.transaction_id : "";

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return NextResponse.json(
        { success: false, error: "Invalid transaction" },
        { status: 400 }
      );
    }

    const tx = await Transaction.findOne({
      _id: transactionId,
      userId: session.userId,
      method: "cloudpaya",
      type: "credit",
    });
    if (!tx) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (tx.status === "completed") {
      const user = await User.findById(session.userId).select("walletBalance");
      return NextResponse.json({
        success: true,
        data: {
          status: tx.status,
          walletBalance: user?.walletBalance ?? 0,
        },
      });
    }

    if (!tx.cloudpayaTransactionId) {
      return NextResponse.json({
        success: true,
        data: { status: tx.status },
      });
    }

    const remote = await fetchCloudpayaTransaction(tx.cloudpayaTransactionId);
    if (!remote) {
      return NextResponse.json({
        success: true,
        data: { status: tx.status },
      });
    }

    if (remote.status === "C" && tx.status !== "completed") {
      tx.status = "completed";
      if (remote.cryptocurrency && !tx.cloudpayaCryptocurrency) {
        tx.cloudpayaCryptocurrency = remote.cryptocurrency;
      }
      await tx.save();

      const user = await User.findByIdAndUpdate(
        session.userId,
        { $inc: { walletBalance: tx.amount } },
        { new: true }
      ).select("walletBalance");

      return NextResponse.json({
        success: true,
        data: {
          status: "completed",
          walletBalance: user?.walletBalance ?? 0,
        },
      });
    }

    if ((remote.status === "X" || remote.status === "R") && tx.status === "pending") {
      tx.status = "failed";
      await tx.save();
    }

    return NextResponse.json({
      success: true,
      data: { status: tx.status },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

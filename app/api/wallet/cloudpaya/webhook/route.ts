import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import {
  type CloudpayaStatus,
  type CloudpayaWebhookTransaction,
  getCloudpayaWebhookSecret,
  fetchCloudpayaTransaction,
} from "@/lib/cloudpaya";

/**
 * CloudPaya webhook.
 *
 * Body: JSON — CloudPaya has shipped at least two shapes, we accept both:
 *
 *   a) Nested (older):  { transaction: { id, status, external_reference, … } }
 *   b) Flat   (newer):  { id, status, external_reference, cryptocurrency_code, … }
 *
 * Signature: hex HMAC-SHA256 of the **raw body** using the webhook secret.
 * Header name is `X-Signature` (older) or `X-Boxcoin-Signature` (newer) —
 * check both.
 *
 * Status codes: P = Pending, C = Completed, R = Refunded, X = Cancelled.
 * We only credit the user when status === "C" and the transaction isn't
 * already completed.
 */
export async function POST(request: NextRequest) {
  try {
    const secret = getCloudpayaWebhookSecret();
    if (!secret) {
      return NextResponse.json(
        { success: false, error: "Webhook not configured" },
        { status: 503 }
      );
    }

    const rawBody = await request.text();
    const signatureHeader =
      request.headers.get("x-boxcoin-signature") ||
      request.headers.get("x-signature") ||
      "";

    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const signatureBuf = Buffer.from(signatureHeader.trim(), "utf8");
    const expectedBuf = Buffer.from(expected, "utf8");
    if (
      signatureBuf.length === 0 ||
      signatureBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(signatureBuf, expectedBuf)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const txData = normalizeWebhookTransaction(parsed);
    if (!txData?.id || !txData?.status) {
      return NextResponse.json(
        { success: false, error: "Malformed payload" },
        { status: 400 }
      );
    }

    await connectDB();

    // Locate our internal Transaction: prefer external_reference (our Mongo
    // id), fall back to the CloudPaya numeric id stored at create time.
    const tx = await findLocalTransaction({
      externalRef: txData.external_reference,
      cloudpayaId: String(txData.id),
    });
    if (!tx) {
      return NextResponse.json({ success: true, ignored: true });
    }

    if (!tx.cloudpayaTransactionId) {
      tx.cloudpayaTransactionId = String(txData.id);
    }
    if (txData.cryptocurrency && !tx.cloudpayaCryptocurrency) {
      tx.cloudpayaCryptocurrency = txData.cryptocurrency;
    }

    if (txData.status === "C") {
      if (tx.status === "completed") {
        return NextResponse.json({ success: true, alreadyCredited: true });
      }

      // Defensive: re-fetch from CloudPaya to confirm the status.
      const confirmed = await fetchCloudpayaTransaction(String(txData.id));
      if (confirmed && confirmed.status !== "C") {
        return NextResponse.json({
          success: true,
          note: "Mismatched remote status",
        });
      }

      tx.status = "completed";
      await tx.save();

      await User.findByIdAndUpdate(tx.userId, {
        $inc: { walletBalance: tx.amount },
      });

      return NextResponse.json({ success: true, credited: true });
    }

    if (txData.status === "X" || txData.status === "R") {
      if (tx.status === "pending") {
        tx.status = "failed";
        await tx.save();
      }
      return NextResponse.json({ success: true, cancelled: true });
    }

    await tx.save();
    return NextResponse.json({ success: true, pending: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function findLocalTransaction(opts: {
  externalRef?: string;
  cloudpayaId: string;
}) {
  const baseFilter = { method: "cloudpaya", type: "credit" } as const;

  if (
    opts.externalRef &&
    mongoose.Types.ObjectId.isValid(opts.externalRef)
  ) {
    const byRef = await Transaction.findOne({
      _id: opts.externalRef,
      ...baseFilter,
    });
    if (byRef) return byRef;
  }

  if (opts.cloudpayaId) {
    const byId = await Transaction.findOne({
      cloudpayaTransactionId: opts.cloudpayaId,
      ...baseFilter,
    });
    if (byId) return byId;
  }

  return null;
}

/**
 * Flatten the variety of webhook body shapes CloudPaya ships so the rest of
 * the handler can work against a single canonical record.
 */
function normalizeWebhookTransaction(
  parsed: unknown
): CloudpayaWebhookTransaction | null {
  if (!parsed || typeof parsed !== "object") return null;
  const root = parsed as Record<string, unknown>;

  const inner =
    root.transaction && typeof root.transaction === "object"
      ? (root.transaction as Record<string, unknown>)
      : root;

  const id = inner.id ?? inner.transaction_id;
  const status = inner.status;
  if (id === undefined || !isStatus(status)) return null;

  const pickStr = (k: string) => {
    const v = inner[k];
    return typeof v === "string" ? v : undefined;
  };

  return {
    id: String(id),
    status: status as CloudpayaStatus,
    amount: String(inner.amount ?? inner.cryptocurrency_amount ?? ""),
    amount_fiat: String(inner.amount_fiat ?? inner.amount ?? ""),
    cryptocurrency: String(
      inner.cryptocurrency ?? inner.cryptocurrency_code ?? ""
    ),
    currency: String(inner.currency ?? inner.currency_code ?? "USD"),
    external_reference: pickStr("external_reference"),
    title: pickStr("title"),
    hash: pickStr("hash"),
    from: pickStr("from"),
    to: pickStr("to"),
    creation_time: pickStr("creation_time"),
    confirmations:
      typeof inner.confirmations === "number" ||
      typeof inner.confirmations === "string"
        ? (inner.confirmations as number | string)
        : undefined,
  };
}

function isStatus(v: unknown): v is CloudpayaStatus {
  return v === "P" || v === "C" || v === "R" || v === "X";
}

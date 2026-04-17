import mongoose, { Schema, type Document } from "mongoose";

export type TransactionMethod = "razorpay" | "cloudpaya" | "internal";

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: "credit" | "debit";
  amount: number;
  description: string;
  method?: TransactionMethod;

  razorpayPaymentId?: string;
  razorpayOrderId?: string;

  /** CloudPaya transaction id (as string) if the top-up uses crypto */
  cloudpayaTransactionId?: string;
  /** Cryptocurrency code chosen by the user on CloudPaya (e.g. usdt_tron) */
  cloudpayaCryptocurrency?: string;
  /** USD amount we asked CloudPaya to invoice */
  cloudpayaUsdAmount?: number;

  status: "pending" | "completed" | "failed";
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    method: { type: String, enum: ["razorpay", "cloudpaya", "internal"] },

    razorpayPaymentId: { type: String },
    razorpayOrderId: { type: String },

    cloudpayaTransactionId: { type: String, index: true },
    cloudpayaCryptocurrency: { type: String },
    cloudpayaUsdAmount: { type: Number },

    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  },
  { timestamps: true }
);

export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);

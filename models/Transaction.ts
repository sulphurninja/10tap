import mongoose, { Schema, type Document } from "mongoose";

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: "credit" | "debit";
  amount: number;
  description: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  status: "pending" | "completed" | "failed";
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpayOrderId: { type: String },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  },
  { timestamps: true }
);

export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);

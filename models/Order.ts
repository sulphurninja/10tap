import mongoose, { Schema, type Document } from "mongoose";

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  requestId: string;
  countryId: number;
  countryName: string;
  countryCode: string;
  projectId: number;
  projectName: string;
  number: string;
  smsCode?: string;
  status: "pending" | "completed" | "cancelled" | "expired";
  cost: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    requestId: { type: String, required: true, unique: true },
    countryId: { type: Number, required: true },
    countryName: { type: String, required: true },
    countryCode: { type: String, required: true },
    projectId: { type: Number, required: true },
    projectName: { type: String, required: true },
    number: { type: String, required: true },
    smsCode: { type: String },
    status: { type: String, enum: ["pending", "completed", "cancelled", "expired"], default: "pending" },
    cost: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

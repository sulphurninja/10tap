import mongoose, { Schema, type Document } from "mongoose";

export interface IRentalOrder extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId: string;
  areaCode: string;
  areaName: string;
  dialingCode: string;
  mobileNumber: string;
  months: number;
  amountInr: number;
  amountUsdCents: number;
  status: "active" | "cancelled" | "expired";
  expireAt?: Date;
  keepAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RentalOrderSchema = new Schema<IRentalOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderId: { type: String, required: true, unique: true },
    areaCode: { type: String, required: true },
    areaName: { type: String, required: true },
    dialingCode: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    months: { type: Number, required: true },
    amountInr: { type: Number, required: true },
    amountUsdCents: { type: Number, required: true },
    status: { type: String, enum: ["active", "cancelled", "expired"], default: "active" },
    expireAt: { type: Date },
    keepAt: { type: Date },
  },
  { timestamps: true }
);

export const RentalOrder =
  mongoose.models.RentalOrder || mongoose.model<IRentalOrder>("RentalOrder", RentalOrderSchema);

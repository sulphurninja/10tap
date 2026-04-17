import mongoose, { Schema, type Document } from "mongoose";

export interface IContactMessage extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  subject?: string;
  message: string;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    subject: { type: String, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

export const ContactMessage =
  mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);

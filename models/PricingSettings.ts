import mongoose, { Schema, type Document } from "mongoose";

export type MarkupKind = "percent" | "fixed_inr";

export interface MarkupRule {
  type: MarkupKind;
  /** Percent: e.g. 12 = +12%. Fixed: rupees added after prior steps. */
  value: number;
}

export interface IOtpServiceMarkup {
  projectId: number;
  markup: MarkupRule;
}

export interface IRentalAreaMarkup {
  areaCode: string;
  markup: MarkupRule;
}

export interface IPricingSettings extends Document {
  _id: mongoose.Types.ObjectId;
  /** USD → INR before any markup */
  usdInrRate: number;
  /** Applied to every OTP price after FX */
  globalOtpMarkup: MarkupRule;
  /** Applied to every rental (monthly) price after FX */
  globalRentalMarkup: MarkupRule;
  /** Extra markup on top of global, keyed by SMS-BUS project id */
  otpServiceMarkups: IOtpServiceMarkup[];
  /** Extra markup on top of global rental, keyed by area code e.g. US, CA */
  rentalAreaMarkups: IRentalAreaMarkup[];
  /**
   * Percentage surcharge applied on top of crypto top-up amounts to protect
   * against coin-price volatility and CloudPaya processing fees.
   * Example: user wants to credit $20, markup is 3% → CloudPaya invoices $20.60.
   * Range: 0–50 (%). Default 0.
   */
  cryptoTopupMarkupPercent: number;
  updatedAt: Date;
}

const MarkupRuleSchema = new Schema<MarkupRule>(
  {
    type: { type: String, enum: ["percent", "fixed_inr"], required: true },
    value: { type: Number, required: true },
  },
  { _id: false }
);

const PricingSettingsSchema = new Schema<IPricingSettings>(
  {
    usdInrRate: { type: Number, required: true, default: 83, min: 1 },
    globalOtpMarkup: {
      type: MarkupRuleSchema,
      default: () => ({ type: "percent", value: 0 }),
    },
    globalRentalMarkup: {
      type: MarkupRuleSchema,
      default: () => ({ type: "percent", value: 0 }),
    },
    otpServiceMarkups: {
      type: [
        {
          projectId: { type: Number, required: true },
          markup: { type: MarkupRuleSchema, required: true },
        },
      ],
      default: [],
    },
    rentalAreaMarkups: {
      type: [
        {
          areaCode: { type: String, required: true, uppercase: true, trim: true },
          markup: { type: MarkupRuleSchema, required: true },
        },
      ],
      default: [],
    },
    cryptoTopupMarkupPercent: { type: Number, default: 0, min: 0, max: 50 },
  },
  { timestamps: true }
);

export const PricingSettings =
  mongoose.models.PricingSettings || mongoose.model<IPricingSettings>("PricingSettings", PricingSettingsSchema);

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PricingSettings, type MarkupRule } from "@/models/PricingSettings";
import { getPricingSettings } from "@/lib/pricing";
import { smsbus } from "@/lib/smsbus";

function isMarkupRule(x: unknown): x is MarkupRule {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    (o.type === "percent" || o.type === "fixed_inr") &&
    typeof o.value === "number" &&
    Number.isFinite(o.value)
  );
}

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

    const settings = await getPricingSettings();
    const projectsRes = await smsbus.getProjects();
    const projects =
      projectsRes.code === 200 && projectsRes.data
        ? Object.values(projectsRes.data).sort((a, b) => a.title.localeCompare(b.title))
        : [];

    return NextResponse.json({
      success: true,
      data: {
        settings: settings.toObject(),
        projects,
        help: {
          flow:
            "SMS-BUS sends USD. We multiply by usdInrRate, then apply global OTP/rental markup, then per-service or per-area markup.",
          envFallback: "On first boot, usdInrRate is seeded from USD_INR_RATE env (default 83) if the DB is empty.",
        },
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

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
    const {
      usdInrRate,
      globalOtpMarkup,
      globalRentalMarkup,
      otpServiceMarkups,
      rentalAreaMarkups,
    } = body as {
      usdInrRate?: number;
      globalOtpMarkup?: unknown;
      globalRentalMarkup?: unknown;
      otpServiceMarkups?: unknown;
      rentalAreaMarkups?: unknown;
    };

    if (usdInrRate === undefined || typeof usdInrRate !== "number" || usdInrRate < 1 || usdInrRate > 500) {
      return NextResponse.json({ success: false, error: "usdInrRate must be between 1 and 500" }, { status: 400 });
    }
    if (!isMarkupRule(globalOtpMarkup) || !isMarkupRule(globalRentalMarkup)) {
      return NextResponse.json({ success: false, error: "Invalid global markup object" }, { status: 400 });
    }

    const otpRows: { projectId: number; markup: MarkupRule }[] = [];
    if (Array.isArray(otpServiceMarkups)) {
      for (const row of otpServiceMarkups) {
        if (!row || typeof row !== "object") continue;
        const r = row as Record<string, unknown>;
        const pid = Number(r.projectId);
        if (!Number.isFinite(pid)) continue;
        if (!isMarkupRule(r.markup)) continue;
        otpRows.push({ projectId: pid, markup: r.markup });
      }
    }

    const rentRows: { areaCode: string; markup: MarkupRule }[] = [];
    if (Array.isArray(rentalAreaMarkups)) {
      for (const row of rentalAreaMarkups) {
        if (!row || typeof row !== "object") continue;
        const r = row as Record<string, unknown>;
        const code = (r.areaCode as string)?.trim().toUpperCase();
        if (!code) continue;
        if (!isMarkupRule(r.markup)) continue;
        rentRows.push({ areaCode: code, markup: r.markup });
      }
    }

    const doc = await PricingSettings.findOneAndUpdate(
      {},
      {
        $set: {
          usdInrRate,
          globalOtpMarkup: globalOtpMarkup as MarkupRule,
          globalRentalMarkup: globalRentalMarkup as MarkupRule,
          otpServiceMarkups: otpRows,
          rentalAreaMarkups: rentRows,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: doc.toObject() });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

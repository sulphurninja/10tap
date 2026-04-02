import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { smsbusRent } from "@/lib/smsbus-rent";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { area_code, mobile_number, status } = body as {
      area_code?: string;
      mobile_number?: string;
      status?: boolean;
    };

    if (!area_code || !mobile_number || typeof status !== "boolean") {
      return NextResponse.json(
        { success: false, error: "area_code, mobile_number, and status (boolean) required" },
        { status: 400 }
      );
    }

    const res = await smsbusRent.changeLinkStatus(
      area_code,
      mobile_number.replace(/\D/g, ""),
      status
    );
    return NextResponse.json({ success: true, data: res });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

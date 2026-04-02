import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { smsbusRent } from "@/lib/smsbus-rent";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const area_code = searchParams.get("area_code");
    const mobile_number = searchParams.get("mobile_number");
    if (!area_code || !mobile_number) {
      return NextResponse.json({ success: false, error: "area_code and mobile_number required" }, { status: 400 });
    }

    const res = await smsbusRent.getLatestSms(area_code, mobile_number.replace(/\D/g, ""));
    return NextResponse.json({ success: true, data: res });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

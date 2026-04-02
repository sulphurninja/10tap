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
    const only_active = searchParams.get("only_active") !== "false";
    const page_num = Number(searchParams.get("page_num") ?? "1");
    const page_size = Number(searchParams.get("page_size") ?? "20");

    const res = await smsbusRent.listNumbers({
      only_active,
      page_num: Number.isFinite(page_num) ? page_num : 1,
      page_size: Number.isFinite(page_size) ? page_size : 20,
    });

    return NextResponse.json({ success: true, data: res });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

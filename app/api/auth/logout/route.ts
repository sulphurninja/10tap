import { NextResponse } from "next/server";

export async function POST() {
  try {
    const res = NextResponse.json({ success: true, data: { message: "Logged out" } });
    res.cookies.delete({ name: "tentap_token", path: "/" });
    return res;
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

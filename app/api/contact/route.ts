import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ContactMessage } from "@/models/ContactMessage";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = (await request.json().catch(() => null)) as {
      name?: unknown;
      email?: unknown;
      subject?: unknown;
      message?: unknown;
    } | null;

    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const subject =
      typeof body.subject === "string" ? body.subject.trim() : "";
    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (name.length < 2 || name.length > 120) {
      return NextResponse.json(
        { success: false, error: "Please enter your name" },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email) || email.length > 200) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email" },
        { status: 400 }
      );
    }
    if (message.length < 10 || message.length > 5000) {
      return NextResponse.json(
        { success: false, error: "Message must be 10–5000 characters" },
        { status: 400 }
      );
    }
    if (subject.length > 200) {
      return NextResponse.json(
        { success: false, error: "Subject is too long" },
        { status: 400 }
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    await ContactMessage.create({
      name,
      email,
      subject: subject || undefined,
      message,
      ip,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

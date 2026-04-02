import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { User } from "@/models/User";

function userPublic(u: {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  walletBalance: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    walletBalance: u.walletBalance,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, email, password } = body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
    });

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const res = NextResponse.json({ success: true, data: { user: userPublic(user.toObject()) } });
    res.cookies.set("tentap_token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });
    return res;
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

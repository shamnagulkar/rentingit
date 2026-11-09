import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/signup
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone, city } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const lower = email.toLowerCase();
    const existing = await db.user.findUnique({ where: { email: lower } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered. Try logging in." }, { status: 400 });
    }

    const user = await db.user.create({
      data: {
        name,
        email: lower,
        phone: phone || null,
        city: city || null,
        passwordHash: await hashPassword(password),
        role: "USER",
        kycStatus: "PENDING",
        trustScore: 5.0,
      },
    });

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (e: any) {
    console.error("Signup error:", e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

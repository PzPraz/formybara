import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";
import { verifyPassword, signToken } from "@/lib/auth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400, headers: corsHeaders }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401, headers: corsHeaders }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = signToken({ userId: user.id, email: user.email });
    return NextResponse.json(
      {
        token,
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch {
    return NextResponse.json(
      { message: "Unexpected error." },
      { status: 500, headers: corsHeaders }
    );
  }
}

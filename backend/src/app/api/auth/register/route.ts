import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";
import { hashPassword, signToken } from "@/lib/auth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const name = typeof body?.name === "string" ? body.name.trim() : undefined;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400, headers: corsHeaders }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: "Email is already registered." },
        { status: 409, headers: corsHeaders }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true },
    });

    const token = signToken({ userId: user.id, email: user.email });
    return NextResponse.json(
      { token, user },
      { status: 201, headers: corsHeaders }
    );
  } catch {
    return NextResponse.json(
      { message: "Unexpected error." },
      { status: 500, headers: corsHeaders }
    );
  }
}

import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";

export async function GET() {
  const checks = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    JWT_SECRET: !!process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV || "not set",
    timestamp: new Date().toISOString(),
  };

  const healthy = checks.DATABASE_URL && checks.JWT_SECRET;

  return NextResponse.json(
    { status: healthy ? "ok" : "misconfigured", checks },
    { status: healthy ? 200 : 503, headers: corsHeaders }
  );
}

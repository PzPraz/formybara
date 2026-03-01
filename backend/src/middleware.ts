import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") || "https://formybara.vercel.app";

  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }
  
  const response =
    req.method === "OPTIONS"
      ? new NextResponse(null, { status: 204 })
      : NextResponse.next();

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,DELETE,OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  return response;
}

export const config = {
  matcher: [
    '/api/forms/:path*',
    '/api/responses/:path*',
  ],
};
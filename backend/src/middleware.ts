import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
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
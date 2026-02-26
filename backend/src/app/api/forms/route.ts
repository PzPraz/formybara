import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";
import { getUserFromRequest } from "@/lib/auth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET /api/forms - List all forms for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401, headers: corsHeaders }
      );
    }

    const forms = await prisma.form.findMany({
      where: { ownerId: user.userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { responses: true } },
      },
    });

    const result = forms.map((f) => ({
      ...f,
      responseCount: f._count.responses,
      _count: undefined,
    }));

    return NextResponse.json(result, { status: 200, headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { message: "Unexpected error." },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/forms - Create a new form
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description =
      typeof body?.description === "string" ? body.description.trim() : null;
    const status = ["draft", "published", "archived"].includes(body?.status)
      ? body.status
      : "draft";

    if (!title) {
      return NextResponse.json(
        { message: "Title is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    const form = await prisma.form.create({
      data: {
        title,
        description,
        status,
        ownerId: user.userId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(form, { status: 201, headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { message: "Unexpected error." },
      { status: 500, headers: corsHeaders }
    );
  }
}

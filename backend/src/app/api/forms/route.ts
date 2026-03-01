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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";
    const sort = searchParams.get("sort") || "newest";

    const where: Record<string, unknown> = { ownerId: user.userId };

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    if (status === "draft" || status === "published" || status === "closed") {
      where.status = status;
    }

    // Build orderBy
    const orderBy = sort === "oldest"
      ? { updatedAt: "asc" as const }
      : { updatedAt: "desc" as const };

    const forms = await prisma.form.findMany({
      where,
      orderBy,
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
  } catch (error) {
    console.error("Forms GET error:", error);
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
    const status = ["draft", "published", "closed"].includes(body?.status)
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
  } catch (error) {
    console.error("Forms POST error:", error);
    return NextResponse.json(
      { message: "Unexpected error." },
      { status: 500, headers: corsHeaders }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";
import { getAuthUserId } from "@/lib/request";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;6

  const userId = getAuthUserId(_req);
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401, headers: corsHeaders });
  }

  const form = await prisma.form.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { responses: true } },
    },
  });

  if (!form) {
    return NextResponse.json(
      { message: "Form not found." },
      { status: 404, headers: corsHeaders }
    );
  }

  if (form.ownerId !== userId) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403, headers: corsHeaders });
  }

  return NextResponse.json(
    { ...form, responseCount: form._count.responses, _count: undefined },
    { headers: corsHeaders },
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = getAuthUserId(req);
  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const existing = await prisma.form.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Form not found." },
        { status: 404, headers: corsHeaders }
      );
    }

    if (existing.ownerId !== userId) {
      return NextResponse.json(
        { message: "Forbidden." },
        { status: 403, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const title = typeof body?.title === "string" ? body.title.trim() : undefined;
    const description =
      typeof body?.description === "string" ? body.description.trim() : undefined;
    const status =
      body?.status === "draft" ||
      body?.status === "published" ||
      body?.status === "closed"
        ? body.status
        : undefined;

    // Block reverting to draft if form has responses
    if (status === "draft" && existing.ownerId === userId) {
      const responseCount = await prisma.response.count({ where: { formId: id } });
      if (responseCount > 0) {
        return NextResponse.json(
          { message: "Tidak dapat mengembalikan ke draft karena form sudah memiliki respons." },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    const form = await prisma.form.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(status !== undefined ? { status } : {}),
      },
      include: { _count: { select: { responses: true } } },
    });

    return NextResponse.json(
      { ...form, responseCount: form._count.responses, _count: undefined },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("Form PATCH error:", error);
    return NextResponse.json(
      { message: "Unexpected error.", detail: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = getAuthUserId(req);
  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const existing = await prisma.form.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Form not found." },
        { status: 404, headers: corsHeaders }
      );
    }

    if (existing.ownerId !== userId) {
      return NextResponse.json(
        { message: "Forbidden." },
        { status: 403, headers: corsHeaders }
      );
    }

    await prisma.form.delete({ where: { id } });
    return NextResponse.json({ message: "Delete successfull", status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Form DELETE error:", error);
    return NextResponse.json(
      { message: "Unexpected error.", detail: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

// GET /api/forms/[id]/public — get published form with questions (no auth)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!form) {
      return NextResponse.json(
        { message: "Form not found." },
        { status: 404, headers: corsHeaders },
      );
    }

    if (form.status !== "published") {
      return NextResponse.json(
        { message: "This form is not accepting responses." },
        { status: 403, headers: corsHeaders },
      );
    }

    // Return form without sensitive owner info
    const { ownerId, ...publicForm } = form;
    return NextResponse.json(publicForm, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Get public form error:", error);
    return NextResponse.json(
      { message: "Unexpected error." },
      { status: 500, headers: corsHeaders },
    );
  }
}

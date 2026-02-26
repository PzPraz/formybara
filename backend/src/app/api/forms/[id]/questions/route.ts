import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// POST /api/forms/[id]/questions - Create question
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: formId } = await params;
    if (!formId) {
      return NextResponse.json(
        { message: "Form id is required" },
        { status: 400 }
      );
    }
    const body = await request.json();
    const { type, title, required, order, options, allowMultiple, labelMin, labelMax } = body;

    // Verify form ownership
    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: { ownerId: true },
    });

    if (!form) {
      return NextResponse.json({ message: "Form not found" }, { status: 404 });
    }

    if (form.ownerId !== user.userId) {
      return NextResponse.json(
        { message: "Not authorized to add questions to this form" },
        { status: 403 }
      );
    }

    // Validate question type
    const validTypes = [
      "short_answer",
      "long_answer",
      "multiple_choice",
      "multiple_choice_dropdown",
      "page_break",
      "text_block",
      "linear_scale",
      "star_rating",
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { message: "Invalid question type" },
        { status: 400 }
      );
    }

    // Create question
    const question = await prisma.question.create({
      data: {
        formId,
        type,
        title: title || "",
        required: required ?? false,
        order: order ?? 0,
        options: options || [],
        allowMultiple: allowMultiple ?? false,
        labelMin: type === "linear_scale" ? (labelMin ?? null) : null,
        labelMax: type === "linear_scale" ? (labelMax ?? null) : null,
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Create question error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/forms/[id]/questions - List questions (for convenience)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: formId } = await params;
    if (!formId) {
      return NextResponse.json(
        { message: "Form id is required" },
        { status: 400 }
      );
    }

    // Verify form access
    const form = await prisma.form.findUnique({
      where: { id: formId },
      select: { ownerId: true },
    });

    if (!form) {
      return NextResponse.json({ message: "Form not found" }, { status: 404 });
    }

    if (form.ownerId !== user.userId) {
      return NextResponse.json(
        { message: "Not authorized to view this form" },
        { status: 403 }
      );
    }

    // Get questions
    const questions = await prisma.question.findMany({
      where: { formId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Get questions error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

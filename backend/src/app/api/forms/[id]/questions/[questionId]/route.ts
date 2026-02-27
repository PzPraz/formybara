import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";
import { getAuthUserId } from "@/lib/request";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> },
) {
  const { id, questionId } = await params;
  const userId = getAuthUserId(req);

  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401, headers: corsHeaders },
    );
  }

  try {
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      select: { formId: true },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { message: "Question not found." },
        { status: 404, headers: corsHeaders },
      );
    }

    if (existingQuestion.formId !== id) {
      return NextResponse.json(
        { message: "Question does not belong to this form." },
        { status: 400, headers: corsHeaders },
      );
    }

    const form = await prisma.form.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!form) {
      return NextResponse.json(
        { message: "Form not found." },
        { status: 404, headers: corsHeaders },
      );
    }

    if (form.ownerId !== userId) {
      return NextResponse.json(
        { message: "Forbidden." },
        { status: 403, headers: corsHeaders },
      );
    }

    // Check if form has responses — block all edits
    const responseCount = await prisma.response.count({ where: { formId: id } });

    if (responseCount > 0) {
      return NextResponse.json(
        { message: "Tidak dapat mengedit pertanyaan karena form sudah memiliki respons." },
        { status: 400, headers: corsHeaders },
      );
    }

    const body = await req.json();

    // Validate required fields
    if (!body?.type || typeof body.type !== "string") {
      return NextResponse.json(
        { message: "Question type is required." },
        { status: 400, headers: corsHeaders },
      );
    }

    if (
      body.type !== "page_break" &&
      (!body?.title || typeof body.title !== "string" || !body.title.trim())
    ) {
      return NextResponse.json(
        { message: "Question title is required." },
        { status: 400, headers: corsHeaders },
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
      "date_picker"
    ];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { message: "Invalid question type." },
        { status: 400, headers: corsHeaders },
      );
    }

    // Types that do not require options
    const noOptionsTypes = [
      "short_answer",
      "long_answer",
      "page_break",
      "text_block",
      "linear_scale",
      "star_rating",
      "date_picker"
    ];

    // Validate options for multiple choice questions
    if (!noOptionsTypes.includes(body.type)) {
      if (!Array.isArray(body.options) || body.options.length === 0) {
        return NextResponse.json(
          { message: "Options are required for multiple choice questions." },
          { status: 400, headers: corsHeaders },
        );
      }

      // Check all options are non-empty strings
      const hasEmptyOption = body.options.some(
        (opt: string) => typeof opt !== "string" || !opt.trim(),
      );
      if (hasEmptyOption) {
        return NextResponse.json(
          { message: "All options must be non-empty strings." },
          { status: 400, headers: corsHeaders },
        );
      }

      // Check for duplicate options (case and trim insensitive)
      const normalizedOptions = body.options.map((opt: string) => opt.trim().toLowerCase());
      const hasDuplicateOption = new Set(normalizedOptions).size !== normalizedOptions.length;

      if (hasDuplicateOption) {
        return NextResponse.json(
          { message: "Multiple choice options must be unique." },
          { status: 400, headers: corsHeaders },
        );
      }
    }

    // Determine order (add to end)
    const order = typeof body.order === "number" ? body.order : 0;

    // Update question
    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        type: body.type,
        title:
          body.type === "page_break"
            ? body.title?.trim() || "Page Break"
            : body.title.trim(),
        required: noOptionsTypes.includes(body.type)
          ? false
          : Boolean(body.required),
        order,
        options: noOptionsTypes.includes(body.type) ? [] : body.options,
        allowMultiple:
          body.type === "multiple_choice" ? Boolean(body.allowMultiple) : false,
        labelMin: body.type === "linear_scale" ? (body.labelMin ?? null) : null,
        labelMax: body.type === "linear_scale" ? (body.labelMax ?? null) : null,
      },
    });

    return NextResponse.json(question, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Edit question error:", error);
    return NextResponse.json(
      { message: "Unexpected error." },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> },
) {
  const { id, questionId } = await params;
  const userId = getAuthUserId(req);

  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401, headers: corsHeaders },
    );
  }

  try {
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      select: { formId: true },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { message: "Question not found." },
        { status: 404, headers: corsHeaders },
      );
    }

    if (existingQuestion.formId !== id) {
      return NextResponse.json(
        { message: "Question does not belong to this form." },
        { status: 400, headers: corsHeaders },
      );
    }

    const form = await prisma.form.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!form) {
      return NextResponse.json(
        { message: "Form not found." },
        { status: 404, headers: corsHeaders },
      );
    }

    if (form.ownerId !== userId) {
      return NextResponse.json(
        { message: "Forbidden." },
        { status: 403, headers: corsHeaders },
      );
    }

    // Check if form has responses — block deletion
    const responseCount = await prisma.response.count({ where: { formId: id } });
    if (responseCount > 0) {
      return NextResponse.json(
        { message: "Tidak dapat menghapus pertanyaan karena form sudah memiliki respons." },
        { status: 400, headers: corsHeaders },
      );
    }

    await prisma.question.delete({
      where: { id: questionId },
    });

    return NextResponse.json(
      { message: "Question deleted." },
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Delete question error:", error);
    return NextResponse.json(
      { message: "Unexpected error." },
      { status: 500, headers: corsHeaders },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsHeaders } from "@/lib/cors";

// POST /api/forms/[id]/responses — submit a response (no auth)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: formId } = await params;

  try {
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        questions: { orderBy: { order: "asc" } },
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

    const body = await req.json();
    const { respondentName, answers } = body;

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { message: "Answers are required." },
        { status: 400, headers: corsHeaders },
      );
    }

    // Validate required questions
    const nonContentQuestions = form.questions.filter(
      (q) => q.type !== "page_break" && q.type !== "text_block",
    );

    for (const question of nonContentQuestions) {
      if (question.required) {
        const answer = answers[question.id];
        if (!answer || (typeof answer === "string" && !answer.trim()) || (Array.isArray(answer) && answer.length === 0)) {
          return NextResponse.json(
            { message: `Pertanyaan "${question.title}" wajib dijawab.` },
            { status: 400, headers: corsHeaders },
          );
        }
      }
    }

    // Create response with answers
    const response = await prisma.response.create({
      data: {
        formId,
        respondentName: respondentName?.trim() || null,
        answers: {
          create: nonContentQuestions
            .filter((q) => answers[q.id] !== undefined && answers[q.id] !== null)
            .map((q) => {
              const answer = answers[q.id];
              return {
                questionId: q.id,
                value: typeof answer === "string" ? answer : "",
                values: Array.isArray(answer) ? answer : [],
              };
            }),
        },
      },
      include: { answers: true },
    });

    return NextResponse.json(
      { message: "Response submitted successfully.", id: response.id },
      { status: 201, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Submit response error:", error);
    return NextResponse.json(
      { message: "Unexpected error." },
      { status: 500, headers: corsHeaders },
    );
  }
}

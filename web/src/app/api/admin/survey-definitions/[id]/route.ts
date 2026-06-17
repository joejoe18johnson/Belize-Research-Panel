import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import {
  findSurveyDefinitionById,
  updateSurveyDefinition,
} from "@/lib/survey-definitions";
import type { SurveyCategory } from "@/lib/panelist-surveys-types";
import { cleanText } from "@/lib/validation";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const survey = await findSurveyDefinitionById(id);
  if (!survey) {
    return NextResponse.json({ ok: false, message: "Survey not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, survey });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const survey = await updateSurveyDefinition(id, {
      title: body.title !== undefined ? cleanText(String(body.title)) : undefined,
      description: body.description !== undefined ? cleanText(String(body.description)) : undefined,
      category:
        body.category !== undefined
          ? ((cleanText(String(body.category)) || "civic") as SurveyCategory)
          : undefined,
      status:
        body.status === "published" || body.status === "draft" || body.status === "closed"
          ? body.status
          : undefined,
      questions: Array.isArray(body.questions) ? body.questions : undefined,
    });

    revalidatePath("/admin/surveys");
    revalidatePath(`/admin/surveys/${id}/edit`);
    return NextResponse.json({ ok: true, survey });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update survey.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import {
  deleteSurveyCustomTemplate,
  findSurveyCustomTemplateById,
  updateSurveyCustomTemplate,
} from "@/lib/survey-custom-templates";
import type { SurveyCategory } from "@/lib/panelist-surveys-types";
import { cleanText } from "@/lib/validation";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;
  const template = await findSurveyCustomTemplateById(id);
  if (!template) {
    return NextResponse.json({ ok: false, message: "Template not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, template });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const template = await updateSurveyCustomTemplate(id, {
      title: body.title !== undefined ? cleanText(String(body.title)) : undefined,
      description: body.description !== undefined ? cleanText(String(body.description)) : undefined,
      companyIntro: body.companyIntro !== undefined ? cleanText(String(body.companyIntro)) : undefined,
      category:
        body.category !== undefined
          ? ((cleanText(String(body.category)) || "civic") as SurveyCategory)
          : undefined,
      questions: Array.isArray(body.questions) ? body.questions : undefined,
    });

    revalidatePath("/admin/templates");
    revalidatePath(`/admin/templates/${id}/edit`);
    revalidatePath("/admin/surveys/create");
    return NextResponse.json({ ok: true, template });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update template.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deleteSurveyCustomTemplate(id);
    revalidatePath("/admin/templates");
    revalidatePath("/admin/surveys/create");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete template.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

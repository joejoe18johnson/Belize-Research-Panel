import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import {
  createSurveyCustomTemplate,
  loadSurveyCustomTemplates,
} from "@/lib/survey-custom-templates";
import type { SurveyCategory } from "@/lib/panelist-surveys-types";
import { cleanText } from "@/lib/validation";

export async function GET() {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const templates = await loadSurveyCustomTemplates();
  return NextResponse.json({ ok: true, templates });
}

export async function POST(request: Request) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const template = await createSurveyCustomTemplate({
      title: cleanText(String(body.title ?? "")),
      description: cleanText(String(body.description ?? "")),
      companyIntro: cleanText(String(body.companyIntro ?? "")),
      category: (cleanText(String(body.category ?? "civic")) || "civic") as SurveyCategory,
      questions: Array.isArray(body.questions) ? body.questions : undefined,
    });

    revalidatePath("/admin/templates");
    revalidatePath("/admin/surveys/create");
    return NextResponse.json({ ok: true, template });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create template.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { createSurveyDefinition, loadSurveyDefinitions } from "@/lib/survey-definitions";
import type { SurveyCategory } from "@/lib/panelist-surveys-types";
import { cleanText } from "@/lib/validation";

export async function GET() {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const surveys = await loadSurveyDefinitions();
  return NextResponse.json({ ok: true, surveys });
}

export async function POST(request: Request) {
  if (!(await isAdminSessionActive())) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const survey = await createSurveyDefinition({
      title: cleanText(String(body.title ?? "")),
      description: cleanText(String(body.description ?? "")),
      category: (cleanText(String(body.category ?? "civic")) || "civic") as SurveyCategory,
      status: body.status === "published" ? "published" : "draft",
      questions: Array.isArray(body.questions) ? body.questions : undefined,
    });

    revalidatePath("/admin/surveys");
    return NextResponse.json({ ok: true, survey });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create survey.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

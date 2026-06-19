import { notFound } from "next/navigation";
import { SurveyBuilderClient } from "@/components/admin/surveys/SurveyBuilderClient";
import { findSurveyCustomTemplateById } from "@/lib/survey-custom-templates";

export const metadata = { title: "Edit Template | My Templates" };

export default async function AdminEditSurveyTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await findSurveyCustomTemplateById(id);
  if (!template) notFound();
  return <SurveyBuilderClient mode="template" initialTemplate={template} />;
}

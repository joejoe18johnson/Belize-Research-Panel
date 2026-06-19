import { SurveyBuilderClient } from "@/components/admin/surveys/SurveyBuilderClient";
import { loadSurveyCustomTemplates } from "@/lib/survey-custom-templates";

export const metadata = { title: "Create Survey | Admin" };

export default async function AdminCreateSurveyPage() {
  const customTemplates = await loadSurveyCustomTemplates();
  return <SurveyBuilderClient customTemplates={customTemplates} />;
}

import { AdminSurveyTemplatesClient } from "@/components/admin/surveys/AdminSurveyTemplatesClient";
import { loadSurveyCustomTemplates } from "@/lib/survey-custom-templates";

export const metadata = { title: "My Templates | Admin" };

export default async function AdminSurveyTemplatesPage() {
  const templates = await loadSurveyCustomTemplates();
  return <AdminSurveyTemplatesClient templates={templates} />;
}

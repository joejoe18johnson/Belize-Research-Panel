import { AdminSurveyLibraryClient } from "@/components/admin/surveys/AdminSurveyLibraryClient";
import { loadSurveyDefinitions } from "@/lib/survey-definitions";

export const metadata = { title: "Survey Builder | Admin" };

export default async function AdminSurveysPage() {
  const surveys = await loadSurveyDefinitions();
  return <AdminSurveyLibraryClient surveys={surveys.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))} />;
}

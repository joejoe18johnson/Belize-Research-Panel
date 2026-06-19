import { SurveyBuilderClient } from "@/components/admin/surveys/SurveyBuilderClient";

export const metadata = { title: "Create Template | My Templates" };

export default function AdminCreateSurveyTemplatePage() {
  return <SurveyBuilderClient mode="template" />;
}

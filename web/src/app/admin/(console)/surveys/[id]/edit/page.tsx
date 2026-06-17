import { notFound } from "next/navigation";
import { SurveyBuilderClient } from "@/components/admin/surveys/SurveyBuilderClient";
import { findSurveyDefinitionById } from "@/lib/survey-definitions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const survey = await findSurveyDefinitionById(id);
  return { title: survey ? `Edit ${survey.title} | Admin` : "Edit Survey | Admin" };
}

export default async function AdminEditSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const survey = await findSurveyDefinitionById(id);
  if (!survey) notFound();
  return <SurveyBuilderClient initialSurvey={survey} />;
}

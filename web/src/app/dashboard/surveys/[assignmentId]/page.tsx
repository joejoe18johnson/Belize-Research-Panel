import { notFound, redirect } from "next/navigation";
import { TakeSurveyClient } from "@/components/dashboard/TakeSurveyClient";
import { requireRegisteredPanelistSession } from "@/lib/dashboard-access";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";
import { findSurveyDefinitionById } from "@/lib/survey-definitions";
import { getSurveyResponse } from "@/lib/survey-responses";
import { cleanText } from "@/lib/validation";

export const metadata = { title: "Take Survey | Belize Research Panel" };

export default async function TakeSurveyPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const account = await requireRegisteredPanelistSession();
  if (account.accountStatus === "on_hold") {
    redirect("/dashboard/account-on-hold");
  }

  const { assignmentId } = await params;
  const email = cleanText(account.email).toLowerCase();
  const assignments = await loadSurveyRecordsFromFile();
  const assignment = assignments.find(
    (record) => record.id === assignmentId && cleanText(record.panelistEmail ?? "").toLowerCase() === email
  );

  if (!assignment) notFound();
  if (!assignment.surveyDefinitionId) {
    redirect("/dashboard/surveys");
  }

  const definition = await findSurveyDefinitionById(assignment.surveyDefinitionId);
  if (!definition) notFound();

  const response = await getSurveyResponse(assignmentId, account.email);

  return (
    <TakeSurveyClient
      assignment={assignment}
      definition={definition}
      initialAnswers={response?.answers ?? {}}
      submitted={Boolean(response?.submittedAt) || assignment.status === "completed"}
    />
  );
}

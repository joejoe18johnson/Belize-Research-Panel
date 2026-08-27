import Link from "next/link";
import { redirect } from "next/navigation";
import { TakeSurveyClient } from "@/components/dashboard/TakeSurveyClient";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { requireRegisteredPanelistSession } from "@/lib/dashboard-access";
import { findCampaignById } from "@/lib/campaigns";
import {
  assignmentExistsForCampaign,
  findAssignmentForAccount,
  normalizeAssignmentId,
  resolveSurveyDefinitionForAssignment,
} from "@/lib/survey-assignment-lookup";
import { getSurveyResponse } from "@/lib/survey-responses";
import { cleanText } from "@/lib/validation";

export const metadata = { title: "Take Survey | Belize Research Panel" };

export default async function TakeSurveyPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const account = await requireRegisteredPanelistSession();
  if (account.accountStatus === "on_hold") {
    redirect("/dashboard/account-on-hold");
  }

  const { assignmentId: rawAssignmentId } = await params;
  const assignmentId = normalizeAssignmentId(rawAssignmentId);
  const assignment = await findAssignmentForAccount(assignmentId, account.email);

  if (!assignment) {
    const campaign = await findCampaignById(assignmentId);
    if (campaign?.deliveryType === "external" && cleanText(campaign.surveyUrl)) {
      redirect(campaign.surveyUrl);
    }

    const invitedElsewhere = await assignmentExistsForCampaign(assignmentId);
    return (
      <div className="mx-auto max-w-xl">
        <BrandedAlert tone="warning" title="This survey link could not be opened" showIcon>
          {invitedElsewhere ? (
            <p>
              You are signed in as <span className="font-semibold">{account.email}</span>. This invitation belongs to a
              different panelist account. Sign in with the email address that received the survey invitation.
            </p>
          ) : (
            <p>
              We could not find this survey in your inbox. It may have been sent to a different email address, or the
              campaign may no longer be available.
            </p>
          )}
          <Link
            href="/dashboard/surveys"
            className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Open my surveys
          </Link>
        </BrandedAlert>
      </div>
    );
  }

  if (assignment.deliveryType === "external" && cleanText(assignment.surveyUrl ?? "")) {
    redirect(assignment.surveyUrl as string);
  }

  const definition = await resolveSurveyDefinitionForAssignment(assignment);
  if (!definition) {
    if (!assignment.surveyDefinitionId && cleanText(assignment.surveyUrl ?? "")) {
      redirect(assignment.surveyUrl as string);
    }
    return (
      <div className="mx-auto max-w-xl">
        <BrandedAlert tone="error" title="Survey is not available yet" showIcon>
          <p>
            Your invitation was found, but the on-site survey form is missing. Please use Surveys in your dashboard or
            contact Belize Research Panel if this continues.
          </p>
          <Link
            href="/dashboard/surveys"
            className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Open my surveys
          </Link>
        </BrandedAlert>
      </div>
    );
  }

  const response = await getSurveyResponse(assignment.id, account.email);

  return (
    <TakeSurveyClient
      assignment={assignment}
      definition={definition}
      initialAnswers={response?.answers ?? {}}
      submitted={assignment.status === "completed"}
    />
  );
}

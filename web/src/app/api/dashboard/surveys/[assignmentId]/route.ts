import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionAccount, resolveRequestOrigin } from "@/lib/auth";
import { sendSurveyCompletedEmail } from "@/lib/email/process-emails";
import { findPanelistByEmail } from "@/lib/panelists";
import { panelistRowToDashboardProfile } from "@/lib/panelist-dashboard";
import { resolveRewardSummary } from "@/lib/panelist-points";
import { getSurveyResponse, saveSurveyProgress, submitSurveyResponse } from "@/lib/survey-responses";
import { findAssignmentForAccount, resolveSurveyDefinitionForAssignment } from "@/lib/survey-assignment-lookup";
import { SurveyValidationError, type SurveyAnswerValue } from "@/lib/survey-definitions";

export async function GET(
  _request: Request,
  context: { params: Promise<{ assignmentId: string }> }
) {
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { assignmentId } = await context.params;
  const assignment = await findAssignmentForAccount(assignmentId, account.email);
  if (!assignment) {
    return NextResponse.json({ ok: false, message: "Survey not found." }, { status: 404 });
  }

  const definition = await resolveSurveyDefinitionForAssignment(assignment);
  if (!definition) {
    if (assignment.deliveryType === "external") {
      return NextResponse.json({ ok: false, message: "This survey uses an external link." }, { status: 400 });
    }
    return NextResponse.json({ ok: false, message: "Survey definition not found." }, { status: 404 });
  }

  const response = await getSurveyResponse(assignment.id, account.email);

  return NextResponse.json({
    ok: true,
    assignment,
    definition,
    response,
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ assignmentId: string }> }
) {
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }
  if (account.accountStatus === "on_hold") {
    return NextResponse.json({ ok: false, message: "Account on hold." }, { status: 403 });
  }

  const { assignmentId } = await context.params;
  const assignment = await findAssignmentForAccount(assignmentId, account.email);
  if (!assignment) {
    return NextResponse.json({ ok: false, message: "Survey not found." }, { status: 404 });
  }

  const body = (await request.json()) as {
    answers?: Record<string, SurveyAnswerValue>;
    submit?: boolean;
  };

  const answers = body.answers ?? {};

  try {
    if (body.submit) {
      const result = await submitSurveyResponse({
        assignmentId: assignment.id,
        panelistEmail: account.email,
        answers,
      });

      const panelist = await findPanelistByEmail(account.email);
      void sendSurveyCompletedEmail({
        to: account.email,
        firstName: panelist?.first_name ?? account.firstName,
        campaignTitle: assignment.title,
        points: result.points,
        origin: resolveRequestOrigin(request),
      });

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/rewards");
      revalidatePath("/dashboard/surveys");

      const rewards = panelist
        ? await resolveRewardSummary(account.email, panelistRowToDashboardProfile(panelist))
        : null;

      return NextResponse.json({
        ok: true,
        submitted: true,
        points: result.points,
        progressPercent: 100,
        rewards: rewards
          ? {
              availablePoints: rewards.availablePoints,
              totalPointsToDate: rewards.totalPointsToDate,
              surveyPoints: rewards.surveyPoints,
            }
          : undefined,
      });
    }

    const result = await saveSurveyProgress({
      assignmentId: assignment.id,
      panelistEmail: account.email,
      answers,
    });

    return NextResponse.json({
      ok: true,
      submitted: false,
      progressPercent: result.progressPercent,
    });
  } catch (error) {
    if (error instanceof SurveyValidationError) {
      return NextResponse.json(
        {
          ok: false,
          message: error.message,
          missingQuestionIds: error.issues.map((issue) => issue.questionId),
          issues: error.issues,
        },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Could not save survey.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

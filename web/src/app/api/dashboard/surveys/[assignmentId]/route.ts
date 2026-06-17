import { NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth";
import { getSurveyResponse, saveSurveyProgress, submitSurveyResponse } from "@/lib/survey-responses";
import { loadSurveyRecordsFromFile } from "@/lib/panelist-surveys-store";
import { findSurveyDefinitionById } from "@/lib/survey-definitions";
import type { SurveyAnswerValue } from "@/lib/survey-definitions";
import { cleanText } from "@/lib/validation";

async function getAssignmentForAccount(assignmentId: string, email: string) {
  const normalized = cleanText(email).toLowerCase();
  const assignments = await loadSurveyRecordsFromFile();
  return (
    assignments.find(
      (record) =>
        record.id === assignmentId && cleanText(record.panelistEmail ?? "").toLowerCase() === normalized
    ) ?? null
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ assignmentId: string }> }
) {
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { assignmentId } = await context.params;
  const assignment = await getAssignmentForAccount(assignmentId, account.email);
  if (!assignment) {
    return NextResponse.json({ ok: false, message: "Survey not found." }, { status: 404 });
  }
  if (!assignment.surveyDefinitionId) {
    return NextResponse.json({ ok: false, message: "This survey uses an external link." }, { status: 400 });
  }

  const definition = await findSurveyDefinitionById(assignment.surveyDefinitionId);
  if (!definition) {
    return NextResponse.json({ ok: false, message: "Survey definition not found." }, { status: 404 });
  }

  const response = await getSurveyResponse(assignmentId, account.email);

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
  const body = (await request.json()) as {
    answers?: Record<string, SurveyAnswerValue>;
    submit?: boolean;
  };

  const answers = body.answers ?? {};

  try {
    if (body.submit) {
      const result = await submitSurveyResponse({
        assignmentId,
        panelistEmail: account.email,
        answers,
      });
      return NextResponse.json({
        ok: true,
        submitted: true,
        points: result.points,
        progressPercent: 100,
      });
    }

    const result = await saveSurveyProgress({
      assignmentId,
      panelistEmail: account.email,
      answers,
    });

    return NextResponse.json({
      ok: true,
      submitted: false,
      progressPercent: result.progressPercent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save survey.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

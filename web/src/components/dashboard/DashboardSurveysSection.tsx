"use client";

import { useState } from "react";
import type { AccountHoldReason } from "@/lib/auth-types";
import type { PanelistSurvey } from "@/lib/panelist-surveys-types";
import { viewLayoutContainerClass, viewLayoutItemClass } from "@/lib/view-layout";
import { ViewLayoutToggle, useViewLayout } from "@/components/shared/ViewLayoutToggle";
import { DashboardAlert, DashboardInfoNote } from "./DashboardShell";
import { SurveyCard } from "./SurveyCard";
import { formatHeadingCase } from "@/lib/sentence-case";

type SurveyTab = "inbox" | "completed";

function holdMessage(holdReason: AccountHoldReason): string {
  if (holdReason === "email_change") {
    return "Wait for administrator approval of your new email address to unlock surveys.";
  }
  if (holdReason === "phone_change") {
    return "Wait for administrator approval of your new phone number to unlock surveys.";
  }
  if (holdReason === "email_and_phone") {
    return "Wait for administrator approval of your email and phone changes to unlock surveys.";
  }
  if (holdReason === "fraud_review") {
    return "Your account is on hold while an administrator reviews a possible duplicate flag.";
  }
  return "Complete account verification to unlock surveys.";
}

export function DashboardSurveysSection({
  inbox,
  completed,
  newSurveyIds = new Set<string>(),
  surveysLocked = false,
  holdReason = "",
  initialTab = "inbox",
  justSubmitted = false,
  submittedPoints,
  submittedTitle,
}: {
  inbox: PanelistSurvey[];
  completed: PanelistSurvey[];
  newSurveyIds?: Set<string>;
  surveysLocked?: boolean;
  holdReason?: AccountHoldReason;
  initialTab?: SurveyTab;
  justSubmitted?: boolean;
  submittedPoints?: number;
  submittedTitle?: string;
}) {
  const [tab, setTab] = useState<SurveyTab>(initialTab);
  const [layout, setLayout] = useViewLayout("dashboard-surveys");
  const surveys = tab === "inbox" ? inbox : completed;

  return (
    <div className="space-y-6">
      {justSubmitted ? (
        <DashboardAlert tone="success" title="Thank you — your responses have been recorded">
          {submittedTitle
            ? `${submittedTitle} is now in Completed surveys.`
            : "This survey is now in Completed surveys."}{" "}
          {submittedPoints !== undefined ? `+${submittedPoints} points earned.` : null}
        </DashboardAlert>
      ) : null}

      {surveysLocked ? (
        <DashboardAlert tone="info" title="Surveys unavailable — account on hold">
          {formatHeadingCase(holdMessage(holdReason))}{" "}
          <a href="/dashboard/account-on-hold" className="font-semibold underline">
            {formatHeadingCase("View verification status")}
          </a>
        </DashboardAlert>
      ) : null}

      <div
        className={`flex w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-1 lg:inline-flex lg:w-auto ${surveysLocked ? "opacity-60" : ""}`}
      >
        <button
          type="button"
          onClick={() => setTab("inbox")}
          disabled={surveysLocked}
          className={`flex min-h-11 flex-1 items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold transition lg:flex-none lg:px-4 ${
            tab === "inbox"
              ? "bg-white dark:bg-zinc-900 text-teal-800 dark:text-teal-200 shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 hover:text-teal-800 dark:text-teal-200"
          } disabled:cursor-not-allowed`}
        >
          {formatHeadingCase("Inbox")}
          {inbox.length > 0 ? (
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${tab === "inbox" ? "bg-teal-100 text-teal-800 dark:text-teal-200" : "bg-zinc-200 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500"}`}>
              {inbox.length}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setTab("completed")}
          disabled={surveysLocked}
          className={`flex min-h-11 flex-1 items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold transition lg:flex-none lg:px-4 ${
            tab === "completed"
              ? "bg-white dark:bg-zinc-900 text-teal-800 dark:text-teal-200 shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 hover:text-teal-800 dark:text-teal-200"
          } disabled:cursor-not-allowed`}
        >
          {formatHeadingCase("Completed")}
          {completed.length > 0 ? (
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${tab === "completed" ? "bg-teal-100 text-teal-800 dark:text-teal-200" : "bg-zinc-200 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500"}`}>
              {completed.length}
            </span>
          ) : null}
        </button>
      </div>

      {surveys.length > 0 ? (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
              {surveys.length} {tab === "inbox" ? "survey" : "completed survey"}
              {surveys.length === 1 ? "" : "s"}
            </p>
            <ViewLayoutToggle value={layout} onChange={setLayout} />
          </div>
          <div className={`${viewLayoutContainerClass(layout, "grid gap-6 lg:grid-cols-2")} ${surveysLocked ? "pointer-events-none" : ""}`}>
            {surveys.map((survey) => (
              <div key={survey.id} className={viewLayoutItemClass(layout)}>
                <SurveyCard
                  survey={survey}
                  locked={surveysLocked}
                  layout={layout}
                  isNew={tab === "inbox" && newSurveyIds.has(survey.id)}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <DashboardInfoNote>
          {formatHeadingCase(
            tab === "inbox"
              ? "Your inbox is empty. New survey invitations matched to your profile will appear here."
              : "You have not completed any surveys yet. Finished surveys will show here with your progress and points earned."
          )}
        </DashboardInfoNote>
      )}

      <DashboardInfoNote>
        {formatHeadingCase(
          surveysLocked
            ? "Survey participation requires a verified, active account. Your invitations will unlock automatically once verification is complete."
            : "On-site surveys open in your dashboard. You can save progress and submit when every required question is answered. External survey links open in a new tab."
        )}
      </DashboardInfoNote>
    </div>
  );
}

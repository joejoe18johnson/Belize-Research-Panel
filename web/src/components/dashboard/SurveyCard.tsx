import Link from "next/link";
import type { PanelistSurvey, SurveyCategory } from "@/lib/panelist-surveys-types";
import { isSurveyOverdue } from "@/lib/panelist-surveys-types";
import { formatHeadingCase } from "@/lib/sentence-case";
import { DashboardCard, DashboardCardMedia } from "./DashboardShell";

const CATEGORY_STYLES: Record<
  SurveyCategory,
  { gradient: string; label: string; icon: string }
> = {
  political: {
    gradient: "from-teal-700 via-teal-800 to-teal-950",
    label: "Political poll",
    icon: "🗳️",
  },
  market: {
    gradient: "from-orange-600 via-orange-700 to-amber-800",
    label: "Market research",
    icon: "📊",
  },
  civic: {
    gradient: "from-emerald-600 via-teal-700 to-teal-900",
    label: "Civic study",
    icon: "🏛️",
  },
};

function SurveyProgressBar({
  percent,
  completed,
}: {
  percent: number;
  completed?: boolean;
}) {
  const fill = percent > 0 ? percent : 4;
  const barClass = completed ? "bg-emerald-500" : "bg-teal-600";

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium">
        <span className="text-zinc-600">{formatHeadingCase(completed ? "Completed" : "Progress")}</span>
        <span className={completed ? "text-emerald-700" : "text-teal-800"}>{percent}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-zinc-200"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Survey progress: ${percent}%`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${barClass}`}
          style={{ width: `${fill}%` }}
        />
      </div>
    </div>
  );
}

export function SurveyCard({ survey, locked = false }: { survey: PanelistSurvey; locked?: boolean }) {
  const style = CATEGORY_STYLES[survey.category];
  const completed = survey.status === "completed";
  const overdue = isSurveyOverdue(survey);

  return (
    <DashboardCard className={`overflow-hidden p-0 ${locked ? "opacity-50 grayscale" : ""}`}>
      {locked ? (
        <div className="rounded-t-2xl border-b border-zinc-200 bg-zinc-100 px-5 py-2 text-center text-xs font-semibold text-zinc-600">
          Unavailable until account is verified
        </div>
      ) : null}
      <DashboardCardMedia top={!locked}>
        <div
          className={`relative flex aspect-[16/9] items-end bg-gradient-to-br ${style.gradient} p-5`}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_55%)]" />
          <div className="relative">
            <span className="inline-flex rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {style.icon} {formatHeadingCase(style.label)}
            </span>
          </div>
        </div>
      </DashboardCardMedia>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">{survey.title}</h3>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
              <dt className="text-zinc-500">{formatHeadingCase("Survey date")}</dt>
              <dd className="font-medium text-zinc-800 sm:text-right">{survey.assignedDateLabel}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
              <dt className="text-zinc-500">{formatHeadingCase(completed ? "Completed on" : "Complete by")}</dt>
              <dd className={`font-medium sm:text-right ${overdue && !completed ? "text-red-600" : "text-zinc-800"}`}>
                {completed ? survey.completedDateLabel : survey.completeByDateLabel}
                {overdue && !completed ? " (overdue)" : ""}
              </dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
              <dt className="text-zinc-500">{formatHeadingCase("Reward")}</dt>
              <dd className="font-semibold text-teal-800 sm:text-right">+{survey.points} points</dd>
            </div>
          </dl>
        </div>

        <SurveyProgressBar percent={survey.progressPercent} completed={completed} />

        {!completed ? (
          survey.surveyDefinitionId && !locked ? (
            <Link
              href={`/dashboard/surveys/${encodeURIComponent(survey.id)}`}
              className="flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              {formatHeadingCase(survey.status === "in_progress" ? "Continue survey" : "Start survey")}
            </Link>
          ) : survey.surveyUrl && !locked ? (
            <a
              href={survey.surveyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              {formatHeadingCase(survey.status === "in_progress" ? "Continue survey" : "Start survey")}
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="w-full rounded-xl bg-zinc-400 px-4 py-2.5 text-sm font-semibold text-white"
              title={locked ? "Verify your account to start surveys" : "Survey link not yet available"}
            >
              {locked
                ? formatHeadingCase("Verify account to participate")
                : formatHeadingCase(
                    survey.status === "in_progress" ? "Continue survey" : "Start survey"
                  )}
            </button>
          )
        ) : (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-medium text-emerald-800">
            {formatHeadingCase(`Completed · +${survey.points} points earned`)}
          </p>
        )}
      </div>
    </DashboardCard>
  );
}

import Link from "next/link";
import type { PanelistSurvey, SurveyCategory } from "@/lib/panelist-surveys-types";
import { isSurveyOverdue } from "@/lib/panelist-surveys-types";
import type { ViewLayout } from "@/lib/view-layout";
import { getSurveyCategoryStyle } from "@/lib/survey-category-styles";
import { formatHeadingCase } from "@/lib/sentence-case";
import { DashboardCard, DashboardCardMedia } from "./DashboardShell";

const CATEGORY_STYLES = {
  political: getSurveyCategoryStyle("political"),
  market: getSurveyCategoryStyle("market"),
  civic: getSurveyCategoryStyle("civic"),
} satisfies Record<SurveyCategory, ReturnType<typeof getSurveyCategoryStyle>>;

function SurveyProgressBar({
  percent,
  completed,
  compact = false,
}: {
  percent: number;
  completed?: boolean;
  compact?: boolean;
}) {
  const fill = percent > 0 ? percent : 4;
  const barClass = completed ? "bg-emerald-500" : "bg-teal-600";

  return (
    <div>
      <div className={`mb-1.5 flex items-center justify-between gap-2 font-medium ${compact ? "text-[11px]" : "text-xs"}`}>
        <span className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase(completed ? "Completed" : "Progress")}</span>
        <span className={completed ? "text-emerald-700" : "text-teal-800 dark:text-teal-200"}>{percent}%</span>
      </div>
      <div
        className={`overflow-hidden rounded-full bg-zinc-200 ${compact ? "h-1.5" : "h-2"}`}
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

function SurveyCategoryBadge({
  category,
  compact = false,
}: {
  category: SurveyCategory;
  compact?: boolean;
}) {
  const style = CATEGORY_STYLES[category];

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center bg-gradient-to-br ${style.gradient} ${
        compact ? "h-14 w-14 rounded-xl" : "aspect-[16/9] min-h-[5.5rem] w-full items-end p-4"
      }`}
      aria-hidden="true"
    >
      {!compact ? (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_55%)]" />
      ) : null}
      <span
        className={`relative inline-flex rounded-full bg-white/15 font-medium text-white backdrop-blur-sm ${
          compact ? "text-lg" : "px-2.5 py-1 text-xs"
        }`}
      >
        {style.icon}
      </span>
    </div>
  );
}

function SurveyAction({
  survey,
  locked,
  compact = false,
}: {
  survey: PanelistSurvey;
  locked: boolean;
  compact?: boolean;
}) {
  const completed = survey.status === "completed";
  const buttonClass = compact
    ? "inline-flex min-h-10 items-center justify-center rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-800"
    : "flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800";

  if (completed) {
    return (
      <p
        className={`rounded-lg border border-emerald-200 bg-emerald-50 text-center font-medium text-emerald-800 ${
          compact ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs"
        }`}
      >
        {formatHeadingCase(`Completed · +${survey.points} pts`)}
      </p>
    );
  }

  if (survey.surveyDefinitionId && !locked) {
    return (
      <Link href={`/dashboard/surveys/${encodeURIComponent(survey.id)}`} className={buttonClass}>
        {formatHeadingCase(survey.status === "in_progress" ? "Continue" : "Start")}
      </Link>
    );
  }

  if (survey.surveyUrl && !locked) {
    return (
      <a href={survey.surveyUrl} target="_blank" rel="noopener noreferrer" className={buttonClass}>
        {formatHeadingCase(survey.status === "in_progress" ? "Continue" : "Start")}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled
      className={`${buttonClass} bg-zinc-400`}
      title={locked ? "Verify your account to start surveys" : "Survey link not yet available"}
    >
      {locked ? formatHeadingCase("Verify to start") : formatHeadingCase("Unavailable")}
    </button>
  );
}

function SurveyNewBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full bg-amber-500 font-bold uppercase tracking-wide text-white ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]"
      }`}
    >
      New
    </span>
  );
}

export function SurveyCard({
  survey,
  locked = false,
  layout = "cards",
  isNew = false,
}: {
  survey: PanelistSurvey;
  locked?: boolean;
  layout?: ViewLayout;
  isNew?: boolean;
}) {
  const style = CATEGORY_STYLES[survey.category];
  const completed = survey.status === "completed";
  const overdue = isSurveyOverdue(survey);

  if (layout === "list") {
    return (
      <DashboardCard className={`p-4 ${locked ? "opacity-50 grayscale" : ""}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SurveyCategoryBadge category={survey.category} compact />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                  {style.icon} {formatHeadingCase(style.label)}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 sm:text-base">{survey.title}</h3>
                  {isNew ? <SurveyNewBadge compact /> : null}
                </div>
              </div>
              <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-800 dark:text-teal-200">
                +{survey.points} pts
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
              {formatHeadingCase(completed ? "Completed on" : "Due")}{" "}
              <span className={overdue && !completed ? "font-medium text-red-600" : "font-medium text-zinc-800 dark:text-zinc-200"}>
                {completed ? survey.completedDateLabel : survey.completeByDateLabel}
                {overdue && !completed ? " (overdue)" : ""}
              </span>
            </p>
            <SurveyProgressBar percent={survey.progressPercent} completed={completed} compact />
          </div>
          <div className="w-full shrink-0 sm:w-auto">
            <SurveyAction survey={survey} locked={locked} compact />
          </div>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard className={`overflow-hidden p-0 ${locked ? "opacity-50 grayscale" : ""}`}>
      {locked ? (
        <div className="rounded-t-2xl border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 px-5 py-2 text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
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
          <div className="flex flex-wrap items-start gap-2">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{survey.title}</h3>
            {isNew ? <SurveyNewBadge /> : null}
          </div>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase("Survey date")}</dt>
              <dd className="font-medium text-zinc-800 dark:text-zinc-200 sm:text-right">{survey.assignedDateLabel}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase(completed ? "Completed on" : "Complete by")}</dt>
              <dd className={`font-medium sm:text-right ${overdue && !completed ? "text-red-600" : "text-zinc-800 dark:text-zinc-200"}`}>
                {completed ? survey.completedDateLabel : survey.completeByDateLabel}
                {overdue && !completed ? " (overdue)" : ""}
              </dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase("Reward")}</dt>
              <dd className="font-semibold text-teal-800 dark:text-teal-200 sm:text-right">+{survey.points} points</dd>
            </div>
          </dl>
        </div>

        <SurveyProgressBar percent={survey.progressPercent} completed={completed} />

        <SurveyAction survey={survey} locked={locked} />
      </div>
    </DashboardCard>
  );
}

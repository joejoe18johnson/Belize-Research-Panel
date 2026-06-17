"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DonutBreakdown, HorizontalBarChart } from "@/components/admin/analytics/AnalyticsCharts";
import {
  CompletionTimelineChart,
  FrequencyTable,
  FunnelChart,
  RatingHistogramChart,
  StatGrid,
} from "@/components/admin/campaigns/ResearchCharts";
import { MetricCard, PageIntro } from "@/components/admin/shared/AdminUi";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import type { CampaignResultsSnapshot } from "@/lib/campaign-results-analytics";
import { SURVEY_QUESTION_TYPE_LABELS } from "@/lib/survey-types";
import { formatAdminLabel, formatHeadingCase } from "@/lib/sentence-case";

type ResultsTab = "fieldwork" | "sample" | "questions" | "roster";

const TABS: { id: ResultsTab; label: string }[] = [
  { id: "fieldwork", label: "Fieldwork" },
  { id: "sample", label: "Sample profile" },
  { id: "questions", label: "Question analysis" },
  { id: "roster", label: "Panelist roster" },
];

function statusBadgeClass(status: CampaignResultsSnapshot["campaign"]["status"]): string {
  if (status === "active") return "bg-teal-100 text-teal-900 dark:text-teal-100";
  if (status === "closed") return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300";
  return "bg-amber-100 text-amber-900";
}

export function AdminCampaignResultsClient({ snapshot }: { snapshot: CampaignResultsSnapshot }) {
  const [tab, setTab] = useState<ResultsTab>("fieldwork");
  const { campaign, fieldwork } = snapshot;

  const funnelSteps = useMemo(
    () => [
      { label: "Assigned", count: fieldwork.assigned, percent: 100 },
      {
        label: "Started",
        count: Math.round((fieldwork.cooperationRate / 100) * fieldwork.assigned),
        percent: fieldwork.cooperationRate,
      },
      {
        label: "Completed",
        count: fieldwork.completed,
        percent: fieldwork.responseRate,
      },
    ],
    [fieldwork]
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageIntro
          eyebrow="Campaign results"
          title={campaign.title}
          description={`Research analytics for fieldwork delivery, sample composition, and survey item analysis. ${campaign.targetingLabel} · Due ${campaign.completeByDate}.`}
        />
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/campaigns"
            className="inline-flex min-h-11 items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950"
          >
            Back to campaigns
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(campaign.status)}`}>
          {formatAdminLabel(campaign.status)}
        </span>
        <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {formatAdminLabel(campaign.category)}
        </span>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 dark:text-teal-200">
          {snapshot.isInternal ? "On-site survey" : "External link"}
        </span>
        {snapshot.surveyTitle ? (
          <span className="text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
            Instrument: <strong>{snapshot.surveyTitle}</strong>
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Assigned (n)" value={fieldwork.assigned} hint="Target sample" />
        <MetricCard label="Response rate" value={`${fieldwork.responseRate}%`} hint="Completed ÷ assigned" />
        <MetricCard
          label="95% CI"
          value={`${fieldwork.responseRateCi.low}–${fieldwork.responseRateCi.high}%`}
          hint="Wilson score interval"
        />
        <MetricCard label="Cooperation" value={`${fieldwork.cooperationRate}%`} hint="Started ÷ assigned" />
        <MetricCard label="Completion" value={`${fieldwork.completionRate}%`} hint="Submitted ÷ started" />
        <MetricCard
          label="Median time"
          value={fieldwork.medianCompletionMinutes !== null ? `${fieldwork.medianCompletionMinutes} min` : "—"}
          hint="Start to submit"
        />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
              tab === item.id
                ? "border border-b-0 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-teal-900 dark:text-teal-100"
                : "text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950 hover:text-teal-800 dark:text-teal-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "fieldwork" ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <FunnelChart steps={funnelSteps} title="Fieldwork funnel" />
            <DonutBreakdown rows={snapshot.statusBreakdown} title="Assignment status mix" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <CompletionTimelineChart rows={snapshot.completionTimeline} title="Completion timeline" />
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Fieldwork indicators")}</h3>
              <StatGrid
                stats={[
                  { label: "Pending", value: fieldwork.pending, hint: "Not yet opened" },
                  { label: "In progress", value: fieldwork.inProgress, hint: "Partial completion" },
                  { label: "Overdue", value: fieldwork.overdue, hint: "Past due date" },
                  { label: "Dropout rate", value: `${fieldwork.dropoutRate}%`, hint: "Started but not submitted" },
                  {
                    label: "Mean completion time",
                    value: fieldwork.meanCompletionMinutes !== null ? `${fieldwork.meanCompletionMinutes} min` : "—",
                  },
                  { label: "Submitted questionnaires", value: snapshot.submittedResponseCount },
                ]}
              />
            </div>
          </div>
          {!snapshot.isInternal ? (
            <BrandedAlert tone="info" title="External survey delivery" showIcon>
              This campaign uses an external survey link. Fieldwork metrics reflect panel delivery and completion
              tracking only. Link question-level analysis to an on-site survey instrument for full crosstabs and
              distributions.
            </BrandedAlert>
          ) : null}
        </div>
      ) : null}

      {tab === "sample" ? (
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
            Compare the assigned sample with completed respondents to assess coverage bias across geography and
            demographics.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <HorizontalBarChart rows={snapshot.assignedDemographics.byDistrict} title="Assigned — by district" />
            <HorizontalBarChart rows={snapshot.completerDemographics.byDistrict} title="Completers — by district" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <HorizontalBarChart rows={snapshot.assignedDemographics.bySex} title="Assigned — by sex" />
            <HorizontalBarChart rows={snapshot.completerDemographics.bySex} title="Completers — by sex" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <HorizontalBarChart rows={snapshot.assignedDemographics.byAgeGroup} title="Assigned — by age group" />
            <HorizontalBarChart rows={snapshot.completerDemographics.byAgeGroup} title="Completers — by age group" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <HorizontalBarChart rows={snapshot.completerDemographics.byConstituency} title="Completers — by constituency" />
            <HorizontalBarChart rows={snapshot.completerDemographics.byEducation} title="Completers — by education" />
          </div>
        </div>
      ) : null}

      {tab === "questions" ? (
        <div className="space-y-6">
          {!snapshot.isInternal ? (
            <BrandedAlert tone="info" title="On-site survey required" showIcon>
              Question-level analysis is available for campaigns that use an on-site survey built in Survey Builder.
            </BrandedAlert>
          ) : snapshot.questions.length === 0 ? (
            <BrandedAlert tone="info" showIcon>
              No submitted responses yet. Distributions and scale statistics will appear as panelists complete the
              survey.
            </BrandedAlert>
          ) : (
            snapshot.questions.map((question, index) => (
              <section key={question.questionId} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-teal-700">Q{index + 1}</p>
                    <h3 className="mt-1 text-base font-semibold text-teal-950 dark:text-teal-100">{question.title}</h3>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                      {SURVEY_QUESTION_TYPE_LABELS[question.type]}
                      {question.required ? " · Required" : " · Optional"}
                    </p>
                  </div>
                  <div className="text-right text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
                    <p>
                      <strong>{question.nAnswered}</strong> / {question.nSubmitted} answered
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">Item non-response: {question.itemNonresponseRate}%</p>
                  </div>
                </div>

                {question.ratingStats ? (
                  <div className="mt-5 space-y-4">
                    <StatGrid
                      stats={[
                        { label: "Mean", value: question.ratingStats.mean },
                        { label: "Median", value: question.ratingStats.median },
                        { label: "Std. dev.", value: question.ratingStats.stdDev },
                        { label: "Min", value: question.ratingStats.min },
                        { label: "Max", value: question.ratingStats.max },
                        { label: "n", value: question.ratingStats.n },
                      ]}
                    />
                    <RatingHistogramChart bins={question.histogram} title="Scale distribution" />
                  </div>
                ) : null}

                {question.type === "short_text" || question.type === "long_text" ? (
                  <div className="mt-5">
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Verbatim responses</p>
                    {question.textSamples.length === 0 ? (
                      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">No text responses yet.</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {question.textSamples.map((sample, sampleIndex) => (
                          <li
                            key={`${question.questionId}-${sampleIndex}`}
                            className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300"
                          >
                            {sample}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <FrequencyTable
                      rows={question.distribution}
                      title="Frequency distribution"
                      denominatorLabel={
                        question.type === "multiple_choice"
                          ? "Percentages based on respondents (multiple selections allowed)"
                          : "Percentages based on valid responses"
                      }
                    />
                    <HorizontalBarChart rows={question.distribution} title="Response chart" maxBars={20} />
                  </div>
                )}
              </section>
            ))
          )}
        </div>
      ) : null}

      {tab === "roster" ? (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Panelist roster")}</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">Individual assignment status and completion progress.</p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
                  <th className="px-4 py-3">Panelist</th>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Constituency</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Progress</th>
                  <th className="px-4 py-3">Due</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.assignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                      No assignments found for this campaign.
                    </td>
                  </tr>
                ) : (
                  snapshot.assignments.map((row) => (
                    <tr key={row.panelistEmail} className="border-b border-zinc-50 hover:bg-teal-50/20">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-zinc-800 dark:text-zinc-200">{row.panelistName}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{row.panelistEmail}</p>
                      </td>
                      <td className="px-4 py-2.5">{row.district || "—"}</td>
                      <td className="px-4 py-2.5">{row.constituency || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            row.overdue
                              ? "bg-red-100 text-red-800"
                              : row.status === "completed"
                                ? "bg-teal-700 text-white"
                                : row.status === "in_progress"
                                  ? "bg-teal-100 text-teal-900 dark:text-teal-100"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {formatAdminLabel(
                            row.overdue ? "overdue" : row.status === "available" ? "pending" : row.status.replace(/_/g, " "),
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{row.progressPercent}%</td>
                      <td className="px-4 py-2.5 tabular-nums text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{row.completeByDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

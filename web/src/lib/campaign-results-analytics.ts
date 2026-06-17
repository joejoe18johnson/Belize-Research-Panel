import type { AnalyticsCountRow } from "./admin-analytics";
import { panelistToAnalyticsSlice } from "./admin-analytics";
import type { CampaignAssignmentDetail, CampaignRecord } from "./campaign-targeting";
import { buildCampaignAssignmentDetails } from "./campaign-targeting";
import type { PanelistRow } from "./panelists";
import type { PanelistSurveyRecord } from "./panelist-surveys-types";
import type { SurveyResponseRecord } from "./survey-responses";
import type { SurveyQuestion, SurveyQuestionType } from "./survey-types";
import { hasAnswerForQuestion } from "./survey-types";
import type { SurveyDefinition } from "./survey-types";
import { cleanText } from "./validation";

export interface WilsonInterval {
  low: number;
  high: number;
}

export interface CampaignFieldworkMetrics {
  assigned: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  responseRate: number;
  cooperationRate: number;
  completionRate: number;
  dropoutRate: number;
  responseRateCi: WilsonInterval;
  medianCompletionMinutes: number | null;
  meanCompletionMinutes: number | null;
}

export interface CompletionByDay {
  date: string;
  count: number;
}

export interface RatingScaleStats {
  n: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
}

export interface RatingHistogramBin {
  value: number;
  count: number;
  percent: number;
}

export interface QuestionAnalysis {
  questionId: string;
  title: string;
  type: SurveyQuestionType;
  required: boolean;
  nSubmitted: number;
  nAnswered: number;
  itemNonresponseRate: number;
  distribution: AnalyticsCountRow[];
  ratingStats: RatingScaleStats | null;
  histogram: RatingHistogramBin[];
  textSamples: string[];
}

export interface CampaignResultsSnapshot {
  campaign: {
    id: string;
    title: string;
    description: string;
    category: CampaignRecord["category"];
    status: CampaignRecord["status"];
    targetingLabel: string;
    assignedDate: string;
    completeByDate: string;
    points: number;
    deliveryType: CampaignRecord["deliveryType"];
    surveyUrl: string;
    surveyDefinitionId: string | null;
  };
  surveyTitle: string | null;
  isInternal: boolean;
  fieldwork: CampaignFieldworkMetrics;
  statusBreakdown: AnalyticsCountRow[];
  completionTimeline: CompletionByDay[];
  completerDemographics: {
    byDistrict: AnalyticsCountRow[];
    byConstituency: AnalyticsCountRow[];
    bySex: AnalyticsCountRow[];
    byAgeGroup: AnalyticsCountRow[];
    byEducation: AnalyticsCountRow[];
  };
  assignedDemographics: {
    byDistrict: AnalyticsCountRow[];
    bySex: AnalyticsCountRow[];
    byAgeGroup: AnalyticsCountRow[];
  };
  questions: QuestionAnalysis[];
  assignments: CampaignAssignmentDetail[];
  submittedResponseCount: number;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function wilsonInterval(successes: number, n: number, z = 1.96): WilsonInterval {
  if (n <= 0) return { low: 0, high: 0 };
  const p = successes / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const centre = p + z2 / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n);
  return {
    low: round1(Math.max(0, ((centre - margin) / denom) * 100)),
    high: round1(Math.min(1, ((centre + margin) / denom) * 100)),
  };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function toCountRows(map: Map<string, number>, total: number): AnalyticsCountRow[] {
  const denom = total || 1;
  return [...map.entries()]
    .map(([label, count]) => ({
      label,
      count,
      percent: round1((count / denom) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

function countSlices(
  emails: string[],
  panelistMap: Map<string, PanelistRow>,
  pick: (slice: ReturnType<typeof panelistToAnalyticsSlice>) => string
): AnalyticsCountRow[] {
  const map = new Map<string, number>();
  for (const email of emails) {
    const row = panelistMap.get(email);
    if (!row) continue;
    const slice = panelistToAnalyticsSlice(row);
    const key = pick(slice) || "Unknown";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return toCountRows(map, emails.length);
}

function responseCompletionMinutes(response: SurveyResponseRecord): number | null {
  if (!response.submittedAt) return null;
  const start = Date.parse(response.startedAt);
  const end = Date.parse(response.submittedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return (end - start) / 60_000;
}

function buildCompletionTimeline(responses: SurveyResponseRecord[]): CompletionByDay[] {
  const map = new Map<string, number>();
  for (const response of responses) {
    if (!response.submittedAt) continue;
    const date = response.submittedAt.slice(0, 10);
    map.set(date, (map.get(date) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function analyzeQuestion(
  question: SurveyQuestion,
  responses: SurveyResponseRecord[],
  nSubmitted: number
): QuestionAnalysis {
  const distributionMap = new Map<string, number>();
  const ratingValues: number[] = [];
  const textSamples: string[] = [];
  let nAnswered = 0;

  for (const response of responses) {
    if (!response.submittedAt) continue;
    const value = response.answers[question.id];
    if (!hasAnswerForQuestion(question, value)) continue;
    nAnswered += 1;

    if (question.type === "multiple_choice" && Array.isArray(value)) {
      for (const option of value) {
        const label = cleanText(String(option)) || "Other";
        distributionMap.set(label, (distributionMap.get(label) ?? 0) + 1);
      }
      continue;
    }

    if (question.type === "rating_scale" && typeof value === "number") {
      ratingValues.push(value);
      const label = String(value);
      distributionMap.set(label, (distributionMap.get(label) ?? 0) + 1);
      continue;
    }

    if (question.type === "short_text" || question.type === "long_text") {
      const text = cleanText(String(value));
      if (text) textSamples.push(text);
      continue;
    }

    const label = cleanText(String(value)) || "Other";
    distributionMap.set(label, (distributionMap.get(label) ?? 0) + 1);
  }

  const distributionDenom =
    question.type === "multiple_choice" ? Math.max(nAnswered, 1) : Math.max(nSubmitted, 1);
  const distribution = toCountRows(distributionMap, distributionDenom);

  const histogram: RatingHistogramBin[] = [];
  if (question.type === "rating_scale" && ratingValues.length > 0) {
    const min = question.scaleMin;
    const max = question.scaleMax;
    for (let value = min; value <= max; value += 1) {
      const count = ratingValues.filter((item) => item === value).length;
      histogram.push({
        value,
        count,
        percent: round1((count / ratingValues.length) * 100),
      });
    }
  }

  const ratingStats: RatingScaleStats | null =
    ratingValues.length > 0
      ? {
          n: ratingValues.length,
          mean: round1(ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length),
          median: round1(median(ratingValues)),
          stdDev: round1(stdDev(ratingValues)),
          min: Math.min(...ratingValues),
          max: Math.max(...ratingValues),
        }
      : null;

  return {
    questionId: question.id,
    title: question.title || "Untitled question",
    type: question.type,
    required: question.required,
    nSubmitted,
    nAnswered,
    itemNonresponseRate: nSubmitted ? round1(((nSubmitted - nAnswered) / nSubmitted) * 100) : 0,
    distribution,
    ratingStats,
    histogram,
    textSamples: textSamples.slice(0, 8),
  };
}

export function buildCampaignResultsSnapshot(input: {
  campaign: CampaignRecord;
  targetingLabel: string;
  assignments: PanelistSurveyRecord[];
  responses: SurveyResponseRecord[];
  panelistMap: Map<string, PanelistRow>;
  surveyDefinition: SurveyDefinition | null;
}): CampaignResultsSnapshot {
  const { campaign, assignments, responses, panelistMap, surveyDefinition } = input;
  const campaignAssignments = assignments.filter((record) => record.id === campaign.id);
  const assignmentDetails = buildCampaignAssignmentDetails(campaign.id, assignments, panelistMap);

  const pending = campaignAssignments.filter((record) => record.status === "available").length;
  const inProgress = campaignAssignments.filter((record) => record.status === "in_progress").length;
  const completed = campaignAssignments.filter((record) => record.status === "completed").length;
  const assigned = campaignAssignments.length;
  const overdue = assignmentDetails.filter((row) => row.overdue).length;
  const started = responses.length;
  const submittedResponses = responses.filter((record) => record.submittedAt);
  const submittedResponseCount = submittedResponses.length;

  const completionDurations = submittedResponses
    .map(responseCompletionMinutes)
    .filter((value): value is number => value !== null);

  const fieldwork: CampaignFieldworkMetrics = {
    assigned,
    pending,
    inProgress,
    completed,
    overdue,
    responseRate: assigned ? round1((completed / assigned) * 100) : 0,
    cooperationRate: assigned ? round1((started / assigned) * 100) : 0,
    completionRate: started ? round1((submittedResponseCount / started) * 100) : 0,
    dropoutRate: started ? round1(((started - submittedResponseCount) / started) * 100) : 0,
    responseRateCi: wilsonInterval(completed, assigned),
    medianCompletionMinutes: completionDurations.length ? round1(median(completionDurations)) : null,
    meanCompletionMinutes: completionDurations.length
      ? round1(completionDurations.reduce((sum, value) => sum + value, 0) / completionDurations.length)
      : null,
  };

  const statusBreakdown = toCountRows(
    new Map([
      ["Pending", pending],
      ["In progress", inProgress],
      ["Completed", completed],
      ["Overdue", overdue],
    ]),
    assigned
  );

  const completerEmails = submittedResponses.map((record) => cleanText(record.panelistEmail).toLowerCase());
  const assignedEmails = campaignAssignments.map((record) => cleanText(record.panelistEmail ?? "").toLowerCase()).filter(Boolean);

  const questions =
    surveyDefinition && campaign.deliveryType === "internal"
      ? surveyDefinition.questions.map((question) =>
          analyzeQuestion(question, submittedResponses, submittedResponseCount)
        )
      : [];

  return {
    campaign: {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      category: campaign.category,
      status: campaign.status,
      targetingLabel: input.targetingLabel,
      assignedDate: campaign.assignedDate,
      completeByDate: campaign.completeByDate,
      points: campaign.points,
      deliveryType: campaign.deliveryType,
      surveyUrl: campaign.surveyUrl,
      surveyDefinitionId: campaign.surveyDefinitionId ?? null,
    },
    surveyTitle: surveyDefinition?.title ?? null,
    isInternal: campaign.deliveryType === "internal",
    fieldwork,
    statusBreakdown,
    completionTimeline: buildCompletionTimeline(submittedResponses),
    completerDemographics: {
      byDistrict: countSlices(completerEmails, panelistMap, (slice) => slice.district),
      byConstituency: countSlices(completerEmails, panelistMap, (slice) => slice.constituency),
      bySex: countSlices(completerEmails, panelistMap, (slice) => slice.sex),
      byAgeGroup: countSlices(completerEmails, panelistMap, (slice) => slice.ageGroup),
      byEducation: countSlices(completerEmails, panelistMap, (slice) => slice.education),
    },
    assignedDemographics: {
      byDistrict: countSlices(assignedEmails, panelistMap, (slice) => slice.district),
      bySex: countSlices(assignedEmails, panelistMap, (slice) => slice.sex),
      byAgeGroup: countSlices(assignedEmails, panelistMap, (slice) => slice.ageGroup),
    },
    questions,
    assignments: assignmentDetails,
    submittedResponseCount,
  };
}

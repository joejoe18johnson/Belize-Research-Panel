import type { AnalyticsCountRow } from "./admin-analytics";
import { panelistToAnalyticsSlice } from "./admin-analytics";
import type { CampaignResultsSnapshot } from "./campaign-results-analytics";
import { csvSection, rowsToCsv, withCsvBom } from "./csv-utils";
import type { PanelistRow } from "./panelists";
import type { SurveyResponseRecord } from "./survey-responses";
import type { SurveyDefinition, SurveyQuestion } from "./survey-types";
import { SURVEY_QUESTION_TYPE_LABELS } from "./survey-types";
import { cleanText } from "./validation";

function formatIsoDate(iso: string): string {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return iso;
  return new Date(parsed).toISOString();
}

function countRowsToTable(rows: AnalyticsCountRow[]): unknown[][] {
  return rows.map((row) => [row.label, row.count, row.percent]);
}

function formatAnswerForCsv(question: SurveyQuestion, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) return value.map((item) => cleanText(String(item))).filter(Boolean).join(" | ");
  return cleanText(String(value));
}

function buildMicrodataRows(
  snapshot: CampaignResultsSnapshot,
  surveyDefinition: SurveyDefinition | null,
  responses: SurveyResponseRecord[],
  panelistMap: Map<string, PanelistRow>
): { headers: string[]; rows: unknown[][] } {
  if (!surveyDefinition || !snapshot.isInternal) {
    return { headers: [], rows: [] };
  }

  const submitted = responses.filter((record) => record.submittedAt);
  const questionHeaders = surveyDefinition.questions.map((question, index) => {
    const slug = `Q${index + 1}_${question.id.slice(0, 8)}`;
    return slug;
  });

  const headers = [
    "respondent_id",
    "submitted_at",
    "district",
    "constituency",
    "sex",
    "age_group",
    "education",
    ...questionHeaders,
  ];

  const rows = submitted.map((response, index) => {
    const email = cleanText(response.panelistEmail).toLowerCase();
    const panelist = panelistMap.get(email);
    const slice = panelist ? panelistToAnalyticsSlice(panelist) : null;
    const base = [
      `R${String(index + 1).padStart(3, "0")}`,
      response.submittedAt ?? "",
      slice?.district ?? "",
      slice?.constituency ?? "",
      slice?.sex ?? "",
      slice?.ageGroup ?? "",
      slice?.education ?? "",
    ];
    const answers = surveyDefinition.questions.map((question) =>
      formatAnswerForCsv(question, response.answers[question.id])
    );
    return [...base, ...answers];
  });

  return { headers, rows };
}

function buildVerbatimRows(
  snapshot: CampaignResultsSnapshot,
  surveyDefinition: SurveyDefinition | null,
  responses: SurveyResponseRecord[]
): unknown[][] {
  if (!surveyDefinition || !snapshot.isInternal) return [];

  const rows: unknown[][] = [];
  const submitted = responses.filter((record) => record.submittedAt);

  surveyDefinition.questions.forEach((question, index) => {
    if (question.type !== "short_text" && question.type !== "long_text") return;

    submitted.forEach((response, responseIndex) => {
      const text = formatAnswerForCsv(question, response.answers[question.id]);
      if (!text) return;
      rows.push([
        `Q${index + 1}`,
        question.id,
        question.title,
        `R${String(responseIndex + 1).padStart(3, "0")}`,
        text,
      ]);
    });
  });

  return rows;
}

export function buildCampaignResultsCsv(input: {
  snapshot: CampaignResultsSnapshot;
  surveyDefinition: SurveyDefinition | null;
  responses: SurveyResponseRecord[];
  panelistMap: Map<string, PanelistRow>;
  generatedAt?: string;
}): string {
  const { snapshot, surveyDefinition, responses, panelistMap } = input;
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const { campaign, fieldwork } = snapshot;

  const sections: string[] = [
    rowsToCsv(
      ["field", "value"],
      [
        ["platform", "Belize Research Panel"],
        ["export_type", "Campaign results — scientific data package"],
        ["generated_at_utc", formatIsoDate(generatedAt)],
        ["campaign_id", campaign.id],
        ["campaign_title", campaign.title],
        ["campaign_description", campaign.description],
        ["survey_instrument", snapshot.surveyTitle ?? ""],
        ["category", campaign.category],
        ["status", campaign.status],
        ["targeting", campaign.targetingLabel],
        ["field_start", campaign.assignedDate],
        ["field_end", campaign.completeByDate],
        ["delivery_type", campaign.deliveryType],
        ["reward_points", campaign.points],
        ["methodology_note", "Unweighted frequency distributions; response rate CI uses Wilson score interval (95%)."],
      ]
    ),
    csvSection(
      "FIELDWORK_INDICATORS",
      ["indicator", "value", "definition"],
      [
        ["assigned_n", fieldwork.assigned, "Panelists assigned to the study"],
        ["completed_n", fieldwork.completed, "Assignments marked complete"],
        ["pending_n", fieldwork.pending, "Not yet opened"],
        ["in_progress_n", fieldwork.inProgress, "Partially completed"],
        ["overdue_n", fieldwork.overdue, "Past due date without completion"],
        ["response_rate_pct", fieldwork.responseRate, "Completed ÷ assigned"],
        ["response_rate_ci_low_pct", fieldwork.responseRateCi.low, "Wilson 95% CI lower bound"],
        ["response_rate_ci_high_pct", fieldwork.responseRateCi.high, "Wilson 95% CI upper bound"],
        ["cooperation_rate_pct", fieldwork.cooperationRate, "Started ÷ assigned"],
        ["completion_rate_pct", fieldwork.completionRate, "Submitted ÷ started"],
        ["dropout_rate_pct", fieldwork.dropoutRate, "Started but not submitted"],
        ["median_completion_minutes", fieldwork.medianCompletionMinutes ?? "", "Median time from start to submit"],
        ["mean_completion_minutes", fieldwork.meanCompletionMinutes ?? "", "Mean time from start to submit"],
        ["submitted_questionnaires_n", snapshot.submittedResponseCount, "Validated submissions"],
      ]
    ),
    csvSection("STATUS_BREAKDOWN", ["status", "n", "percent"], countRowsToTable(snapshot.statusBreakdown)),
    csvSection(
      "COMPLETION_TIMELINE",
      ["date", "completed_n"],
      snapshot.completionTimeline.map((row) => [row.date, row.count])
    ),
    csvSection(
      "ASSIGNED_DEMOGRAPHICS_DISTRICT",
      ["district", "n", "percent"],
      countRowsToTable(snapshot.assignedDemographics.byDistrict)
    ),
    csvSection(
      "ASSIGNED_DEMOGRAPHICS_SEX",
      ["sex", "n", "percent"],
      countRowsToTable(snapshot.assignedDemographics.bySex)
    ),
    csvSection(
      "ASSIGNED_DEMOGRAPHICS_AGE_GROUP",
      ["age_group", "n", "percent"],
      countRowsToTable(snapshot.assignedDemographics.byAgeGroup)
    ),
    csvSection(
      "COMPLETER_DEMOGRAPHICS_DISTRICT",
      ["district", "n", "percent"],
      countRowsToTable(snapshot.completerDemographics.byDistrict)
    ),
    csvSection(
      "COMPLETER_DEMOGRAPHICS_CONSTITUENCY",
      ["constituency", "n", "percent"],
      countRowsToTable(snapshot.completerDemographics.byConstituency)
    ),
    csvSection(
      "COMPLETER_DEMOGRAPHICS_SEX",
      ["sex", "n", "percent"],
      countRowsToTable(snapshot.completerDemographics.bySex)
    ),
    csvSection(
      "COMPLETER_DEMOGRAPHICS_AGE_GROUP",
      ["age_group", "n", "percent"],
      countRowsToTable(snapshot.completerDemographics.byAgeGroup)
    ),
    csvSection(
      "COMPLETER_DEMOGRAPHICS_EDUCATION",
      ["education", "n", "percent"],
      countRowsToTable(snapshot.completerDemographics.byEducation)
    ),
  ];

  snapshot.questions.forEach((question, index) => {
    sections.push(
      csvSection(
        `QUESTION_Q${index + 1}_METADATA`,
        ["field", "value"],
        [
          ["question_id", question.questionId],
          ["question_number", index + 1],
          ["title", question.title],
          ["type", SURVEY_QUESTION_TYPE_LABELS[question.type]],
          ["required", question.required ? "yes" : "no"],
          ["n_submitted", question.nSubmitted],
          ["n_answered", question.nAnswered],
          ["item_nonresponse_rate_pct", question.itemNonresponseRate],
        ]
      )
    );

    sections.push(
      csvSection(
        `QUESTION_Q${index + 1}_FREQUENCIES`,
        ["response", "n", "percent"],
        question.distribution.map((row) => [row.label, row.count, row.percent])
      )
    );

    if (question.ratingStats) {
      sections.push(
        csvSection(
          `QUESTION_Q${index + 1}_SCALE_STATISTICS`,
          ["statistic", "value"],
          [
            ["n", question.ratingStats.n],
            ["mean", question.ratingStats.mean],
            ["median", question.ratingStats.median],
            ["std_dev", question.ratingStats.stdDev],
            ["min", question.ratingStats.min],
            ["max", question.ratingStats.max],
          ]
        )
      );
    }
  });

  sections.push(
    csvSection(
      "PANELIST_ROSTER",
      ["panelist_name", "panelist_email", "district", "constituency", "status", "progress_percent", "complete_by", "overdue"],
      snapshot.assignments.map((row) => [
        row.panelistName,
        row.panelistEmail,
        row.district,
        row.constituency,
        row.status,
        row.progressPercent,
        row.completeByDate,
        row.overdue ? "yes" : "no",
      ])
    )
  );

  const microdata = buildMicrodataRows(snapshot, surveyDefinition, responses, panelistMap);
  if (microdata.headers.length > 0) {
    sections.push(csvSection("ANONYMIZED_MICRODATA", microdata.headers, microdata.rows));
  }

  const verbatimRows = buildVerbatimRows(snapshot, surveyDefinition, responses);
  sections.push(
    csvSection(
      "VERBATIM_TEXT_RESPONSES",
      ["question_number", "question_id", "question_title", "respondent_id", "response_text"],
      verbatimRows
    )
  );

  if (surveyDefinition && snapshot.isInternal) {
    sections.push(
      csvSection(
        "CODEBOOK",
        ["question_number", "question_id", "variable_name", "question_text", "type", "required", "response_options"],
        surveyDefinition.questions.map((question, index) => [
          index + 1,
          question.id,
          `Q${index + 1}_${question.id.slice(0, 8)}`,
          question.title,
          SURVEY_QUESTION_TYPE_LABELS[question.type],
          question.required ? "yes" : "no",
          question.options.length > 0 ? question.options.join(" | ") : "",
        ])
      )
    );
  }

  return withCsvBom(sections.join("\n"));
}

export function campaignExportFilename(campaignId: string, extension: "csv" | "pdf"): string {
  const date = new Date().toISOString().slice(0, 10);
  const slug = cleanText(campaignId).replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 48);
  return extension === "csv" ? `${slug}-results-${date}.csv` : `${slug}-research-report-${date}.pdf`;
}

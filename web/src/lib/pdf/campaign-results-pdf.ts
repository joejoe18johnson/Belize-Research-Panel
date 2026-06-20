import type { CampaignResultsSnapshot } from "@/lib/campaign-results-analytics";
import { SURVEY_QUESTION_TYPE_LABELS } from "@/lib/survey-types";
import { BrandedPdfBuilder } from "./branded-pdf-builder";

export async function buildCampaignResultsPdf(input: {
  snapshot: CampaignResultsSnapshot;
  audience?: "admin" | "client";
  clientName?: string | null;
}): Promise<Uint8Array> {
  const { snapshot, audience = "admin", clientName } = input;
  const { campaign, fieldwork } = snapshot;
  const isClient = audience === "client";

  const pdf = await BrandedPdfBuilder.create({
    documentTitle: isClient ? "Research Report" : "Campaign Results Report",
    documentSubtitle: campaign.title,
    referenceId: campaign.id.slice(0, 12).toUpperCase(),
    generatedAt: new Date().toLocaleString("en-BZ", { dateStyle: "medium", timeStyle: "short" }),
    confidential: true,
  });

  pdf.addParagraph(
    isClient
      ? `Prepared for ${clientName ?? "client stakeholders"}. Metrics use unweighted frequency distributions with Wilson 95% confidence intervals on response rates.`
      : "Scientific data package summarising fieldwork delivery, sample composition, and survey item analysis for internal research operations.",
    { muted: true }
  );

  pdf.addSectionTitle("Study overview");
  pdf.addKeyValueGrid([
    { label: "Campaign", value: campaign.title },
    { label: "Category", value: campaign.category },
    { label: "Status", value: campaign.status },
    { label: "Targeting", value: campaign.targetingLabel },
    { label: "Survey instrument", value: snapshot.surveyTitle ?? "—" },
    { label: "Field period", value: `${campaign.assignedDate} → ${campaign.completeByDate}` },
    { label: "Reward points", value: String(campaign.points) },
    { label: "Delivery", value: campaign.deliveryType },
  ]);

  pdf.addSectionTitle("Fieldwork indicators");
  pdf.addKeyValueGrid([
    { label: "Assigned (n)", value: String(fieldwork.assigned) },
    { label: "Completed (n)", value: String(fieldwork.completed) },
    { label: "Response rate", value: `${fieldwork.responseRate.toFixed(1)}%` },
    {
      label: "95% CI",
      value: `${fieldwork.responseRateCi.low.toFixed(1)}% – ${fieldwork.responseRateCi.high.toFixed(1)}%`,
    },
    { label: "Cooperation rate", value: `${fieldwork.cooperationRate.toFixed(1)}%` },
    { label: "Completion rate", value: `${fieldwork.completionRate.toFixed(1)}%` },
    { label: "Dropout rate", value: `${fieldwork.dropoutRate.toFixed(1)}%` },
    {
      label: "Median completion",
      value: fieldwork.medianCompletionMinutes != null ? `${fieldwork.medianCompletionMinutes} min` : "—",
    },
  ]);

  if (snapshot.completerDemographics.byDistrict.length > 0) {
    pdf.addSectionTitle("Completer profile — district");
    pdf.addTable(
      ["District", "n", "%"],
      snapshot.completerDemographics.byDistrict.slice(0, 10).map((row) => [
        row.label,
        String(row.count),
        `${row.percent.toFixed(1)}%`,
      ]),
      [220, 80, 80]
    );
  }

  if (snapshot.completerDemographics.bySex.length > 0) {
    pdf.addSectionTitle("Completer profile — sex");
    pdf.addTable(
      ["Sex", "n", "%"],
      snapshot.completerDemographics.bySex.map((row) => [row.label, String(row.count), `${row.percent.toFixed(1)}%`]),
      [220, 80, 80]
    );
  }

  const questionsToShow = snapshot.questions.slice(0, 8);
  if (questionsToShow.length > 0) {
    pdf.addSectionTitle("Question highlights");
    pdf.addParagraph(
      "Top response categories per survey item (unweighted). Full microdata and codebook available in the CSV export.",
      { muted: true, size: 9 }
    );

    questionsToShow.forEach((question, index) => {
      pdf.addParagraph(`Q${index + 1}. ${question.title}`, { size: 10 });
      pdf.addParagraph(
        `${SURVEY_QUESTION_TYPE_LABELS[question.type]} · n=${question.nAnswered} · nonresponse ${question.itemNonresponseRate.toFixed(1)}%`,
        { muted: true, size: 8.5 }
      );

      const topRows = question.distribution.slice(0, 5).map((row) => [
        row.label,
        String(row.count),
        `${row.percent.toFixed(1)}%`,
      ]);

      if (topRows.length > 0) {
        pdf.addTable(["Response", "n", "%"], topRows, [240, 70, 70]);
      }

      if (question.ratingStats) {
        pdf.addKeyValueGrid([
          { label: "Mean", value: question.ratingStats.mean.toFixed(2) },
          { label: "Median", value: question.ratingStats.median.toFixed(2) },
          { label: "Std dev", value: question.ratingStats.stdDev.toFixed(2) },
          { label: "Range", value: `${question.ratingStats.min}–${question.ratingStats.max}` },
        ]);
      }
    });
  }

  pdf.addDivider();
  pdf.addParagraph(
    isClient
      ? "Belize Research Panel — Client Reporting Portal. This document is confidential and intended for authorised recipients only."
      : "Belize Research Panel — Admin research export. For full anonymised microdata, verbatim responses, and codebook, download the CSV data package.",
    { muted: true, size: 9 }
  );

  return pdf.toBytes();
}

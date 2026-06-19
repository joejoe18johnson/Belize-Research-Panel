import type { CampaignResultsSnapshot } from "./campaign-results-analytics";

/** Client-facing view: aggregate analytics only — no panelist identifiers. */
export function redactCampaignResultsForClient(snapshot: CampaignResultsSnapshot): CampaignResultsSnapshot {
  return {
    ...snapshot,
    assignments: [],
    respondentAnswers: snapshot.respondentAnswers.map((record) => ({
      ...record,
      panelistName: null,
      panelistEmail: null,
    })),
    questions: snapshot.questions.map((question) => ({
      ...question,
      textSamples: question.textSamples.map((sample, index) => `Verbatim ${index + 1}: ${sample}`),
    })),
  };
}

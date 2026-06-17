import type { CampaignSummary } from "./campaign-targeting";

/** Campaign fieldwork is finished — all assignments submitted. */
export function isCampaignFullyCompleted(summary: CampaignSummary): boolean {
  return summary.assigned > 0 && summary.completed === summary.assigned;
}

/** Campaigns that should notify admin (fully completed or explicitly closed). */
export function isCampaignAdminNotifiable(summary: CampaignSummary): boolean {
  return summary.status === "closed" || isCampaignFullyCompleted(summary);
}

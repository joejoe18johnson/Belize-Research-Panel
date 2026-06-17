import { payoutShortId } from "./admin-payout-display";
import type { DashboardRewardSummary, PanelistDashboardProfile } from "./panelist-dashboard";
import type { PanelistSurvey } from "./panelist-surveys";
import type { RedemptionRequest, RedemptionRequestStatus } from "./reward-redemption";

export type RewardsHistoryKind = "earned" | "withdrawal";

export interface RewardsHistoryEntry {
  id: string;
  kind: RewardsHistoryKind;
  title: string;
  detail: string;
  points: number;
  amountBz?: number;
  status?: RedemptionRequestStatus;
  sortDate: string;
  dateLabel: string;
  referenceId?: string;
}

function parseSortDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return new Date(0).toISOString();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const date = new Date(trimmed.includes("T") ? trimmed : `${trimmed}T12:00:00`);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
  return new Date(0).toISOString();
}

function formatHistoryDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-BZ", { day: "numeric", month: "short", year: "numeric" });
}

function withdrawalStatusDetail(status: RedemptionRequestStatus, updatedAt: string): string {
  const updatedLabel = formatHistoryDate(updatedAt);
  switch (status) {
    case "pending":
      return "Submitted — waiting for review";
    case "approved":
      return "Being processed by our team";
    case "fulfilled":
      return `Completed on ${updatedLabel}`;
    case "rejected":
      return `Not approved on ${updatedLabel} — points returned to your balance`;
    default:
      return status;
  }
}

export function buildRewardsHistory(input: {
  rewards: DashboardRewardSummary;
  profile: Pick<PanelistDashboardProfile, "registrationDate" | "verificationStatus">;
  completedSurveys: PanelistSurvey[];
  redemptionRequests: RedemptionRequest[];
}): RewardsHistoryEntry[] {
  const entries: RewardsHistoryEntry[] = [];
  const registrationDate = parseSortDate(input.profile.registrationDate);

  if (input.rewards.registrationPoints > 0) {
    entries.push({
      id: "earned-registration",
      kind: "earned",
      title: "Registration completed",
      detail: "Points for joining the Belize Research Panel",
      points: input.rewards.registrationPoints,
      sortDate: registrationDate,
      dateLabel: formatHistoryDate(registrationDate),
    });
  }

  if (input.rewards.verified && input.rewards.verificationPoints > 0) {
    entries.push({
      id: "earned-verification",
      kind: "earned",
      title: "Account verified",
      detail: "Points for completing panelist verification",
      points: input.rewards.verificationPoints,
      sortDate: registrationDate,
      dateLabel: formatHistoryDate(registrationDate),
    });
  }

  for (const survey of input.completedSurveys) {
    if (survey.points <= 0) continue;
    const sortDate = parseSortDate(survey.completedDate ?? survey.assignedDate);
    entries.push({
      id: `earned-survey-${survey.id}`,
      kind: "earned",
      title: `Survey completed — ${survey.title}`,
      detail: `${survey.points} points awarded`,
      points: survey.points,
      sortDate,
      dateLabel: survey.completedDateLabel ?? survey.assignedDateLabel,
    });
  }

  for (const request of input.redemptionRequests) {
    const amountBz = request.amountBz ?? request.points / 25;
    const sortDate =
      request.status === "fulfilled" || request.status === "rejected"
        ? request.updatedAt
        : request.submittedAt;

    entries.push({
      id: `withdrawal-${request.id}`,
      kind: "withdrawal",
      title: request.optionLabel,
      detail: withdrawalStatusDetail(request.status, request.updatedAt),
      points: -request.points,
      amountBz,
      status: request.status,
      sortDate,
      dateLabel: formatHistoryDate(request.submittedAt),
      referenceId: payoutShortId(request.id),
    });
  }

  return entries.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}

export function withdrawalStatusLabel(status: RedemptionRequestStatus): string {
  switch (status) {
    case "pending":
      return "Pending review";
    case "approved":
      return "Processing";
    case "fulfilled":
      return "Completed";
    case "rejected":
      return "Not approved";
    default:
      return status;
  }
}

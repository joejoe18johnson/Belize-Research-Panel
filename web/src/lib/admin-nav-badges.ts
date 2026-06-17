import type { CampaignSummary } from "./campaign-targeting";
import { isCampaignAdminNotifiable } from "./admin-campaign-notifications";
import type { AdminDataHub } from "./admin-data-hub";
import { buildNotificationQueueRows } from "./admin-dashboard-metrics";
import type { AdminReadState } from "./admin-read-state";
import { adminNotificationId, isAdminCampaignUnread, isAdminNotificationUnread, isAdminPayoutUnread } from "./admin-read-state";

export type AdminNavBadges = Partial<Record<string, number>>;

export function buildAdminNavBadges(
  hub: AdminDataHub,
  readState: AdminReadState,
  campaignSummaries: CampaignSummary[] = []
): AdminNavBadges {
  const notificationQueue = buildNotificationQueueRows(hub);
  const unreadNotifications = notificationQueue.filter((row) =>
    isAdminNotificationUnread(readState, adminNotificationId(row.type, row.email))
  );

  const newPayouts = hub.redemptionRequests.filter(
    (request) => request.status === "pending" && isAdminPayoutUnread(readState, request.id)
  );

  const newCompletedCampaigns = unreadCompletedCampaignIds(campaignSummaries, readState);

  const badges: AdminNavBadges = {};

  if (unreadNotifications.length > 0) {
    badges.notifications = unreadNotifications.length;
  }

  if (newPayouts.length > 0) {
    badges.payouts = newPayouts.length;
  }

  if (newCompletedCampaigns.length > 0) {
    badges.campaigns = newCompletedCampaigns.length;
  }

  return badges;
}

export function unreadCompletedCampaignIds(
  summaries: CampaignSummary[],
  readState: AdminReadState
): string[] {
  return summaries
    .filter((summary) => isCampaignAdminNotifiable(summary) && isAdminCampaignUnread(readState, summary.id))
    .map((summary) => summary.id);
}

export function unreadAdminNotificationIds(hub: AdminDataHub, readState: AdminReadState): string[] {
  return buildNotificationQueueRows(hub)
    .filter((row) => isAdminNotificationUnread(readState, adminNotificationId(row.type, row.email)))
    .map((row) => adminNotificationId(row.type, row.email));
}

export function unreadNewPayoutIds(hub: AdminDataHub, readState: AdminReadState): string[] {
  return hub.redemptionRequests
    .filter((request) => request.status === "pending" && isAdminPayoutUnread(readState, request.id))
    .map((request) => request.id);
}

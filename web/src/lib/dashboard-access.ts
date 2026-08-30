import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { SessionAccount } from "./auth-types";
import { getSessionAccount } from "./auth";
import { safeAppNextPath } from "./login-redirect";
import {
  buildDashboardNotifications,
  countUnreadNotifications,
  panelistRowToDashboardProfile,
  type DashboardNotification,
  type DashboardRewardSummary,
  type PanelistDashboardProfile,
} from "./panelist-dashboard";
import { getPanelistSurveys } from "./panelist-surveys";
import { findPanelistByEmail } from "./panelists";
import { loadNotificationReadState } from "./notification-state";
import { loadRedemptionRequests } from "./redemption-requests";
import { resolveRewardSummary } from "./panelist-points";
import { isPanelistVerified } from "./verification-status";
import { countUnreadSurveyInvitations } from "./survey-notifications";

export interface DashboardNavBadges {
  unreadNotifications: number;
  inboxSurveys: number;
  newSurveys: number;
  verificationAttention: number;
  availablePoints: number;
}

export interface DashboardContext {
  account: SessionAccount;
  profile: PanelistDashboardProfile;
  rewards: DashboardRewardSummary;
  notifications: DashboardNotification[];
}

async function loginRedirectTarget(): Promise<string> {
  try {
    const headerStore = await headers();
    const path = headerStore.get("x-brp-pathname") ?? "";
    return `/login?next=${encodeURIComponent(safeAppNextPath(path, "/dashboard"))}`;
  } catch {
    return "/login?next=/dashboard";
  }
}

export async function requireRegisteredPanelistSession(): Promise<SessionAccount> {
  const account = await getSessionAccount();
  if (!account) {
    redirect(await loginRedirectTarget());
  }
  if (!account.emailVerified) {
    redirect(`/signup/check-email?email=${encodeURIComponent(account.email)}&next=/register`);
  }
  if (!account.panelistRegistered) {
    redirect("/register");
  }
  return account;
}

export async function requireDashboardAccount(): Promise<SessionAccount> {
  const account = await requireRegisteredPanelistSession();
  if (account.accountStatus === "on_hold") {
    redirect("/dashboard/account-on-hold");
  }
  return account;
}

export async function requireDashboardContext(options: { welcome?: boolean } = {}): Promise<DashboardContext> {
  const account = await requireDashboardAccount();
  const panelist = await findPanelistByEmail(account.email, account.id);
  if (!panelist) {
    redirect("/register");
  }

  const profile = panelistRowToDashboardProfile(panelist);
  const rewards = await resolveRewardSummary(account.email, profile);
  const readState = await loadNotificationReadState(account.email);
  const redemptionRequests = await loadRedemptionRequests(account.email);
  const { inbox } = await getPanelistSurveys(account.email);
  const notifications = buildDashboardNotifications(profile, {
    welcome: options.welcome,
    readState,
    redemptionRequests,
    inboxSurveys: inbox,
  });

  return { account, profile, rewards, notifications };
}

export async function getDashboardNavBadges(email: string, accountId?: string): Promise<DashboardNavBadges> {
  const panelist = await findPanelistByEmail(email, accountId);
  if (!panelist) {
    return { unreadNotifications: 0, inboxSurveys: 0, newSurveys: 0, verificationAttention: 0, availablePoints: 0 };
  }

  const profile = panelistRowToDashboardProfile(panelist);
  const rewards = await resolveRewardSummary(email, profile);
  const readState = await loadNotificationReadState(email);
  const redemptionRequests = await loadRedemptionRequests(email);
  const { inbox } = await getPanelistSurveys(email);
  const notifications = buildDashboardNotifications(profile, { readState, redemptionRequests, inboxSurveys: inbox });
  const newSurveys = countUnreadSurveyInvitations(notifications);

  return {
    unreadNotifications: countUnreadNotifications(notifications),
    inboxSurveys: inbox.length,
    newSurveys,
    verificationAttention: isPanelistVerified(profile.verificationStatus) ? 0 : 1,
    availablePoints: rewards.availablePoints,
  };
}

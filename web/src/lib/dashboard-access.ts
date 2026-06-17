import { redirect } from "next/navigation";
import type { SessionAccount } from "./auth-types";
import { getSessionAccount } from "./auth";
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

export interface DashboardNavBadges {
  unreadNotifications: number;
  inboxSurveys: number;
  verificationAttention: number;
}

export interface DashboardContext {
  account: SessionAccount;
  profile: PanelistDashboardProfile;
  rewards: DashboardRewardSummary;
  notifications: DashboardNotification[];
}

export async function requireRegisteredPanelistSession(): Promise<SessionAccount> {
  const account = await getSessionAccount();
  if (!account) {
    redirect("/login?next=/dashboard");
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
  const panelist = await findPanelistByEmail(account.email);
  if (!panelist) {
    redirect("/register");
  }

  const profile = panelistRowToDashboardProfile(panelist);
  const rewards = await resolveRewardSummary(account.email, profile);
  const readState = await loadNotificationReadState(account.email);
  const redemptionRequests = await loadRedemptionRequests(account.email);
  const notifications = buildDashboardNotifications(profile, {
    welcome: options.welcome,
    readState,
    redemptionRequests,
  });

  return { account, profile, rewards, notifications };
}

export async function getDashboardNavBadges(email: string): Promise<DashboardNavBadges> {
  const panelist = await findPanelistByEmail(email);
  if (!panelist) {
    return { unreadNotifications: 0, inboxSurveys: 0, verificationAttention: 0 };
  }

  const profile = panelistRowToDashboardProfile(panelist);
  const readState = await loadNotificationReadState(email);
  const redemptionRequests = await loadRedemptionRequests(email);
  const notifications = buildDashboardNotifications(profile, { readState, redemptionRequests });
  const { inbox } = await getPanelistSurveys(email);

  return {
    unreadNotifications: countUnreadNotifications(notifications),
    inboxSurveys: inbox.length,
    verificationAttention: isPanelistVerified(profile.verificationStatus) ? 0 : 1,
  };
}

import { formatDobDisplay } from "./dob";
import type { NotificationReadState } from "./notification-state";
import type { RedemptionRequest } from "./reward-redemption";
import { formatBz } from "./reward-redemption";
import { redemptionNotificationId } from "./payout-panelist-notify";
import { payoutShortId } from "./admin-payout-display";
import type { PanelistRow } from "./panelists";
import { formatHeadingCase } from "./sentence-case";
import { cleanText } from "./validation";

export interface PanelistDashboardProfile {
  firstName: string;
  lastName: string;
  age: string;
  dob: string;
  sex: string;
  education: string;
  ethnicity: string;
  citizenshipStatus: string;
  commonwealthCountry: string;
  votingStatus: string;
  voterStatus: string;
  placeOfResidence: string;
  district: string;
  cityTownVillage: string;
  countryIfAbroad: string;
  constituency: string;
  registeredCtvArea: string;
  email: string;
  phone: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  otherContact: string;
  otherContactPlatform: string;
  politicalInterests: string[];
  marketInterests: string[];
  civicInterests: string[];
  verificationStatus: string;
  panelistStatus: string;
  registrationDate: string;
}

export interface DashboardNotification {
  id: string;
  title: string;
  body: string;
  dateLabel: string;
  priority: "normal" | "high";
  unread: boolean;
}

export interface DashboardRewardSummary {
  totalPoints: number;
  /** Lifetime points earned (registration, verification, surveys, etc.). */
  totalPointsToDate: number;
  registrationPoints: number;
  verificationPoints: number;
  surveyPoints: number;
  redeemedPoints: number;
  verified: boolean;
  /** Calculated balance before a dev override is applied. */
  calculatedPoints?: number;
  usingOverride?: boolean;
}

function splitInterests(value: string): string[] {
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function displayValue(value: string, fallback = "Not provided"): string {
  return cleanText(value) || fallback;
}

/** Format stored labels for UI title case (e.g. "Possible Duplicate" → "Possible Duplicate"). */
export function formatSentenceCaseLabel(value: string): string {
  return formatHeadingCase(value);
}

export function panelistRowToDashboardProfile(row: PanelistRow): PanelistDashboardProfile {
  const placeOfResidence = cleanText(row.place_of_residence);
  const livingAbroad = placeOfResidence === "Abroad";

  return {
    firstName: displayValue(row.first_name, ""),
    lastName: displayValue(row.last_name, ""),
    age: displayValue(row.age),
    dob: row.dob ? formatDobDisplay(row.dob) : "Not provided",
    sex: displayValue(row.sex),
    education: displayValue(row.education),
    ethnicity: displayValue(row.ethnicity),
    citizenshipStatus: displayValue(row.citizenship_status),
    commonwealthCountry: displayValue(row.commonwealth_country, ""),
    votingStatus: displayValue(row.voting_status, "Not applicable"),
    voterStatus: displayValue(row.voter_status, "Not applicable"),
    placeOfResidence: livingAbroad ? "Living abroad" : displayValue(placeOfResidence),
    district: livingAbroad ? "" : displayValue(row.district, ""),
    cityTownVillage: displayValue(row.city_town_village),
    countryIfAbroad: displayValue(row.country_if_abroad, ""),
    constituency: displayValue(row.constituency, ""),
    registeredCtvArea: displayValue(row.registered_ctv_area, ""),
    email: displayValue(row.email),
    phone: displayValue(row.phone_whatsapp),
    facebook: displayValue(row.facebook, ""),
    instagram: displayValue(row.instagram, ""),
    tiktok: displayValue(row.tiktok, ""),
    otherContact: displayValue(row.other_contact, ""),
    otherContactPlatform: displayValue(row.other_contact_platform, ""),
    politicalInterests: splitInterests(row.political_interests ?? ""),
    marketInterests: splitInterests(row.market_interests ?? ""),
    civicInterests: splitInterests(row.civic_interests ?? ""),
    verificationStatus: formatSentenceCaseLabel(displayValue(row.verification_status, "Pending")),
    panelistStatus: formatSentenceCaseLabel(displayValue(row.status, "Active")),
    registrationDate: displayValue(row.registration_date, "Recently submitted"),
  };
}

export function calculateMvpRewardPoints(profile: Pick<PanelistDashboardProfile, "verificationStatus">): DashboardRewardSummary {
  const verified = profile.verificationStatus.toLowerCase() === "verified";
  const registrationPoints = 25;
  const verificationPoints = verified ? 50 : 0;
  const surveyPoints = 0;
  const totalPointsToDate = registrationPoints + verificationPoints + surveyPoints;

  return {
    totalPoints: totalPointsToDate,
    totalPointsToDate,
    registrationPoints,
    verificationPoints,
    surveyPoints,
    redeemedPoints: 0,
    verified,
  };
}

export function buildRedemptionNotifications(
  requests: RedemptionRequest[],
  readState: NotificationReadState
): DashboardNotification[] {
  const isUnread = (id: string, defaultUnread: boolean): boolean => {
    const stored = readState[id];
    if (stored) return !stored.read;
    return defaultUnread;
  };

  return requests
    .filter((request) => request.status !== "pending")
    .map((request) => {
      const id = redemptionNotificationId(request.id);
      const shortId = payoutShortId(request.id);
      const amount = formatBz(request.amountBz ?? request.points / 25);
      const date = new Date(request.updatedAt);
      const dateLabel = Number.isNaN(date.getTime())
        ? request.updatedAt
        : date.toLocaleDateString("en-BZ", { dateStyle: "medium" });

      if (request.status === "approved") {
        return {
          id,
          title: "Payout processing",
          body: `Your ${request.optionLabel} redemption (${amount}) is being processed. Reference ${shortId}.`,
          dateLabel,
          priority: "normal" as const,
          unread: isUnread(id, true),
        };
      }

      if (request.status === "fulfilled") {
        return {
          id,
          title: "Payout completed",
          body: `Your ${request.optionLabel} redemption of ${amount} has been completed. Reference ${shortId}.`,
          dateLabel,
          priority: "high" as const,
          unread: isUnread(id, true),
        };
      }

      if (request.status === "rejected") {
        return {
          id,
          title: "Payout request declined",
          body: `Your ${request.optionLabel} redemption request (${shortId}) was not approved. Points remain in your balance.`,
          dateLabel,
          priority: "high" as const,
          unread: isUnread(id, true),
        };
      }

      return null;
    })
    .filter((notification): notification is DashboardNotification => notification !== null)
    .sort((a, b) => b.dateLabel.localeCompare(a.dateLabel));
}

export function buildDashboardNotifications(
  profile: PanelistDashboardProfile,
  options: {
    welcome?: boolean;
    readState?: NotificationReadState;
    redemptionRequests?: RedemptionRequest[];
  } = {}
): DashboardNotification[] {
  const notifications: DashboardNotification[] = [];
  const verified = profile.verificationStatus.toLowerCase() === "verified";
  const readState = options.readState ?? {};

  const isUnread = (id: string, defaultUnread: boolean): boolean => {
    const stored = readState[id];
    if (stored) return !stored.read;
    return defaultUnread;
  };

  if (options.welcome) {
    notifications.push({
      id: "welcome",
      title: "Registration submitted",
      body: "Thank you for joining the Belize Research Panel. Your profile is now on file while our team completes verification.",
      dateLabel: "Just now",
      priority: "high",
      unread: isUnread("welcome", true),
    });
  }

  notifications.push({
    id: "verification",
    title: verified ? "Account verified" : "Verification in progress",
    body: verified
      ? "Your panelist account has been verified. You are eligible for matched survey invitations."
      : `Your registration is under review. Current status: ${profile.verificationStatus}. We will contact you when verification is complete.`,
    dateLabel: profile.registrationDate,
    priority: verified ? "normal" : "high",
    unread: isUnread("verification", !verified),
  });

  notifications.push({
    id: "surveys",
    title: "Survey invitations",
    body: "Matched survey invitations will appear here when studies are available for your profile and interests.",
    dateLabel: "Coming soon",
    priority: "normal",
    unread: isUnread("surveys", false),
  });

  notifications.push({
    id: "rewards",
    title: "Rewards program",
    body: verified
      ? "Points for registration, verification, and completed surveys are tracked on your Rewards page. Redeem when you reach 500 points (BZ$20)."
      : "Registration points are tracked below. Verification and survey rewards apply once your account is verified.",
    dateLabel: profile.registrationDate,
    priority: "normal",
    unread: isUnread("rewards", false),
  });

  const redemptionNotifications = buildRedemptionNotifications(options.redemptionRequests ?? [], readState);
  notifications.push(...redemptionNotifications);

  return notifications;
}

export function countUnreadNotifications(notifications: DashboardNotification[]): number {
  return notifications.filter((notification) => notification.unread).length;
}

/** Deep links from admin dashboard metric cards to the right queue or filter. */
import { cleanText } from "./validation";

export const ADMIN_DASHBOARD_LINKS = {
  panelists: "/admin/panelists",
  panelistsFlagged: "/admin/panelists?tab=flagged",
  verified: "/admin/panelists?verification=Verified",
  underReview: "/admin/under-review",
  underReviewIncomplete: "/admin/under-review?queue=incomplete",
  underReviewFlagged: "/admin/panelists?tab=flagged",
  underReviewOnHold: "/admin/under-review?queue=on_hold",
  payouts: "/admin/payouts",
  phoneReview: "/admin/under-review?requirement=phone",
  addressReview: "/admin/under-review?requirement=address",
  identityReview: "/admin/under-review?requirement=id",
  phoneChanges: "/admin/notifications?type=phone",
} as const;

export type UnderReviewQueueFilter = "incomplete" | "flagged" | "on_hold";

export function parseUnderReviewQueueFilter(value: string | undefined): UnderReviewQueueFilter | null {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "incomplete" || normalized === "requirements") return "incomplete";
  if (normalized === "flagged" || normalized === "duplicate") return "flagged";
  if (normalized === "on_hold" || normalized === "hold" || normalized === "onhold") return "on_hold";
  return null;
}

export function filterUnderReviewRowsByQueue<
  T extends {
    emailRequirement: string;
    phoneRequirement: string;
    photoIdRequirement: string;
    verificationStatus: string;
    accountStatus: string;
  },
>(rows: T[], queue: UnderReviewQueueFilter | null): T[] {
  if (!queue) return rows;

  if (queue === "incomplete") {
    return rows.filter(
      (row) =>
        row.emailRequirement !== "approved" ||
        row.phoneRequirement !== "approved" ||
        row.photoIdRequirement !== "approved"
    );
  }

  if (queue === "flagged") {
    return rows.filter((row) => cleanText(row.verificationStatus) === "Possible Duplicate");
  }

  return rows.filter((row) => row.accountStatus === "on_hold");
}

export const UNDER_REVIEW_QUEUE_LABELS: Record<UnderReviewQueueFilter, string> = {
  incomplete: "Requirements incomplete",
  flagged: "Flagged (possible duplicate)",
  on_hold: "Accounts on hold",
};

export type UnderReviewRequirementFilter = "email" | "phone" | "id" | "address";

export function parseUnderReviewRequirementFilter(
  value: string | undefined
): UnderReviewRequirementFilter | null {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "email" || normalized === "e") return "email";
  if (normalized === "phone" || normalized === "p") return "phone";
  if (normalized === "id" || normalized === "photo" || normalized === "photoid") return "id";
  if (normalized === "address" || normalized === "addr" || normalized === "residence") return "address";
  return null;
}

export function filterUnderReviewRowsByRequirement<
  T extends {
    emailRequirement: string;
    phoneRequirement: string;
    photoIdRequirement: string;
    hasAddressDocument: boolean;
  },
>(rows: T[], requirement: UnderReviewRequirementFilter | null): T[] {
  if (!requirement) return rows;

  return rows.filter((row) => {
    if (requirement === "email") return row.emailRequirement !== "approved";
    if (requirement === "phone") return row.phoneRequirement !== "approved";
    if (requirement === "id") return row.photoIdRequirement !== "approved";
    return row.hasAddressDocument && row.photoIdRequirement !== "approved";
  });
}

export const UNDER_REVIEW_FILTER_LABELS: Record<UnderReviewRequirementFilter, string> = {
  email: "Email verification",
  phone: "Phone numbers",
  id: "Identity documents",
  address: "Address documents",
};

/** Deep links from admin dashboard metric cards to the right queue or filter. */
export const ADMIN_DASHBOARD_LINKS = {
  panelists: "/admin/panelists",
  verified: "/admin/panelists?verification=Verified",
  underReview: "/admin/under-review",
  payouts: "/admin/payouts",
  phoneReview: "/admin/under-review?requirement=phone",
  addressReview: "/admin/under-review?requirement=address",
  identityReview: "/admin/under-review?requirement=id",
  phoneChanges: "/admin/notifications?type=phone",
} as const;

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

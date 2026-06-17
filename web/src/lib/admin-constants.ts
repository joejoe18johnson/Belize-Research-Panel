export const VERIFICATION_STATUS = [
  "Pending",
  "Verified",
  "Possible Duplicate",
  "Rejected",
  "Needs Follow-up",
] as const;

export const PANELIST_STATUS = [
  "Active",
  "Inactive",
  "Do not contact",
  "Duplicate",
  "Withdrawn",
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUS)[number];
export type PanelistStatus = (typeof PANELIST_STATUS)[number];

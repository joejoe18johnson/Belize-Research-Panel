export function isPanelistVerified(verificationStatus: unknown): boolean {
  return String(verificationStatus ?? "").trim().toLowerCase() === "verified";
}

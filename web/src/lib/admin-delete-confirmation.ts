import { cleanText } from "./validation";

export function extractYearFromDate(value: string): number {
  const cleaned = cleanText(value);
  const yearMatch = cleaned.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) return Number.parseInt(yearMatch[0], 10);

  const parsed = Date.parse(cleaned);
  if (Number.isFinite(parsed)) return new Date(parsed).getFullYear();

  return new Date().getFullYear();
}

/** e.g. Jose + 2026 → Jose2026 */
export function buildAdminDeleteCode(firstName: string, year: number): string {
  const trimmed = cleanText(firstName).replace(/[^a-zA-ZÀ-ÿ'-]/g, "");
  const name = trimmed || "Record";
  const normalized =
    name.length === 1
      ? name.toUpperCase()
      : name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  return `${normalized}${year}`;
}

export function normalizeDeleteConfirmationInput(input: string): string {
  return cleanText(input).replace(/\s+/g, "");
}

export function matchesDeleteConfirmation(input: string, expectedCode: string): boolean {
  return (
    normalizeDeleteConfirmationInput(input).toLowerCase() ===
    normalizeDeleteConfirmationInput(expectedCode).toLowerCase()
  );
}

export function buildPanelistDeleteCode(row: {
  first_name?: string;
  registration_date?: string;
}): string {
  const firstName = cleanText(row.first_name) || "Panelist";
  const year = extractYearFromDate(row.registration_date ?? "");
  return buildAdminDeleteCode(firstName, year);
}

export function adminDeleteConfirmationHint(code: string): string {
  return `Type ${code} below to confirm this deletion.`;
}

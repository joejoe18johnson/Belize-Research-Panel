export const DOB_MIN_YEAR = 1920;

export const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export function daysInMonth(month: number, year: number): number {
  if (!month || !year) return 31;
  return new Date(year, month, 0).getDate();
}

export function parseDobParts(dob: string): { day: string; month: string; year: string } {
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return { day: "", month: "", year: "" };
  }
  const [year, month, day] = dob.split("-");
  return {
    day: String(parseInt(day, 10)),
    month: String(parseInt(month, 10)),
    year,
  };
}

export function composeDob(year: string, month: string, day: string): string {
  if (!year || !month || !day) return "";
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (!y || !m || !d) return "";
  if (y < DOB_MIN_YEAR || m < 1 || m > 12 || d < 1) return "";
  if (d > daysInMonth(m, y)) return "";
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function isValidDobString(dob: string): boolean {
  if (!dob) return false;
  const parts = parseDobParts(dob);
  if (composeDob(parts.year, parts.month, parts.day) !== dob) return false;
  const birth = parseBirthDate(dob);
  if (!birth) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return birth <= today;
}

export function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - DOB_MIN_YEAR + 1 }, (_, i) => currentYear - i);
}

export function formatDobDisplay(dob: string): string {
  const parts = parseDobParts(dob);
  if (!parts.year || !parts.month || !parts.day) return dob;
  const monthLabel = MONTH_OPTIONS.find((m) => m.value === parts.month)?.label ?? parts.month;
  return `${monthLabel} ${parts.day}, ${parts.year}`;
}

export function parseBirthDate(dob: string): Date | null {
  const parts = parseDobParts(dob);
  if (composeDob(parts.year, parts.month, parts.day) !== dob) return null;
  return new Date(parseInt(parts.year, 10), parseInt(parts.month, 10) - 1, parseInt(parts.day, 10));
}

/** Canonical YYYY-MM-DD for duplicate matching across stored formats. */
export function normalizeDobForComparison(dob: string): string {
  const trimmed = dob.trim();
  if (!trimmed) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parts = parseDobParts(trimmed);
    return composeDob(parts.year, parts.month, parts.day) || trimmed;
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return composeDob(year, month, day);
  }

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    const date = new Date(parsed);
    return composeDob(String(date.getFullYear()), String(date.getMonth() + 1), String(date.getDate()));
  }

  return trimmed;
}

import { duplicateNameDobKey, isFlaggedPanelist } from "./admin-panelists";
import type { PanelistRow } from "./panelists";
import { assessSuspiciousEmail, type SuspiciousEmailAssessment } from "./suspicious-email";
import { cleanText } from "./validation";

export interface FraudDuplicateRow {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  dob: string;
  username: string;
  verificationStatus: string;
  district: string;
  duplicateType: string;
}

export interface SuspiciousEmailRow extends FraudDuplicateRow {
  domain: string;
  riskScore: number;
  riskLevel: "medium" | "high";
  signalSummary: string;
  signals: SuspiciousEmailAssessment["signals"];
  flagged: boolean;
}

export interface FraudPreventionDetail {
  duplicateEmails: number;
  duplicatePhones: number;
  duplicateNameDob: number;
  suspiciousEmails: number;
  emailDuplicateRows: FraudDuplicateRow[];
  phoneDuplicateRows: FraudDuplicateRow[];
  nameDobDuplicateRows: FraudDuplicateRow[];
  suspiciousEmailRows: SuspiciousEmailRow[];
  verificationSummary: { status: string; count: number; percent: number }[];
}

function rowsForFieldDuplicates(
  rows: PanelistRow[],
  field: "email" | "phone_whatsapp",
  label: string
): FraudDuplicateRow[] {
  const groups = new Map<string, PanelistRow[]>();
  for (const row of rows) {
    const value = cleanText(row[field]).toLowerCase();
    if (!value) continue;
    const list = groups.get(value) ?? [];
    list.push(row);
    groups.set(value, list);
  }

  const result: FraudDuplicateRow[] = [];
  groups.forEach((group) => {
    if (group.length <= 1) return;
    for (const row of group) {
      result.push({
        email: cleanText(row.email),
        phone: cleanText(row.phone_whatsapp),
        firstName: cleanText(row.first_name),
        lastName: cleanText(row.last_name),
        dob: cleanText(row.dob),
        username: cleanText(row.username),
        verificationStatus: cleanText(row.verification_status),
        district: cleanText(row.district),
        duplicateType: label,
      });
    }
  });
  return result.sort((a, b) => a.email.localeCompare(b.email));
}

function buildSuspiciousEmailRows(rows: PanelistRow[]): SuspiciousEmailRow[] {
  const result: SuspiciousEmailRow[] = [];

  for (const row of rows) {
    const email = cleanText(row.email);
    if (!email) continue;

    const assessment = assessSuspiciousEmail(email, {
      firstName: cleanText(row.first_name),
      lastName: cleanText(row.last_name),
    });
    if (!assessment.suspicious || !assessment.riskLevel) continue;

    result.push({
      email,
      phone: cleanText(row.phone_whatsapp),
      firstName: cleanText(row.first_name),
      lastName: cleanText(row.last_name),
      dob: cleanText(row.dob),
      username: cleanText(row.username),
      verificationStatus: cleanText(row.verification_status),
      district: cleanText(row.district),
      duplicateType: "Suspicious email",
      domain: assessment.domain,
      riskScore: assessment.riskScore,
      riskLevel: assessment.riskLevel,
      signalSummary: assessment.signals.map((signal) => signal.label).join(" · "),
      signals: assessment.signals,
      flagged: isFlaggedPanelist(row),
    });
  }

  return result.sort((a, b) => b.riskScore - a.riskScore || a.email.localeCompare(b.email));
}

export function buildFraudPreventionDetail(rows: PanelistRow[]): FraudPreventionDetail {
  const keyGroups = new Map<string, PanelistRow[]>();
  for (const row of rows) {
    const key = duplicateNameDobKey(row);
    if (!key.replace(/\|/g, "").trim()) continue;
    const list = keyGroups.get(key) ?? [];
    list.push(row);
    keyGroups.set(key, list);
  }

  const nameDobDuplicateRows: FraudDuplicateRow[] = [];
  keyGroups.forEach((group) => {
    if (group.length <= 1) return;
    for (const row of group) {
      nameDobDuplicateRows.push({
        email: cleanText(row.email),
        phone: cleanText(row.phone_whatsapp),
        firstName: cleanText(row.first_name),
        lastName: cleanText(row.last_name),
        dob: cleanText(row.dob),
        username: cleanText(row.username),
        verificationStatus: cleanText(row.verification_status),
        district: cleanText(row.district),
        duplicateType: "Name + DOB",
      });
    }
  });

  const emailDuplicateRows = rowsForFieldDuplicates(rows, "email", "Email");
  const phoneDuplicateRows = rowsForFieldDuplicates(rows, "phone_whatsapp", "Phone");
  const suspiciousEmailRows = buildSuspiciousEmailRows(rows);

  const verificationMap = new Map<string, number>();
  for (const row of rows) {
    const status = cleanText(row.verification_status) || "Unknown";
    verificationMap.set(status, (verificationMap.get(status) ?? 0) + 1);
  }
  const total = rows.length || 1;

  return {
    duplicateEmails: emailDuplicateRows.length,
    duplicatePhones: phoneDuplicateRows.length,
    duplicateNameDob: nameDobDuplicateRows.length,
    suspiciousEmails: suspiciousEmailRows.length,
    emailDuplicateRows,
    phoneDuplicateRows,
    nameDobDuplicateRows: nameDobDuplicateRows.sort((a, b) =>
      `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`)
    ),
    suspiciousEmailRows,
    verificationSummary: [...verificationMap.entries()]
      .map(([status, count]) => ({
        status,
        count,
        percent: Math.round((count / total) * 1000) / 10,
      }))
      .sort((a, b) => b.count - a.count),
  };
}

export function filterSuspiciousEmailRows(
  rows: SuspiciousEmailRow[],
  search: string,
  verificationStatuses: string[],
  riskLevels: Array<"medium" | "high"> = []
): SuspiciousEmailRow[] {
  const q = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (verificationStatuses.length && !verificationStatuses.includes(row.verificationStatus)) return false;
    if (riskLevels.length && !riskLevels.includes(row.riskLevel)) return false;
    if (!q) return true;
    const haystack =
      `${row.firstName} ${row.lastName} ${row.email} ${row.domain} ${row.signalSummary} ${row.username}`.toLowerCase();
    return haystack.includes(q);
  });
}

export function filterFraudRows(
  rows: FraudDuplicateRow[],
  search: string,
  verificationStatuses: string[]
): FraudDuplicateRow[] {
  const q = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (verificationStatuses.length && !verificationStatuses.includes(row.verificationStatus)) return false;
    if (!q) return true;
    const haystack = `${row.firstName} ${row.lastName} ${row.email} ${row.phone} ${row.username}`.toLowerCase();
    return haystack.includes(q);
  });
}

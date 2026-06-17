import { duplicateNameDobKey } from "./admin-panelists";
import type { PanelistRow } from "./panelists";
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

export interface FraudPreventionDetail {
  duplicateEmails: number;
  duplicatePhones: number;
  duplicateNameDob: number;
  emailDuplicateRows: FraudDuplicateRow[];
  phoneDuplicateRows: FraudDuplicateRow[];
  nameDobDuplicateRows: FraudDuplicateRow[];
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
    emailDuplicateRows,
    phoneDuplicateRows,
    nameDobDuplicateRows: nameDobDuplicateRows.sort((a, b) =>
      `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`)
    ),
    verificationSummary: [...verificationMap.entries()]
      .map(([status, count]) => ({
        status,
        count,
        percent: Math.round((count / total) * 1000) / 10,
      }))
      .sort((a, b) => b.count - a.count),
  };
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

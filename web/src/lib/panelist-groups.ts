import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import {
  normalizePanelistGroupEmails,
  normalizeSampleFilters,
} from "./panelist-group-resolve";
import type { PanelistGroup, PanelistGroupType } from "./panelist-group-types";
import type { SampleFilters } from "./admin-sample-selection";
import { cleanText } from "./validation";

const DATA_FILE = path.join(process.cwd(), "data", "panelist-groups.json");

function slugify(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function normalizeGroupType(value: unknown): PanelistGroupType {
  return cleanText(String(value)) === "filter" ? "filter" : "static";
}

function normalizeGroupRecord(record: PanelistGroup): PanelistGroup {
  const type = normalizeGroupType(record.type);
  return {
    id: cleanText(record.id),
    name: cleanText(record.name),
    description: cleanText(record.description),
    type,
    emails: type === "static" ? normalizePanelistGroupEmails(record.emails ?? []) : undefined,
    filters: type === "filter" ? normalizeSampleFilters(record.filters) : undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function loadPanelistGroups(): Promise<PanelistGroup[]> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as PanelistGroup[];
    return Array.isArray(parsed)
      ? parsed.map(normalizeGroupRecord).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      : [];
  } catch {
    return [];
  }
}

async function savePanelistGroups(groups: PanelistGroup[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(groups, null, 2), "utf-8");
}

export async function findPanelistGroupById(id: string): Promise<PanelistGroup | null> {
  const groups = await loadPanelistGroups();
  return groups.find((group) => group.id === id) ?? null;
}

function buildGroupPayload(input: {
  name: string;
  description?: string;
  type: PanelistGroupType;
  emails?: string[];
  filters?: SampleFilters;
}): Omit<PanelistGroup, "id" | "createdAt" | "updatedAt"> {
  const name = cleanText(input.name);
  if (!name) throw new Error("Group name is required.");

  const type = normalizeGroupType(input.type);
  if (type === "static") {
    const emails = normalizePanelistGroupEmails(input.emails ?? []);
    if (emails.length === 0) throw new Error("Add at least one panelist email for a static group.");
    return {
      name,
      description: cleanText(input.description),
      type,
      emails,
    };
  }

  return {
    name,
    description: cleanText(input.description),
    type,
    filters: normalizeSampleFilters(input.filters),
  };
}

export async function createPanelistGroup(input: {
  name: string;
  description?: string;
  type: PanelistGroupType;
  emails?: string[];
  filters?: SampleFilters;
}): Promise<PanelistGroup> {
  const payload = buildGroupPayload(input);
  const now = new Date().toISOString();
  const baseId = `group-${slugify(payload.name) || "panelists"}-${Date.now().toString(36)}`;
  const groups = await loadPanelistGroups();
  const id = groups.some((group) => group.id === baseId)
    ? `${baseId}-${randomUUID().slice(0, 6)}`
    : baseId;

  const group: PanelistGroup = {
    id,
    ...payload,
    createdAt: now,
    updatedAt: now,
  };

  groups.push(group);
  await savePanelistGroups(groups);
  return group;
}

export async function updatePanelistGroup(
  id: string,
  input: {
    name?: string;
    description?: string;
    type?: PanelistGroupType;
    emails?: string[];
    filters?: SampleFilters;
  }
): Promise<PanelistGroup> {
  const groups = await loadPanelistGroups();
  const index = groups.findIndex((group) => group.id === id);
  if (index < 0) throw new Error("Group not found.");

  const current = groups[index];
  const payload = buildGroupPayload({
    name: input.name ?? current.name,
    description: input.description ?? current.description,
    type: input.type ?? current.type,
    emails: input.emails ?? current.emails,
    filters: input.filters ?? current.filters,
  });

  const updated: PanelistGroup = {
    ...current,
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  groups[index] = updated;
  await savePanelistGroups(groups);
  return updated;
}

export async function deletePanelistGroup(id: string): Promise<void> {
  const groups = await loadPanelistGroups();
  const next = groups.filter((group) => group.id !== id);
  if (next.length === groups.length) throw new Error("Group not found.");
  await savePanelistGroups(next);
}

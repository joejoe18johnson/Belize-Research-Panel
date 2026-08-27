import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type {
  PayoutProcessAction,
  RedemptionOptionId,
  RedemptionRequest,
  RedemptionRequestStatus,
} from "./reward-redemption";
import { cleanText } from "./validation";

const DATA_FILE = path.join(process.cwd(), "data", "redemption-requests.json");

type RedemptionRequestStore = Record<string, RedemptionRequest[]>;

async function loadStore(): Promise<RedemptionRequestStore> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as RedemptionRequestStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function saveStore(store: RedemptionRequestStore): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function normalizeEmail(email: string): string {
  return cleanText(email).toLowerCase();
}

function payoutIdsMatch(storedId: string, requestedId: string): boolean {
  const stored = cleanText(storedId);
  const requested = cleanText(requestedId);
  if (!stored || !requested) return false;
  if (stored === requested) return true;
  const compactStored = stored.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const compactRequested = requested.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (compactStored === compactRequested) return true;
  return compactRequested.length >= 6 && compactStored.endsWith(compactRequested);
}

function findRequestInList(
  requests: RedemptionRequest[],
  requestId: string
): RedemptionRequest | undefined {
  return requests.find((entry) => payoutIdsMatch(entry.id, requestId));
}

export async function loadRedemptionRequests(email: string): Promise<RedemptionRequest[]> {
  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseLoadRedemptionRequests } = await import("./supabase/repos");
    return supabaseLoadRedemptionRequests(email);
  }
  const key = normalizeEmail(email);
  if (!key) return [];
  const store = await loadStore();
  return store[key] ?? [];
}

export async function createRedemptionRequest(input: {
  email: string;
  optionId: RedemptionOptionId;
  optionLabel: string;
  points: number;
  amountBz: number;
  valueLabel: string;
  details: Record<string, string>;
  notes: string;
}): Promise<RedemptionRequest> {
  const key = normalizeEmail(input.email);
  if (!key) {
    throw new Error("invalid_email");
  }

  const now = new Date().toISOString();
  const request: RedemptionRequest = {
    id: randomUUID(),
    email: key,
    optionId: input.optionId,
    optionLabel: input.optionLabel,
    points: input.points,
    amountBz: input.amountBz,
    valueLabel: input.valueLabel,
    status: "pending",
    details: input.details,
    notes: input.notes,
    submittedAt: now,
    updatedAt: now,
  };

  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseUpsertRedemptionRequest } = await import("./supabase/repos");
    await supabaseUpsertRedemptionRequest(request);
    return request;
  }

  const store = await loadStore();
  const current = store[key] ?? [];
  current.unshift(request);
  store[key] = current;
  await saveStore(store);

  return request;
}

export async function loadAllRedemptionRequests(): Promise<RedemptionRequest[]> {
  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseLoadAllRedemptionRequests } = await import("./supabase/repos");
    return supabaseLoadAllRedemptionRequests();
  }
  const store = await loadStore();
  return Object.values(store).flat();
}

export async function findRedemptionRequestById(
  requestId: string
): Promise<{ email: string; request: RedemptionRequest } | null> {
  const id = cleanText(requestId);
  if (!id) return null;

  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseLoadAllRedemptionRequests } = await import("./supabase/repos");
    const all = await supabaseLoadAllRedemptionRequests();
    const request = findRequestInList(all, id);
    return request ? { email: request.email, request } : null;
  }

  const store = await loadStore();
  for (const [email, requests] of Object.entries(store)) {
    const request = findRequestInList(requests, id);
    if (request) return { email, request };
  }
  return null;
}

export async function updateRedemptionRequestStatus(
  email: string,
  requestId: string,
  status: RedemptionRequestStatus,
  options: { processedBy?: string } = {}
): Promise<RedemptionRequest | null> {
  const key = normalizeEmail(email);
  const id = cleanText(requestId);
  if (!key || !id) return null;

  const located = await findRedemptionRequestById(id);
  if (!located || normalizeEmail(located.email) !== key) return null;

  const updated: RedemptionRequest = {
    ...located.request,
    status,
    updatedAt: new Date().toISOString(),
    ...(options.processedBy ? { processedBy: options.processedBy } : {}),
  };

  const { useSupabase } = await import("./supabase/data-source");
  if (useSupabase()) {
    const { supabaseUpdateRedemptionStatus } = await import("./supabase/repos");
    await supabaseUpdateRedemptionStatus(updated.id, updated.status, updated.processedBy);
    return updated;
  }

  const store = await loadStore();
  const current = store[key] ?? [];
  const index = current.findIndex((request) => payoutIdsMatch(request.id, updated.id));
  if (index === -1) return null;
  current[index] = updated;
  store[key] = current;
  await saveStore(store);

  return updated;
}

const ACTION_STATUS: Record<PayoutProcessAction, RedemptionRequestStatus> = {
  start: "approved",
  complete: "fulfilled",
  reject: "rejected",
};

const ALLOWED_TRANSITIONS: Record<RedemptionRequestStatus, PayoutProcessAction[]> = {
  pending: ["start", "complete", "reject"],
  approved: ["complete", "reject"],
  fulfilled: [],
  rejected: [],
};

export async function processRedemptionRequest(input: {
  requestId: string;
  action: PayoutProcessAction;
  processedBy?: string;
}): Promise<RedemptionRequest | null> {
  const located = await findRedemptionRequestById(input.requestId);
  if (!located) return null;

  const { email, request } = located;
  const allowed = ALLOWED_TRANSITIONS[request.status] ?? [];
  if (!allowed.includes(input.action)) {
    throw new Error("invalid_transition");
  }

  return updateRedemptionRequestStatus(email, request.id, ACTION_STATUS[input.action], {
    processedBy: input.processedBy,
  });
}

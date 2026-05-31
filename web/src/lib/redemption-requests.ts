import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { RedemptionOptionId, RedemptionRequest, RedemptionRequestStatus } from "./reward-redemption";
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

export async function loadRedemptionRequests(email: string): Promise<RedemptionRequest[]> {
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

  const store = await loadStore();
  const current = store[key] ?? [];
  current.unshift(request);
  store[key] = current;
  await saveStore(store);

  return request;
}

export async function updateRedemptionRequestStatus(
  email: string,
  requestId: string,
  status: RedemptionRequestStatus
): Promise<RedemptionRequest | null> {
  const key = normalizeEmail(email);
  const id = cleanText(requestId);
  if (!key || !id) return null;

  const store = await loadStore();
  const current = store[key] ?? [];
  const index = current.findIndex((request) => request.id === id);
  if (index === -1) return null;

  const updated: RedemptionRequest = {
    ...current[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  current[index] = updated;
  store[key] = current;
  await saveStore(store);

  return updated;
}

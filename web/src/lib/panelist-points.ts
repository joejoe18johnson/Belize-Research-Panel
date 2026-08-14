import { promises as fs } from "fs";
import path from "path";
import {
  calculateMvpRewardPoints,
  type DashboardRewardSummary,
  type PanelistDashboardProfile,
} from "./panelist-dashboard";
import { getPanelistSurveys } from "./panelist-surveys";
import { loadRedemptionRequests } from "./redemption-requests";
import { loadRewardBalanceSeed } from "./panelist-reward-balances";
import { loadRewardSettings } from "./reward-settings-store";
import { getReservedPoints } from "./reward-redemption";
import { cleanText } from "./validation";

const DATA_FILE = path.join(process.cwd(), "data", "panelist-points-overrides.json");

type PointsOverrideStore = Record<string, number>;

async function loadStore(): Promise<PointsOverrideStore> {
  try {
    const content = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as PointsOverrideStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function saveStore(store: PointsOverrideStore): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function normalizeEmail(email: string): string {
  return cleanText(email).toLowerCase();
}

/** Set to true to show the dev points override UI on the rewards page. */
const POINTS_DEV_TOOL_ENABLED = false;

export function isPointsOverrideEnabled(): boolean {
  if (!POINTS_DEV_TOOL_ENABLED) return false;
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_POINTS_OVERRIDE === "true";
}

export async function loadPointsOverride(email: string): Promise<number | null> {
  const key = normalizeEmail(email);
  if (!key) return null;

  const store = await loadStore();
  const value = store[key];
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.round(value));
}

export async function setPointsOverride(email: string, points: number | null): Promise<number | null> {
  const key = normalizeEmail(email);
  if (!key) return null;

  const store = await loadStore();

  if (points === null) {
    delete store[key];
    await saveStore(store);
    return null;
  }

  const normalized = Math.max(0, Math.round(points));
  store[key] = normalized;
  await saveStore(store);
  return normalized;
}

function sumFulfilledRedemptionPoints(
  requests: Awaited<ReturnType<typeof loadRedemptionRequests>>
): number {
  return requests
    .filter((request) => request.status === "fulfilled")
    .reduce((sum, request) => sum + request.points, 0);
}

export async function resolveRewardSummary(
  email: string,
  profile: Pick<PanelistDashboardProfile, "verificationStatus">
): Promise<DashboardRewardSummary> {
  const settings = await loadRewardSettings();
  const base = calculateMvpRewardPoints(profile, settings);
  const { completed } = await getPanelistSurveys(email);
  const surveyPoints = completed.reduce((sum, survey) => sum + survey.points, 0);
  const calculatedEarned = base.registrationPoints + base.verificationPoints + surveyPoints;

  const seed = await loadRewardBalanceSeed(email);
  const seedToDate =
    typeof seed?.totalPointsToDate === "number" && Number.isFinite(seed.totalPointsToDate)
      ? Math.max(0, Math.round(seed.totalPointsToDate))
      : 0;
  const totalPointsToDate = Math.max(calculatedEarned, seedToDate);

  const redemptionRequests = await loadRedemptionRequests(email);
  const fulfilledRedemptionPoints = sumFulfilledRedemptionPoints(redemptionRequests);
  const reservedPoints = getReservedPoints(redemptionRequests);

  const totalPoints = Math.max(0, totalPointsToDate - fulfilledRedemptionPoints);
  let availablePoints = Math.max(0, totalPoints - reservedPoints);

  let calculatedPoints: number | undefined;
  let usingOverride = false;

  if (isPointsOverrideEnabled()) {
    const override = await loadPointsOverride(email);
    if (override !== null) {
      availablePoints = Math.min(override, totalPointsToDate);
      calculatedPoints = Math.max(0, totalPoints - reservedPoints);
      usingOverride = true;
    }
  }

  const redeemedPoints = fulfilledRedemptionPoints + reservedPoints;

  return {
    ...base,
    surveyPoints,
    totalPointsToDate,
    totalPoints,
    availablePoints,
    fulfilledRedemptionPoints,
    reservedPoints,
    redeemedPoints,
    ...(calculatedPoints !== undefined ? { calculatedPoints, usingOverride } : {}),
  };
}

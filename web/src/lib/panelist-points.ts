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

function sumActiveRedemptionPoints(
  requests: Awaited<ReturnType<typeof loadRedemptionRequests>>
): number {
  return getReservedPoints(requests);
}

function sumRedeemedPoints(
  requests: Awaited<ReturnType<typeof loadRedemptionRequests>>
): number {
  return requests
    .filter((request) => request.status !== "rejected")
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
  const totalPointsToDate =
    typeof seed?.totalPointsToDate === "number" && Number.isFinite(seed.totalPointsToDate)
      ? Math.max(0, Math.round(seed.totalPointsToDate))
      : calculatedEarned;

  const redemptionRequests = await loadRedemptionRequests(email);
  const fulfilledPoints = sumFulfilledRedemptionPoints(redemptionRequests);
  const activeHoldPoints = sumActiveRedemptionPoints(redemptionRequests);
  const redeemedPoints = sumRedeemedPoints(redemptionRequests);

  let totalPoints: number;
  const balanceBeforeHolds = Math.max(0, totalPointsToDate - fulfilledPoints);
  const computedAvailable = Math.max(0, balanceBeforeHolds - activeHoldPoints);

  if (typeof seed?.totalPoints === "number" && Number.isFinite(seed.totalPoints)) {
    totalPoints = Math.max(0, Math.round(seed.totalPoints));
  } else {
    totalPoints = computedAvailable;
  }

  totalPoints = Math.min(totalPoints, totalPointsToDate);

  let calculatedPoints: number | undefined;
  let usingOverride = false;

  if (isPointsOverrideEnabled()) {
    const override = await loadPointsOverride(email);
    if (override !== null) {
      totalPoints = Math.min(override, totalPointsToDate);
      calculatedPoints = computedAvailable;
      usingOverride = true;
    }
  }

  const redeemedPointsDisplay =
    totalPointsToDate > totalPoints ? totalPointsToDate - totalPoints : redeemedPoints;

  return {
    ...base,
    surveyPoints,
    totalPointsToDate,
    redeemedPoints: redeemedPointsDisplay,
    totalPoints,
    ...(calculatedPoints !== undefined ? { calculatedPoints, usingOverride } : {}),
  };
}

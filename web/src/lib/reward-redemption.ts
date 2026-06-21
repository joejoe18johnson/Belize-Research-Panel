import {
  DEFAULT_REWARD_SETTINGS,
  redemptionMinimumBz,
  redemptionRateLabel,
  type RewardSettings,
} from "./reward-settings";
import {
  mergeBankPayoutLocationDetails,
  validateBankPayoutLocation,
} from "./bank-payout-location";
import { cleanText } from "./validation";

/** @deprecated Use loadRewardSettings() — default snapshot for legacy imports. */
export const POINTS_PER_BZ_DOLLAR = DEFAULT_REWARD_SETTINGS.pointsPerBzDollar;

/** @deprecated Use loadRewardSettings() — default snapshot for legacy imports. */
export const REDEMPTION_MINIMUM_POINTS = DEFAULT_REWARD_SETTINGS.redemptionMinimumPoints;

/** @deprecated Use loadRewardSettings() — default snapshot for legacy imports. */
export const REDEMPTION_RATE_LABEL = redemptionRateLabel(DEFAULT_REWARD_SETTINGS);

export type RedemptionOptionId = "mobile_top_up" | "bank_transfer" | "utility_credit";

/** Includes retired options still present in historical redemption records. */
export type StoredRedemptionOptionId = RedemptionOptionId | "gift_card";

export type RedemptionFieldType = "text" | "tel" | "email" | "select" | "textarea";

export type RedemptionAmountMode = "increments_20" | "increments_50" | "custom_min_20";

export interface RedemptionField {
  name: string;
  label: string;
  type: RedemptionFieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
}

export interface RedemptionOption {
  id: RedemptionOptionId;
  label: string;
  description: string;
  amountMode: RedemptionAmountMode;
  minAmountBz: number;
  incrementLabel: string;
  fields: RedemptionField[];
}

export const REDEMPTION_OPTIONS: RedemptionOption[] = [
  {
    id: "mobile_top_up",
    label: "Mobile top-up",
    description: "Airtime credit for DigiCell or Smart!, applied in BZ$20 increments.",
    amountMode: "increments_20",
    minAmountBz: 20,
    incrementLabel: "BZ$20 increments",
    fields: [
      {
        name: "phone",
        label: "Mobile number",
        type: "tel",
        required: true,
        placeholder: "e.g. 501-600-1234",
        hint: "WhatsApp number on your profile is preferred.",
      },
      {
        name: "carrier",
        label: "Mobile carrier",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select carrier" },
          { value: "digicell", label: "DigiCell" },
          { value: "smart", label: "Smart!" },
        ],
      },
    ],
  },
  {
    id: "bank_transfer",
    label: "Bank/ Cash payout",
    description: "Direct deposit to your Belize bank account in BZ$20 increments.",
    amountMode: "increments_20",
    minAmountBz: 20,
    incrementLabel: "BZ$20 increments",
    fields: [
      {
        name: "bankName",
        label: "Bank name",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select bank" },
          { value: "belize_bank", label: "Belize Bank" },
          { value: "atlantic_bank", label: "Atlantic Bank" },
          { value: "heritage_bank", label: "Heritage Bank" },
          { value: "other", label: "Other" },
        ],
      },
      {
        name: "accountNumber",
        label: "Account number",
        type: "text",
        required: true,
      },
      {
        name: "accountHolderName",
        label: "Account holder name",
        type: "text",
        required: true,
      },
    ],
  },
  {
    id: "utility_credit",
    label: "Utility credit",
    description: "Pay toward your utility bill from BZ$20 upward.",
    amountMode: "custom_min_20",
    minAmountBz: 20,
    incrementLabel: "BZ$20 minimum",
    fields: [
      {
        name: "utilityProvider",
        label: "Utility provider",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select provider" },
          { value: "bel", label: "Belize Electricity Limited (BEL)" },
          { value: "bws", label: "Belize Water Services (BWS)" },
        ],
      },
      {
        name: "accountNumber",
        label: "Utility account number",
        type: "text",
        required: true,
        placeholder: "Account number on your bill",
      },
      {
        name: "accountName",
        label: "Account holder name",
        type: "text",
        required: true,
      },
      {
        name: "serviceAddress",
        label: "Service address",
        type: "textarea",
        required: true,
        placeholder: "Street address where the utility service is provided",
        hint: "Use the address shown on your utility bill.",
      },
    ],
  },
];

export type RedemptionRequestStatus = "pending" | "approved" | "rejected" | "fulfilled";

export interface RedemptionRequest {
  id: string;
  email: string;
  optionId: StoredRedemptionOptionId;
  optionLabel: string;
  points: number;
  amountBz?: number;
  valueLabel: string;
  status: RedemptionRequestStatus;
  details: Record<string, string>;
  notes: string;
  submittedAt: string;
  updatedAt: string;
  processedBy?: string;
}

export type PayoutProcessAction = "start" | "complete" | "reject";

export interface RedemptionAmountChoice {
  amountBz: number;
  points: number;
  label: string;
}

export interface RedemptionOptionProgress {
  option: RedemptionOption;
  eligible: boolean;
  pointsNeeded: number;
  progressPercent: number;
  minPoints: number;
  exampleTiers: RedemptionAmountChoice[];
}

export function bzToPoints(amountBz: number, settings: RewardSettings = DEFAULT_REWARD_SETTINGS): number {
  return Math.round(amountBz * settings.pointsPerBzDollar);
}

export function pointsToBz(points: number, settings: RewardSettings = DEFAULT_REWARD_SETTINGS): number {
  return points / settings.pointsPerBzDollar;
}

export function formatBz(amountBz: number): string {
  return `BZ$${amountBz % 1 === 0 ? amountBz : amountBz.toFixed(2)}`;
}

export function getMinPointsForOption(
  option: RedemptionOption,
  settings: RewardSettings = DEFAULT_REWARD_SETTINGS
): number {
  return bzToPoints(option.minAmountBz, settings);
}

export function getRedemptionOption(id: string): RedemptionOption | undefined {
  return REDEMPTION_OPTIONS.find((option) => option.id === id);
}

export function canAccessRedemption(
  totalPoints: number,
  settings: RewardSettings = DEFAULT_REWARD_SETTINGS
): boolean {
  return totalPoints >= settings.redemptionMinimumPoints;
}

export function getReservedPoints(requests: RedemptionRequest[]): number {
  return requests
    .filter((request) => request.status === "pending" || request.status === "approved")
    .reduce((sum, request) => sum + request.points, 0);
}

/** Spendable balance after fulfilled redemptions and active holds (pending/approved). */
export function getAvailablePoints(totalPoints: number, requests: RedemptionRequest[]): number {
  // totalPoints is the balance after fulfilled redemptions; subtract active holds only once.
  return Math.max(0, totalPoints - getReservedPoints(requests));
}

function getIncrementBz(mode: RedemptionAmountMode): number | null {
  if (mode === "increments_20") return 20;
  if (mode === "increments_50") return 50;
  return null;
}

export function getRedemptionAmountChoices(
  option: RedemptionOption,
  availablePoints: number,
  settings: RewardSettings = DEFAULT_REWARD_SETTINGS
): RedemptionAmountChoice[] {
  const minPoints = getMinPointsForOption(option, settings);
  if (availablePoints < minPoints) return [];

  const maxAmountBz = pointsToBz(availablePoints, settings);
  const increment = getIncrementBz(option.amountMode);

  if (increment) {
    const choices: RedemptionAmountChoice[] = [];
    for (let amountBz = option.minAmountBz; amountBz <= maxAmountBz + 0.001; amountBz += increment) {
      const points = bzToPoints(amountBz, settings);
      if (points > availablePoints) break;
      choices.push({
        amountBz,
        points,
        label: `${formatBz(amountBz)} (${points} pts)`,
      });
    }
    return choices;
  }

  return [];
}

export function getExampleTiers(
  option: RedemptionOption,
  count = 4,
  settings: RewardSettings = DEFAULT_REWARD_SETTINGS
): RedemptionAmountChoice[] {
  const increment = getIncrementBz(option.amountMode) ?? 20;
  const tiers: RedemptionAmountChoice[] = [];

  for (let index = 0; index < count; index += 1) {
    const amountBz = option.minAmountBz + index * increment;
    const points = bzToPoints(amountBz, settings);
    tiers.push({
      amountBz,
      points,
      label: `${formatBz(amountBz)} · ${points} pts`,
    });
  }

  return tiers;
}

export function buildRedemptionOptionProgress(
  availablePoints: number,
  option: RedemptionOption,
  settings: RewardSettings = DEFAULT_REWARD_SETTINGS
): RedemptionOptionProgress {
  const minPoints = getMinPointsForOption(option, settings);
  const pointsNeeded = Math.max(0, minPoints - availablePoints);
  const progressPercent = Math.min(100, Math.round((availablePoints / minPoints) * 100));

  return {
    option,
    eligible: availablePoints >= minPoints,
    pointsNeeded,
    progressPercent,
    minPoints,
    exampleTiers: getExampleTiers(option, 4, settings),
  };
}

export function getEligibleRedemptionOptions(
  totalPoints: number,
  requests: RedemptionRequest[],
  settings: RewardSettings = DEFAULT_REWARD_SETTINGS
): RedemptionOption[] {
  const available = getAvailablePoints(totalPoints, requests);
  return REDEMPTION_OPTIONS.filter((option) => available >= getMinPointsForOption(option, settings));
}

function parseAmountBz(raw: string): number | null {
  const cleaned = cleanText(raw).replace(/^\$|^BZ\$|^bz\$/i, "");
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) return null;
  return value;
}

function validateAmountForOption(
  option: RedemptionOption,
  amountBz: number,
  availablePoints: number,
  errors: Record<string, string>,
  settings: RewardSettings = DEFAULT_REWARD_SETTINGS
): number | null {
  if (amountBz < option.minAmountBz) {
    errors.amountBz = `Minimum redemption is ${formatBz(option.minAmountBz)}.`;
    return null;
  }

  const points = bzToPoints(amountBz, settings);
  if (points > availablePoints) {
    errors.amountBz = `You only have ${availablePoints} available points (${formatBz(pointsToBz(availablePoints, settings))}).`;
    return null;
  }

  const increment = getIncrementBz(option.amountMode);
  if (increment && amountBz % increment !== 0) {
    errors.amountBz = `Amount must be in ${option.incrementLabel.toLowerCase()}.`;
    return null;
  }

  if (option.amountMode === "custom_min_20" && amountBz < 20) {
    errors.amountBz = "Utility credit requests must be at least BZ$20.";
    return null;
  }

  return points;
}

export function validateRedemptionRequest(input: {
  optionId: string;
  amountBz?: number | string;
  details: Record<string, string>;
  notes?: string;
  totalPoints: number;
  requests: RedemptionRequest[];
  settings?: RewardSettings;
}):
  | {
      ok: true;
      option: RedemptionOption;
      amountBz: number;
      points: number;
      valueLabel: string;
      details: Record<string, string>;
      notes: string;
    }
  | { ok: false; errors: Record<string, string> } {
  const settings = input.settings ?? DEFAULT_REWARD_SETTINGS;
  const errors: Record<string, string> = {};

  if (!canAccessRedemption(getAvailablePoints(input.totalPoints, input.requests), settings)) {
    errors.form = `You need at least ${settings.redemptionMinimumPoints} points (${formatBz(redemptionMinimumBz(settings))}) before redeeming.`;
    return { ok: false, errors };
  }

  const option = getRedemptionOption(input.optionId);
  if (!option) {
    errors.optionId = "Please select a redemption option.";
    return { ok: false, errors };
  }

  const available = getAvailablePoints(input.totalPoints, input.requests);

  let amountBz: number | null = null;
  if (typeof input.amountBz === "number") {
    amountBz = input.amountBz;
  } else if (typeof input.amountBz === "string") {
    amountBz = parseAmountBz(input.amountBz);
    if (amountBz === null) {
      errors.amountBz = "Please enter a valid amount.";
      return { ok: false, errors };
    }
  } else {
    errors.amountBz = "Please select or enter a redemption amount.";
    return { ok: false, errors };
  }

  const points = validateAmountForOption(option, amountBz, available, errors, settings);
  if (points === null) {
    return { ok: false, errors };
  }

  const details: Record<string, string> = {};
  for (const field of option.fields) {
    const raw = cleanText(input.details[field.name] ?? "");
    if (field.required && !raw) {
      errors[field.name] = `${field.label} is required.`;
      continue;
    }
    if (field.type === "email" && raw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
      errors[field.name] = "Please enter a valid email address.";
      continue;
    }
    if (raw) details[field.name] = raw;
  }

  if (option.id === "bank_transfer") {
    validateBankPayoutLocation(input.details, errors);
    mergeBankPayoutLocationDetails(details, input.details);
  }

  const notes = cleanText(input.notes ?? "");
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    option,
    amountBz,
    points,
    valueLabel: `${formatBz(amountBz)} ${option.label.toLowerCase()}`,
    details,
    notes,
  };
}

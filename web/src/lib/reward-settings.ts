export interface RewardSettings {
  registrationRewardPoints: number;
  verificationRewardPoints: number;
  redemptionMinimumPoints: number;
  /** Points earned per BZ$1 when redeeming (25 → 500 pts = BZ$20). */
  pointsPerBzDollar: number;
  surveyRewardPresets: number[];
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_REWARD_SETTINGS: RewardSettings = {
  registrationRewardPoints: 25,
  verificationRewardPoints: 50,
  redemptionMinimumPoints: 500,
  pointsPerBzDollar: 25,
  surveyRewardPresets: [100, 150, 200],
};

function normalizePositiveInt(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.round(parsed));
}

export function normalizeRewardSettings(raw: Partial<RewardSettings> | null | undefined): RewardSettings {
  const presets = Array.isArray(raw?.surveyRewardPresets)
    ? raw!.surveyRewardPresets
        .map((value) => normalizePositiveInt(value, 0))
        .filter((value) => value > 0)
    : DEFAULT_REWARD_SETTINGS.surveyRewardPresets;

  return {
    registrationRewardPoints: normalizePositiveInt(
      raw?.registrationRewardPoints,
      DEFAULT_REWARD_SETTINGS.registrationRewardPoints
    ),
    verificationRewardPoints: normalizePositiveInt(
      raw?.verificationRewardPoints,
      DEFAULT_REWARD_SETTINGS.verificationRewardPoints
    ),
    redemptionMinimumPoints: normalizePositiveInt(
      raw?.redemptionMinimumPoints,
      DEFAULT_REWARD_SETTINGS.redemptionMinimumPoints
    ),
    pointsPerBzDollar: Math.max(
      1,
      normalizePositiveInt(raw?.pointsPerBzDollar, DEFAULT_REWARD_SETTINGS.pointsPerBzDollar)
    ),
    surveyRewardPresets: presets.length > 0 ? presets : DEFAULT_REWARD_SETTINGS.surveyRewardPresets,
    updatedAt: raw?.updatedAt,
    updatedBy: raw?.updatedBy,
  };
}

export function redemptionMinimumBz(settings: RewardSettings = DEFAULT_REWARD_SETTINGS): number {
  return settings.redemptionMinimumPoints / settings.pointsPerBzDollar;
}

export function redemptionRateLabel(settings: RewardSettings = DEFAULT_REWARD_SETTINGS): string {
  const bz = redemptionMinimumBz(settings);
  const formatted = bz % 1 === 0 ? String(bz) : bz.toFixed(2);
  return `${settings.redemptionMinimumPoints} points = BZ$${formatted}`;
}

export function surveyRewardPresetLabels(settings: RewardSettings = DEFAULT_REWARD_SETTINGS): string[] {
  return [...settings.surveyRewardPresets]
    .sort((a, b) => a - b)
    .map((points) => `${points} points`);
}

export function validateRewardSettingsInput(input: Partial<RewardSettings>): {
  ok: true;
  settings: RewardSettings;
} | {
  ok: false;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const registrationRewardPoints = normalizePositiveInt(
    input.registrationRewardPoints,
    DEFAULT_REWARD_SETTINGS.registrationRewardPoints
  );
  const verificationRewardPoints = normalizePositiveInt(
    input.verificationRewardPoints,
    DEFAULT_REWARD_SETTINGS.verificationRewardPoints
  );
  const redemptionMinimumPoints = normalizePositiveInt(
    input.redemptionMinimumPoints,
    DEFAULT_REWARD_SETTINGS.redemptionMinimumPoints
  );
  const pointsPerBzDollar = Math.max(
    1,
    normalizePositiveInt(input.pointsPerBzDollar, DEFAULT_REWARD_SETTINGS.pointsPerBzDollar)
  );

  if (redemptionMinimumPoints < pointsPerBzDollar) {
    errors.redemptionMinimumPoints = "Redemption minimum must be at least enough for BZ$1.";
  }

  const surveyRewardPresets = Array.isArray(input.surveyRewardPresets)
    ? input.surveyRewardPresets
        .map((value) => normalizePositiveInt(value, 0))
        .filter((value) => value > 0)
    : DEFAULT_REWARD_SETTINGS.surveyRewardPresets;

  if (surveyRewardPresets.length === 0) {
    errors.surveyRewardPresets = "Add at least one survey reward preset.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    settings: normalizeRewardSettings({
      registrationRewardPoints,
      verificationRewardPoints,
      redemptionMinimumPoints,
      pointsPerBzDollar,
      surveyRewardPresets,
    }),
  };
}

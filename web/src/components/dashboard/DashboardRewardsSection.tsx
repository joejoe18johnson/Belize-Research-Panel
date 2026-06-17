import type { DashboardRewardSummary } from "@/lib/panelist-dashboard";
import type { RedemptionRequest } from "@/lib/reward-redemption";
import type { RewardsHistoryEntry } from "@/lib/rewards-history";
import { REDEMPTION_MINIMUM_POINTS, REDEMPTION_RATE_LABEL, getAvailablePoints, getReservedPoints, pointsToBz, formatBz } from "@/lib/reward-redemption";
import { formatHeadingCase } from "@/lib/sentence-case";
import { GiftIcon, StarIcon } from "./DashboardIcons";
import { DashboardCard, SectionHeading } from "./DashboardShell";
import { DevPointsEditor } from "./DevPointsEditor";
import { RedemptionOptionsCatalog } from "./RedemptionOptionsCatalog";
import { RewardsHistory } from "./RewardsHistory";

const REWARD_RULES = [
  { label: "Registration completed", points: "25 points" },
  { label: "Verified account", points: "50 points" },
  { label: "Survey completed", points: "100 points" },
  { label: "In-depth interview completed", points: "250 points" },
  { label: "Focus group participation", points: "300 points" },
] as const;

export function DashboardRewardsSection({
  rewards,
  redemptionRequests,
  rewardsHistory,
  showDevPointsEditor = false,
}: {
  rewards: DashboardRewardSummary;
  redemptionRequests: RedemptionRequest[];
  rewardsHistory: RewardsHistoryEntry[];
  showDevPointsEditor?: boolean;
}) {
  const availablePoints = getAvailablePoints(rewards.totalPoints, redemptionRequests);
  const progressPercent = Math.min(100, Math.round((availablePoints / REDEMPTION_MINIMUM_POINTS) * 100));
  const pointsToMilestone = Math.max(0, REDEMPTION_MINIMUM_POINTS - availablePoints);

  return (
    <div className="space-y-6">
      {showDevPointsEditor ? <DevPointsEditor rewards={rewards} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard className="overflow-hidden border-teal-200 bg-gradient-to-br from-teal-50 via-white to-white p-0">
          <div className="overflow-hidden rounded-t-2xl border-b border-teal-100 dark:border-teal-900/60 bg-teal-700 px-6 py-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-teal-100">{formatHeadingCase("Available balance")}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{availablePoints}</p>
                <p className="mt-1 text-sm text-teal-100">{formatHeadingCase("Reward points")}</p>
                <p className="mt-1 text-xs text-teal-100/90">{REDEMPTION_RATE_LABEL}</p>
                {getReservedPoints(redemptionRequests) > 0 ? (
                  <p className="mt-2 text-xs text-teal-100/90">
                    {getReservedPoints(redemptionRequests)} pts reserved on pending requests
                  </p>
                ) : null}
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <StarIcon className="h-6 w-6" />
              </span>
            </div>
          </div>
          <div className="space-y-5 p-6">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2 text-xs font-medium">
                <span className="text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase("Progress to first redemption")}</span>
                <span className="text-teal-800 dark:text-teal-200">{progressPercent}%</span>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-zinc-200"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progress to redemption: ${progressPercent}%`}
              >
                <div
                  className="h-full rounded-full bg-teal-600 transition-all duration-500"
                  style={{ width: `${Math.max(progressPercent, 4)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                {pointsToMilestone > 0
                  ? `${pointsToMilestone} more points (${formatBz(pointsToBz(pointsToMilestone))}) until redemption unlocks.`
                  : formatHeadingCase("Redemption is unlocked — choose an option below and tap Redeem points.")}
              </p>
            </div>

            <ul className="space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-5 text-sm">
              <li className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{formatHeadingCase("Points earned to date")}</span>
                  <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{rewards.totalPointsToDate}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                  {formatBz(pointsToBz(rewards.totalPointsToDate))} cumulative · registration, verification, and
                  completed surveys
                </p>
              </li>
              {rewards.redeemedPoints > 0 ? (
                <li className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  <span>{formatHeadingCase("Redeemed or reserved")}</span>
                  <span className="font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">−{rewards.redeemedPoints}</span>
                </li>
              ) : null}
              <li className="rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-teal-900 dark:text-teal-100">{formatHeadingCase("Available balance")}</span>
                  <span className="text-lg font-bold text-teal-900 dark:text-teal-100">{availablePoints}</span>
                </div>
                <p className="mt-1 text-xs text-teal-800/80">
                  {formatBz(pointsToBz(availablePoints))} ·{" "}
                  {rewards.redeemedPoints > 0
                    ? formatHeadingCase("earned to date minus redemptions")
                    : formatHeadingCase("same as earned to date when nothing has been redeemed")}
                </p>
              </li>
              <li className="flex items-center justify-between gap-4 text-zinc-700 dark:text-zinc-300">
                <span>{formatHeadingCase("Registration completed")}</span>
                <span className="font-semibold text-teal-800 dark:text-teal-200">+{rewards.registrationPoints}</span>
              </li>
              <li className="flex items-center justify-between gap-4 text-zinc-700 dark:text-zinc-300">
                <span>{formatHeadingCase("Verified account")}</span>
                <span className="font-semibold text-teal-800 dark:text-teal-200">
                  {rewards.verified ? `+${rewards.verificationPoints}` : formatHeadingCase("Pending review")}
                </span>
              </li>
              <li className="flex items-center justify-between gap-4 text-zinc-700 dark:text-zinc-300">
                <span>{formatHeadingCase("Surveys completed")}</span>
                <span className="font-semibold text-teal-800 dark:text-teal-200">
                  {rewards.surveyPoints > 0 ? `+${rewards.surveyPoints}` : formatHeadingCase("None yet")}
                </span>
              </li>
            </ul>
          </div>
        </DashboardCard>

        <DashboardCard>
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <GiftIcon className="h-4 w-4" />
            </span>
            <SectionHeading as="h3">How points are earned</SectionHeading>
          </div>
          <ul className="mt-4 space-y-2.5 text-sm text-zinc-700 dark:text-zinc-300">
            {REWARD_RULES.map((rule) => (
              <li
                key={rule.label}
                className="flex justify-between gap-4 border-b border-zinc-50 pb-2.5 last:border-0 last:pb-0"
              >
                <span>{formatHeadingCase(rule.label)}</span>
                <span className="shrink-0 font-medium text-zinc-900 dark:text-zinc-100">{rule.points}</span>
              </li>
            ))}
          </ul>
        </DashboardCard>
      </div>

      <RedemptionOptionsCatalog totalPoints={rewards.totalPoints} requests={redemptionRequests} />

      <RewardsHistory entries={rewardsHistory} variant="earnings" />
    </div>
  );
}

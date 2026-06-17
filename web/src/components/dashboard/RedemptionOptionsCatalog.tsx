"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { RedemptionOption, RedemptionRequest } from "@/lib/reward-redemption";
import {
  REDEMPTION_MINIMUM_POINTS,
  REDEMPTION_OPTIONS,
  REDEMPTION_RATE_LABEL,
  buildRedemptionOptionProgress,
  canAccessRedemption,
  formatBz,
  getAvailablePoints,
  pointsToBz,
} from "@/lib/reward-redemption";
import {
  BoltIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  PhoneIcon,
} from "./DashboardIcons";
import { formatHeadingCase } from "@/lib/sentence-case";
import type { ViewLayout } from "@/lib/view-layout";
import { viewLayoutContainerClass, viewLayoutItemClass } from "@/lib/view-layout";
import { ViewLayoutToggle, useViewLayout } from "@/components/shared/ViewLayoutToggle";
import { DashboardCard, SectionHeading } from "./DashboardShell";

const REDEMPTION_OPTION_ICONS: Record<RedemptionOption["id"], { icon: ReactNode; tone: string }> = {
  mobile_top_up: {
    icon: <PhoneIcon className="h-5 w-5" />,
    tone: "bg-teal-100 text-teal-800",
  },
  bank_transfer: {
    icon: <BuildingLibraryIcon className="h-5 w-5" />,
    tone: "bg-sky-100 text-sky-800",
  },
  utility_credit: {
    icon: <BoltIcon className="h-5 w-5" />,
    tone: "bg-violet-100 text-violet-800",
  },
};

function RedemptionOptionIcon({ optionId }: { optionId: RedemptionOption["id"] }) {
  const { icon, tone } = REDEMPTION_OPTION_ICONS[optionId];

  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}

function RedemptionOptionCard({
  option,
  eligible,
  pointsNeeded,
  progressPercent,
  minPoints,
  exampleTiers,
  availablePoints,
  unlocked,
  layout,
}: {
  option: RedemptionOption;
  eligible: boolean;
  pointsNeeded: number;
  progressPercent: number;
  minPoints: number;
  exampleTiers: { amountBz: number; points: number; label: string }[];
  availablePoints: number;
  unlocked: boolean;
  layout: ViewLayout;
}) {
  const canRedeemNow = eligible && availablePoints >= minPoints;

  const content = (
    <>
      <div className={`flex gap-3 ${layout === "list" ? "items-center" : "flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between"}`}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <RedemptionOptionIcon optionId={option.id} />
            <h4 className="font-semibold text-zinc-900">{formatHeadingCase(option.label)}</h4>
            {canRedeemNow ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                {formatHeadingCase("Ready to redeem")}
              </span>
            ) : eligible ? (
              <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                {formatHeadingCase("Insufficient available points")}
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                {pointsNeeded} pts to unlock ({formatBz(option.minAmountBz)} minimum)
              </span>
            )}
          </div>
          {layout !== "horizontal" ? (
            <>
              <p className="mt-1 text-sm text-zinc-600">{option.description}</p>
              <p className="mt-1 text-xs font-medium text-teal-800">{option.incrementLabel}</p>
            </>
          ) : (
            <p className="mt-1 text-xs text-zinc-600">{formatBz(option.minAmountBz)} from {minPoints} pts</p>
          )}
        </div>
        <div className={`flex shrink-0 flex-col gap-2 ${layout === "list" ? "items-end" : "w-full sm:w-auto sm:items-end"}`}>
          {layout !== "horizontal" ? (
            <div className="text-left sm:text-right">
              <p className="text-sm font-bold text-zinc-900">{minPoints} pts</p>
              <p className="text-xs text-zinc-500">from {formatBz(option.minAmountBz)}</p>
            </div>
          ) : null}
          {unlocked ? (
            <Link
              href={`/dashboard/rewards/redeem?option=${option.id}`}
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Redeem points
            </Link>
          ) : null}
        </div>
      </div>

      {layout === "cards" ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {exampleTiers.map((tier) => (
              <span
                key={tier.amountBz}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                  availablePoints >= tier.points
                    ? "border-teal-200 bg-teal-50 text-teal-800"
                    : "border-zinc-200 bg-zinc-50 text-zinc-600"
                }`}
              >
                {tier.label}
              </span>
            ))}
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-zinc-600">
              <span>{formatHeadingCase("Progress to minimum")}</span>
              <span>{Math.min(progressPercent, 100)}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-zinc-200"
              role="progressbar"
              aria-valuenow={Math.min(progressPercent, 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progress to ${option.label}: ${Math.min(progressPercent, 100)}%`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  canRedeemNow ? "bg-emerald-500" : eligible ? "bg-teal-600" : "bg-teal-500/70"
                }`}
                style={{ width: `${Math.max(Math.min(progressPercent, 100), 4)}%` }}
              />
            </div>
          </div>
        </>
      ) : null}
    </>
  );

  return (
    <div
      className={`rounded-xl border p-4 transition ${
        canRedeemNow
          ? "border-emerald-200 bg-emerald-50/40"
          : eligible
            ? "border-zinc-200 bg-zinc-50/50"
            : "border-zinc-200 bg-white"
      } ${layout === "horizontal" ? "h-full" : ""}`}
    >
      {content}
    </div>
  );
}

export function RedemptionOptionsCatalog({
  totalPoints,
  requests,
}: {
  totalPoints: number;
  requests: RedemptionRequest[];
}) {
  const availablePoints = getAvailablePoints(totalPoints, requests);
  const unlocked = canAccessRedemption(availablePoints);
  const progressItems = REDEMPTION_OPTIONS.map((option) => buildRedemptionOptionProgress(availablePoints, option));
  const [layout, setLayout] = useViewLayout("dashboard-redemption-options");

  return (
    <DashboardCard>
      <div className="flex flex-col gap-4 border-b border-zinc-100 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0 flex-1">
          <SectionHeading as="h3">Redemption options</SectionHeading>
          <p className="mt-1 text-sm text-zinc-600">
            {REDEMPTION_RATE_LABEL}.{" "}
            {unlocked
              ? formatHeadingCase("Choose a reward below when you have enough available points.")
              : `Earn ${REDEMPTION_MINIMUM_POINTS} points (${formatBz(20)}) to unlock redemption.`}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <ViewLayoutToggle value={layout} onChange={setLayout} />
          <div className="w-full rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 sm:w-auto sm:shrink-0 sm:px-3 sm:py-2 sm:text-right">
          <div className="flex items-center justify-between gap-4 sm:block">
            <div>
              <p className="text-xs font-medium text-teal-700">{formatHeadingCase("Available to redeem")}</p>
              <p className="text-lg font-bold text-teal-900">{availablePoints} pts</p>
            </div>
            <p className="text-sm font-semibold text-teal-700 sm:mt-0 sm:text-xs sm:font-normal">
              {formatBz(pointsToBz(availablePoints))}
            </p>
          </div>
          </div>
        </div>
      </div>

      <div className={`mt-5 ${viewLayoutContainerClass(layout, "grid gap-4 sm:grid-cols-2")}`}>
        {progressItems.map(({ option, eligible, pointsNeeded, progressPercent, minPoints, exampleTiers }) => (
          <div key={option.id} className={viewLayoutItemClass(layout, "w-[min(88vw,16rem)]")}>
            <RedemptionOptionCard
              option={option}
              eligible={eligible}
              pointsNeeded={pointsNeeded}
              progressPercent={progressPercent}
              minPoints={minPoints}
              exampleTiers={exampleTiers}
              availablePoints={availablePoints}
              unlocked={unlocked}
              layout={layout}
            />
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}


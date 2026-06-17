"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, TextInput } from "@/components/registration/form-ui";
import type { DashboardRewardSummary } from "@/lib/panelist-dashboard";
import { formatBz, pointsToBz } from "@/lib/reward-redemption";
import { formatHeadingCase } from "@/lib/sentence-case";
import { DashboardCard, SectionHeading } from "./DashboardShell";

const QUICK_AMOUNTS = [25, 75, 500, 1250, 2000, 5000] as const;

export function DevPointsEditor({ rewards }: { rewards: DashboardRewardSummary }) {
  const router = useRouter();
  const calculated = rewards.calculatedPoints ?? rewards.totalPoints;
  const [input, setInput] = useState(String(rewards.totalPoints));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const applyPoints = async (points: number | null) => {
    setSubmitting(true);
    setErrors({});
    setMessage("");

    try {
      const res = await fetch("/api/rewards/points", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(points === null ? { clear: true } : { totalPoints: points }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        errors?: Record<string, string>;
        rewards?: DashboardRewardSummary;
      };

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setErrors({ totalPoints: data.message ?? "Could not update points." });
        return;
      }

      const nextTotal = data.rewards?.totalPoints ?? points ?? calculated;
      setInput(String(nextTotal));
      setMessage(data.message ?? "Points updated.");
      router.refresh();
    } catch {
      setErrors({ totalPoints: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = () => {
    const parsed = Number.parseInt(input, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setErrors({ totalPoints: "Enter a valid points amount (0 or greater)." });
      return;
    }
    void applyPoints(parsed);
  };

  return (
    <DashboardCard className="border-dashed border-amber-300 bg-amber-50/50">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-amber-200/80 pb-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-amber-800">{formatHeadingCase("Dev tool")}</p>
          <SectionHeading as="h3" className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Adjust test points
          </SectionHeading>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
            Override your point balance to preview redemption tiers and forms. Only available in development.
          </p>
        </div>
        {rewards.usingOverride ? (
          <span className="rounded-full bg-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-900">
            {formatHeadingCase("Override active")}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-sm">
          <p className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase("Calculated balance")}</p>
          <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">{calculated} pts</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{formatBz(pointsToBz(calculated))}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-sm">
          <p className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase("Total points to date")}</p>
          <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">{rewards.totalPointsToDate} pts</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{formatBz(pointsToBz(rewards.totalPointsToDate))}</p>
        </div>
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm">
          <p className="text-teal-700">{formatHeadingCase("Displayed balance")}</p>
          <p className="mt-1 text-lg font-bold text-teal-900 dark:text-teal-100">{rewards.totalPoints} pts</p>
          <p className="text-xs text-teal-700">{formatBz(pointsToBz(rewards.totalPoints))}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <Field label="Set test points" error={errors.totalPoints} id="dev-points-input">
          <TextInput
            id="dev-points-input"
            type="number"
            min={0}
            step={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            error={errors.totalPoints}
          />
        </Field>

        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              disabled={submitting}
              onClick={() => {
                setInput(String(amount));
                void applyPoints(amount);
              }}
              className="rounded-lg border border-amber-300 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
            >
              {amount} pts
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-700 px-4 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Apply points"}
          </button>
          {rewards.usingOverride ? (
            <button
              type="button"
              onClick={() => void applyPoints(null)}
              disabled={submitting}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-300 bg-white dark:bg-zinc-900 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950 disabled:opacity-60"
            >
              Reset to calculated
            </button>
          ) : null}
        </div>

        {message ? (
          <p className="text-sm text-emerald-700" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </DashboardCard>
  );
}

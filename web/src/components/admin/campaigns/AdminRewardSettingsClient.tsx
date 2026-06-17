"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MetricCard, PageIntro } from "@/components/admin/shared/AdminUi";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import {
  redemptionMinimumBz,
  redemptionRateLabel,
  type RewardSettings,
} from "@/lib/reward-settings";
import { formatBz } from "@/lib/reward-redemption";
import { formatHeadingCase } from "@/lib/sentence-case";

function NumberField({
  label,
  hint,
  value,
  error,
  onChange,
  min = 0,
}: {
  label: string;
  hint?: string;
  value: number;
  error?: string;
  onChange: (value: number) => void;
  min?: number;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{formatHeadingCase(label)}</label>
      {hint ? <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p> : null}
      <input
        type="number"
        min={min}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
            : "border-zinc-200 dark:border-zinc-800 focus:border-teal-600 focus:ring-teal-600/20"
        } bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2`}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function AdminRewardSettingsClient({ initialSettings }: { initialSettings: RewardSettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [surveyPresetsText, setSurveyPresetsText] = useState(initialSettings.surveyRewardPresets.join(", "));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const preview = useMemo(() => {
    const draft: RewardSettings = {
      ...settings,
      surveyRewardPresets: surveyPresetsText
        .split(/[,\s]+/)
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0),
    };
    return {
      rateLabel: redemptionRateLabel(draft),
      minimumBz: formatBz(redemptionMinimumBz(draft)),
      unlockLabel: `${draft.redemptionMinimumPoints} pts`,
    };
  }, [settings, surveyPresetsText]);

  const update = <K extends keyof RewardSettings>(key: K, value: RewardSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    setErrors({});

    const surveyRewardPresets = surveyPresetsText
      .split(/[,\s]+/)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0);

    try {
      const res = await fetch("/api/admin/reward-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, surveyRewardPresets }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        settings?: RewardSettings;
        errors?: Record<string, string>;
        message?: string;
      };

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setMessage(data.message ?? "Could not save reward settings.");
        return;
      }

      if (data.settings) {
        setSettings(data.settings);
        setSurveyPresetsText(data.settings.surveyRewardPresets.join(", "));
      }
      setMessage("Reward settings saved.");
      router.refresh();
    } catch {
      setMessage("Network error while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageIntro
          eyebrow="Campaigns"
          title={formatHeadingCase("Reward settings")}
          description="Configure panelist earning rules, redemption thresholds, and the points-to-cash rate shown on the dashboard."
        />
        <Link
          href="/admin/campaigns"
          className="inline-flex min-h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Back to campaigns
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Redemption minimum" value={preview.unlockLabel} hint={preview.minimumBz} />
        <MetricCard label="Redemption rate" value={preview.rateLabel} />
        <MetricCard label="Registration reward" value={`${settings.registrationRewardPoints} pts`} />
        <MetricCard label="Verification reward" value={`${settings.verificationRewardPoints} pts`} />
      </div>

      {message ? (
        <BrandedAlert tone={message.includes("saved") ? "success" : "error"} showIcon>
          {message}
        </BrandedAlert>
      ) : null}

      <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">
            {formatHeadingCase("Earning rewards")}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Points awarded automatically when panelists register and when their account is verified.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Registration reward"
            hint="Awarded when a panelist completes registration."
            value={settings.registrationRewardPoints}
            error={errors.registrationRewardPoints}
            onChange={(value) => update("registrationRewardPoints", value)}
            min={0}
          />
          <NumberField
            label="Verification reward"
            hint="Awarded when verification status is Verified."
            value={settings.verificationRewardPoints}
            error={errors.verificationRewardPoints}
            onChange={(value) => update("verificationRewardPoints", value)}
            min={0}
          />
        </div>
      </section>

      <section className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">
            {formatHeadingCase("Redemption thresholds")}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Controls when panelists can redeem and how points convert to Belize dollars on the rewards dashboard.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Redemption minimum"
            hint="Minimum available balance before any redemption option unlocks."
            value={settings.redemptionMinimumPoints}
            error={errors.redemptionMinimumPoints}
            onChange={(value) => update("redemptionMinimumPoints", value)}
            min={1}
          />
          <NumberField
            label="Points per BZ$1"
            hint="Used to calculate cash value (25 → 500 pts = BZ$20)."
            value={settings.pointsPerBzDollar}
            error={errors.pointsPerBzDollar}
            onChange={(value) => update("pointsPerBzDollar", value)}
            min={1}
          />
        </div>
        <div className="rounded-xl border border-teal-100 bg-teal-50/60 px-4 py-3 text-sm text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100">
          <p className="font-semibold">Live preview</p>
          <p className="mt-1">
            {preview.rateLabel} · Minimum unlock: {preview.unlockLabel} ({preview.minimumBz})
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">
            {formatHeadingCase("Survey reward presets")}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Default point values offered when configuring survey campaigns (comma-separated).
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            {formatHeadingCase("Preset point values")}
          </label>
          <input
            type="text"
            value={surveyPresetsText}
            onChange={(event) => setSurveyPresetsText(event.target.value)}
            placeholder="100, 150, 200"
            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
          {errors.surveyRewardPresets ? (
            <p className="mt-1 text-xs text-red-600">{errors.surveyRewardPresets}</p>
          ) : null}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save reward settings"}
        </button>
        {settings.updatedAt ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Last updated {new Date(settings.updatedAt).toLocaleString()}
            {settings.updatedBy ? ` by ${settings.updatedBy}` : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}

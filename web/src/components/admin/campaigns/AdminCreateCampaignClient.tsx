"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FilterMultiSelect, MetricCard, PageIntro } from "@/components/admin/shared/AdminUi";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { SiteSelect, mapStringOptions } from "@/components/shared/SiteSelect";
import {
  CAMPAIGN_TARGET_OPTIONS,
  countCampaignAudience,
  type CampaignTargetMode,
  type CampaignTargeting,
} from "@/lib/campaign-targeting";
import { DELIVERY_METHODS } from "@/lib/admin-survey-distribution";
import { BELIZE_DISTRICTS, getConstituencyOptions } from "@/lib/constants";
import type { PanelistRow } from "@/lib/panelists";
import type { SurveyCategory } from "@/lib/panelist-surveys-types";
import type { SurveyDefinition } from "@/lib/survey-types";
import { formatHeadingCase } from "@/lib/sentence-case";

const CATEGORIES: SurveyCategory[] = ["political", "market", "civic"];

function defaultDueDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

export function AdminCreateCampaignClient({
  panelists,
  publishedSurveys,
}: {
  panelists: PanelistRow[];
  publishedSurveys: SurveyDefinition[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SurveyCategory>("civic");
  const [deliveryType, setDeliveryType] = useState<"internal" | "external">("internal");
  const [surveyDefinitionId, setSurveyDefinitionId] = useState(publishedSurveys[0]?.id ?? "");
  const [surveyUrl, setSurveyUrl] = useState("");
  const [points, setPoints] = useState(100);
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().slice(0, 10));
  const [completeByDate, setCompleteByDate] = useState(defaultDueDate(14));
  const [deliveryMethod, setDeliveryMethod] = useState<string>(DELIVERY_METHODS[4]);
  const [targetMode, setTargetMode] = useState<CampaignTargetMode>("all_verified");
  const [constituency, setConstituency] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [constituencies, setConstituencies] = useState<string[]>([]);
  const [emails, setEmails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const targeting = useMemo<CampaignTargeting>(
    () => ({
      mode: targetMode,
      constituency: constituency || undefined,
      districts: districts.length ? districts : undefined,
      constituencies: constituencies.length ? constituencies : undefined,
      emails: emails
        .split(/[\n,;]+/)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    }),
    [targetMode, constituency, districts, constituencies, emails]
  );

  const eligibleCount = useMemo(() => countCampaignAudience(panelists, targeting), [panelists, targeting]);

  const constituencyOptions = useMemo(() => getConstituencyOptions(), []);

  const launchCampaign = async () => {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          deliveryType,
          surveyDefinitionId: deliveryType === "internal" ? surveyDefinitionId : undefined,
          surveyUrl: deliveryType === "external" ? surveyUrl : undefined,
          points,
          assignedDate,
          completeByDate,
          deliveryMethod,
          targetMode,
          constituency,
          districts,
          constituencies,
          emails,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; campaign?: { id: string } };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Could not launch campaign.");
        return;
      }
      setSuccess(data.message ?? "Campaign launched.");
      router.push(data.campaign?.id ? `/admin/campaigns?campaign=${encodeURIComponent(data.campaign.id)}` : "/admin/campaigns");
      router.refresh();
    } catch {
      setError("Network error while launching campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[960px] space-y-6">
      <PageIntro
        eyebrow="Campaign builder"
        title="Create campaign"
        description="Launch a targeted survey campaign to verified panelists by district, constituency, voter status, market interests, or specific email addresses."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Eligible panelists" value={eligibleCount} hint="Matches current targeting" />
        <MetricCard label="Verified active" value={panelists.filter((row) => row.verification_status === "Verified" && row.status === "Active").length} />
        <MetricCard label="Total register" value={panelists.length} />
      </div>

      {error ? (
        <BrandedAlert tone="error" showIcon>
          {error}
        </BrandedAlert>
      ) : null}
      {success ? (
        <BrandedAlert tone="success" showIcon>
          {success}
        </BrandedAlert>
      ) : null}

      <form
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          launchCampaign();
        }}
      >
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-teal-950">{formatHeadingCase("Campaign details")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-600">Campaign title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Q2 Belize consumer sentiment"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-600">Description (optional)</label>
              <textarea
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600">Category</label>
              <SiteSelect
                value={category}
                onChange={(value) => setCategory(value as SurveyCategory)}
                options={CATEGORIES.map((item) => ({
                  value: item,
                  label: formatHeadingCase(item),
                }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600">Reward points</label>
              <input
                type="number"
                min={0}
                step={25}
                value={points}
                onChange={(event) => setPoints(Number(event.target.value))}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-600">Survey delivery</label>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryType("internal")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    deliveryType === "internal"
                      ? "bg-teal-700 text-white"
                      : "border border-zinc-200 bg-white text-zinc-700 hover:bg-teal-50"
                  }`}
                >
                  On-site survey (built in BRP)
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType("external")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    deliveryType === "external"
                      ? "bg-teal-700 text-white"
                      : "border border-zinc-200 bg-white text-zinc-700 hover:bg-teal-50"
                  }`}
                >
                  External link
                </button>
              </div>
            </div>
            {deliveryType === "internal" ? (
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-600">Published survey</label>
                <SiteSelect
                  value={surveyDefinitionId}
                  onChange={setSurveyDefinitionId}
                  placeholder="Select a published survey"
                  options={[
                    { value: "", label: "Select a published survey" },
                    ...publishedSurveys.map((survey) => ({
                      value: survey.id,
                      label: `${survey.title} (${survey.questions.length} questions)`,
                    })),
                  ]}
                  className="mt-1.5"
                />
                {publishedSurveys.length === 0 ? (
                  <p className="mt-2 text-sm text-amber-700">
                    No published surveys yet.{" "}
                    <Link href="/admin/surveys/create" className="font-semibold underline">
                      Create one first
                    </Link>
                    .
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-600">Survey URL</label>
                <input
                  type="url"
                  required
                  value={surveyUrl}
                  onChange={(event) => setSurveyUrl(event.target.value)}
                  placeholder="https://forms.gle/..."
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-zinc-600">Assigned date</label>
              <input
                type="date"
                required
                value={assignedDate}
                onChange={(event) => setAssignedDate(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600">Complete by date</label>
              <input
                type="date"
                required
                value={completeByDate}
                onChange={(event) => setCompleteByDate(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-600">Delivery method</label>
              <SiteSelect
                value={deliveryMethod}
                onChange={setDeliveryMethod}
                options={mapStringOptions(DELIVERY_METHODS)}
                className="mt-1.5"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-zinc-100 pt-6">
          <h2 className="text-base font-semibold text-teal-950">{formatHeadingCase("Target audience")}</h2>
          <div>
            <label className="text-xs font-semibold text-zinc-600">Target group</label>
            <SiteSelect
              value={targetMode}
              onChange={(value) => setTargetMode(value as CampaignTargetMode)}
              options={CAMPAIGN_TARGET_OPTIONS.map((option) => ({
                value: option.id,
                label: option.label,
              }))}
              className="mt-1.5"
            />
          </div>

          {targetMode === "specific_constituency" ? (
            <div>
              <label className="text-xs font-semibold text-zinc-600">Constituency</label>
              <SiteSelect
                value={constituency}
                onChange={setConstituency}
                placeholder="Select constituency"
                options={[
                  { value: "", label: "Select constituency" },
                  ...mapStringOptions(constituencyOptions.filter(Boolean)),
                ]}
                className="mt-1.5"
              />
            </div>
          ) : null}

          {targetMode === "specific_districts" ? (
            <FilterMultiSelect label="Districts" options={[...BELIZE_DISTRICTS]} selected={districts} onChange={setDistricts} />
          ) : null}

          {targetMode === "specific_constituencies" ? (
            <FilterMultiSelect
              label="Constituencies"
              options={constituencyOptions.filter(Boolean)}
              selected={constituencies}
              onChange={setConstituencies}
            />
          ) : null}

          {targetMode === "specific_emails" ? (
            <div>
              <label className="text-xs font-semibold text-zinc-600">Panelist emails</label>
              <textarea
                rows={4}
                value={emails}
                onChange={(event) => setEmails(event.target.value)}
                placeholder="One email per line, or comma-separated"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
          ) : null}

          <BrandedAlert tone="info" compact showIcon>
            {eligibleCount} panelist{eligibleCount === 1 ? "" : "s"} will receive this campaign when launched.
            Assignments appear in each panelist&apos;s survey inbox immediately.
          </BrandedAlert>
        </section>

        <div className="flex flex-wrap gap-3 border-t border-zinc-100 pt-4">
          <button
            type="submit"
            disabled={submitting || eligibleCount === 0 || (deliveryType === "internal" && !surveyDefinitionId)}
            className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {submitting ? "Launching…" : `Launch to ${eligibleCount} panelist${eligibleCount === 1 ? "" : "s"}`}
          </button>
          <Link
            href="/admin/campaigns"
            className="inline-flex min-h-11 items-center rounded-xl border border-teal-200 bg-white px-5 text-sm font-semibold text-teal-800 hover:bg-teal-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

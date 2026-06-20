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
import type { PanelistGroup } from "@/lib/panelist-group-types";
import { countPanelistGroupMembers } from "@/lib/panelist-group-resolve";
import type { PanelistRow } from "@/lib/panelists";
import type { SurveyCategory } from "@/lib/panelist-surveys-types";
import type { CampaignAssignmentLink } from "@/lib/campaign-survey-links";
import type { CampaignRecord } from "@/lib/campaign-targeting";
import type { ClientUserRecord } from "@/lib/client-users";
import type { SurveyDefinition } from "@/lib/survey-types";
import { formatHeadingCase } from "@/lib/sentence-case";
import { CampaignLaunchLinks } from "./CampaignLaunchLinks";

const CATEGORIES: SurveyCategory[] = ["political", "market", "civic"];

function defaultDueDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

export function AdminCreateCampaignClient({
  panelists,
  publishedSurveys,
  clients,
  groups,
}: {
  panelists: PanelistRow[];
  publishedSurveys: SurveyDefinition[];
  clients: ClientUserRecord[];
  groups: PanelistGroup[];
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
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [clientId, setClientId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [launchedCampaign, setLaunchedCampaign] = useState<CampaignRecord | null>(null);
  const [launchedSurveyLinks, setLaunchedSurveyLinks] = useState<CampaignAssignmentLink[]>([]);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === groupId) ?? null,
    [groups, groupId]
  );

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
      groupId: groupId || undefined,
      groupName: selectedGroup?.name,
    }),
    [targetMode, constituency, districts, constituencies, emails, groupId, selectedGroup]
  );

  const eligibleCount = useMemo(
    () =>
      countCampaignAudience(
        panelists,
        targeting,
        selectedGroup ? { group: selectedGroup } : undefined
      ),
    [panelists, targeting, selectedGroup]
  );

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
          groupId,
          clientId,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        campaign?: CampaignRecord;
        surveyLinks?: CampaignAssignmentLink[];
      };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Could not launch campaign.");
        return;
      }
      setSuccess(data.message ?? "Campaign launched.");
      if (data.campaign && data.surveyLinks?.length) {
        setLaunchedCampaign(data.campaign);
        setLaunchedSurveyLinks(data.surveyLinks);
      } else {
        router.push(data.campaign?.id ? `/admin/campaigns?campaign=${encodeURIComponent(data.campaign.id)}` : "/admin/campaigns");
        router.refresh();
      }
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
      {success && launchedCampaign && launchedSurveyLinks.length > 0 ? (
        <>
          <BrandedAlert tone="success" showIcon>
            {success}
          </BrandedAlert>
          <CampaignLaunchLinks campaign={launchedCampaign} surveyLinks={launchedSurveyLinks} />
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/campaigns/${encodeURIComponent(launchedCampaign.id)}/results`}
              className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800"
            >
              View campaign results
            </Link>
            <Link
              href="/admin/campaigns"
              className="inline-flex min-h-11 items-center rounded-xl border border-teal-200 bg-white dark:bg-zinc-900 px-5 text-sm font-semibold text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40"
            >
              Back to campaigns
            </Link>
            <button
              type="button"
              onClick={() => {
                setLaunchedCampaign(null);
                setLaunchedSurveyLinks([]);
                setSuccess("");
                setTitle("");
                setDescription("");
                setSurveyUrl("");
              }}
              className="inline-flex min-h-11 items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950"
            >
              Create another campaign
            </button>
          </div>
        </>
      ) : null}

      {!launchedCampaign ? (
      <form
        className="space-y-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          launchCampaign();
        }}
      >
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Campaign details")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Campaign title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Q2 Belize consumer sentiment"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Description (optional)</label>
              <textarea
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
                Client account (optional)
              </label>
              <SiteSelect
                value={clientId}
                onChange={setClientId}
                options={[
                  { value: "", label: "No client portal access" },
                  ...clients
                    .filter((client) => client.status === "active")
                    .map((client) => ({
                      value: client.id,
                      label: `${client.organization_name} (${client.email})`,
                    })),
                ]}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Links this study to a client login so they can view results in the client portal.
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Category</label>
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
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Reward points</label>
              <input
                type="number"
                min={0}
                step={25}
                value={points}
                onChange={(event) => setPoints(Number(event.target.value))}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Survey delivery</label>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryType("internal")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    deliveryType === "internal"
                      ? "bg-teal-700 text-white"
                      : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-teal-50 dark:hover:bg-teal-900/40"
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
                      : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-teal-50 dark:hover:bg-teal-900/40"
                  }`}
                >
                  External link
                </button>
              </div>
            </div>
            {deliveryType === "internal" ? (
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Published survey</label>
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
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Survey URL</label>
                <input
                  type="url"
                  required
                  value={surveyUrl}
                  onChange={(event) => setSurveyUrl(event.target.value)}
                  placeholder="https://forms.gle/..."
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Assigned date</label>
              <input
                type="date"
                required
                value={assignedDate}
                onChange={(event) => setAssignedDate(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Complete by date</label>
              <input
                type="date"
                required
                value={completeByDate}
                onChange={(event) => setCompleteByDate(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Delivery method</label>
              <SiteSelect
                value={deliveryMethod}
                onChange={setDeliveryMethod}
                options={mapStringOptions(DELIVERY_METHODS)}
                className="mt-1.5"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-6">
          <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Target audience")}</h2>
          <div>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Target group</label>
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
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Constituency</label>
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
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Panelist emails</label>
              <textarea
                rows={4}
                value={emails}
                onChange={(event) => setEmails(event.target.value)}
                placeholder="One email per line, or comma-separated"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
          ) : null}

          {targetMode === "panelist_group" ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
                  Saved panelist group
                </label>
                <SiteSelect
                  value={groupId}
                  onChange={setGroupId}
                  placeholder="Select a group"
                  options={[
                    { value: "", label: "Select a group" },
                    ...groups.map((group) => ({
                      value: group.id,
                      label: group.name,
                    })),
                  ]}
                  className="mt-1.5"
                />
              </div>
              {groups.length === 0 ? (
                <BrandedAlert tone="info" compact showIcon>
                  No saved groups yet.{" "}
                  <Link href="/admin/groups/create" className="font-semibold underline">
                    Create a group
                  </Link>{" "}
                  under Panelists → Groups.
                </BrandedAlert>
              ) : selectedGroup ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {selectedGroup.description || "Reusable audience saved from the Groups admin page."}{" "}
                  {countPanelistGroupMembers(panelists, selectedGroup)} panelist
                  {countPanelistGroupMembers(panelists, selectedGroup) === 1 ? "" : "s"} currently match.
                </p>
              ) : null}
            </div>
          ) : null}

          <BrandedAlert tone="info" compact showIcon>
            {eligibleCount} panelist{eligibleCount === 1 ? "" : "s"} will receive this campaign when launched.
            Assignments appear in each panelist&apos;s survey inbox immediately.
          </BrandedAlert>
        </section>

        <div className="flex flex-wrap gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <button
            type="submit"
            disabled={
              submitting ||
              eligibleCount === 0 ||
              (deliveryType === "internal" && !surveyDefinitionId) ||
              (targetMode === "panelist_group" && !groupId)
            }
            className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {submitting ? "Launching…" : `Launch to ${eligibleCount} panelist${eligibleCount === 1 ? "" : "s"}`}
          </button>
          <Link
            href="/admin/campaigns"
            className="inline-flex min-h-11 items-center rounded-xl border border-teal-200 bg-white dark:bg-zinc-900 px-5 text-sm font-semibold text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40"
          >
            Cancel
          </Link>
        </div>
      </form>
      ) : null}
    </div>
  );
}

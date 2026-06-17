"use client";

import { useMemo, useState } from "react";
import type { CampaignAssignmentLink } from "@/lib/campaign-survey-links";
import type { CampaignRecord } from "@/lib/campaign-targeting";
import { formatHeadingCase } from "@/lib/sentence-case";

function CopyableLinkField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("textarea");
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{label}</label>
      {hint ? <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{hint}</p> : null}
      <div className="mt-1.5 flex gap-2">
        <input
          type="text"
          readOnly
          value={value}
          className="min-w-0 flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-800 dark:text-zinc-200"
          onFocus={(event) => event.target.select()}
        />
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-800 dark:text-teal-200 hover:bg-teal-100"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export function CampaignLaunchLinks({
  campaign,
  surveyLinks,
}: {
  campaign: CampaignRecord;
  surveyLinks: CampaignAssignmentLink[];
}) {
  const sharedLink = surveyLinks[0]?.surveyLink ?? "";
  const allSameLink = useMemo(
    () => surveyLinks.every((row) => row.surveyLink === sharedLink),
    [surveyLinks, sharedLink]
  );

  const copyAllText = useMemo(
    () =>
      surveyLinks
        .map((row) => `${row.panelistName} <${row.panelistEmail}>\n${row.surveyLink}`)
        .join("\n\n"),
    [surveyLinks]
  );

  const [copiedAll, setCopiedAll] = useState(false);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(copyAllText);
      setCopiedAll(true);
      window.setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      setCopiedAll(false);
    }
  };

  return (
    <section className="space-y-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Survey links")}</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
          {campaign.deliveryType === "internal"
            ? "Each panelist uses the link below after signing in to their Belize Research Panel account."
            : "Copy and share each panelist’s survey link by email, WhatsApp, or your delivery method."}
        </p>
      </div>

      {allSameLink && sharedLink ? (
        <CopyableLinkField
          label={campaign.deliveryType === "internal" ? "On-site survey link" : "External survey link"}
          value={sharedLink}
          hint={
            campaign.deliveryType === "internal"
              ? "Same link for all assigned panelists — they must log in with their own account to respond."
              : "This external link is shared across all assignments in this campaign."
          }
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {surveyLinks.length} panelist link{surveyLinks.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={copyAll}
          className="inline-flex min-h-10 items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950"
        >
          {copiedAll ? "All links copied" : "Copy all links"}
        </button>
      </div>

      <div className="max-h-[28rem] space-y-3 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 sm:p-4">
        {surveyLinks.map((row) => (
          <div key={row.panelistEmail} className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 p-4">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{row.panelistName}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{row.panelistEmail}</p>
            <div className="mt-3">
              <CopyableLinkField label="Survey link" value={row.surveyLink} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

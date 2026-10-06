"use client";

import type { ReactNode } from "react";
import type { DuplicateReviewCluster } from "@/lib/admin-panelists";
import { formatAccountOpenedAt, isFlaggedPanelist, type AdminPanelistPublicRow } from "@/lib/admin-panelists";
import { formatDobDisplay } from "@/lib/dob";
import { formatAdminLabel } from "@/lib/sentence-case";
import { cleanText } from "@/lib/validation";
import { RequirementStatusGroup } from "@/components/admin/shared/RequirementStatusBadges";
import type { RequirementApprovalStatus } from "@/lib/panelist-requirements";

type RowActions = {
  onEdit: (email: string) => void;
  onFlag: (email: string) => void;
  onDelete: (email: string) => void;
  flaggingEmail?: string;
  deletingEmail?: string;
};

const COMPARE_FIELDS = [
  { key: "account_opened_at", label: "Account opened" },
  { key: "username", label: "Username" },
  { key: "email", label: "Email" },
  { key: "phone_whatsapp", label: "Phone" },
  { key: "district", label: "District" },
  { key: "city_town_village", label: "City / town" },
  { key: "constituency", label: "Constituency" },
  { key: "verification_status", label: "Verification" },
  { key: "status", label: "Panel status" },
  { key: "photo_id_type", label: "Photo ID type" },
  { key: "photo_id_last4", label: "Photo ID last 4" },
] as const;

function fieldValue(row: AdminPanelistPublicRow, key: string): string {
  if (key === "account_opened_at") return formatAccountOpenedAt(row.account_opened_at ?? row.registration_date ?? "");
  return cleanText(row[key] ?? "") || "—";
}

function fieldMatchesAcrossCluster(records: AdminPanelistPublicRow[], key: string): boolean {
  const values = records.map((row) => fieldValue(row, key).toLowerCase()).filter((value) => value !== "—");
  if (values.length < 2) return false;
  return values.every((value) => value === values[0]);
}

function relationshipToneClass(tone: DuplicateReviewCluster["relationships"][number]["tone"]): string {
  if (tone === "match") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-sky-200 bg-sky-50 text-sky-900";
}

export function DuplicateReviewClusters({
  clusters,
  actions,
  requirementByEmail,
}: {
  clusters: DuplicateReviewCluster[];
  actions: RowActions;
  requirementByEmail: Record<
    string,
    { email: RequirementApprovalStatus; phone: RequirementApprovalStatus; photoId: RequirementApprovalStatus }
  >;
}) {
  return (
    <div className="space-y-5">
      {clusters.map((cluster, clusterIndex) => (
        <article
          key={cluster.id}
          className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/50 via-white to-white shadow-sm dark:border-amber-900 dark:bg-zinc-900 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900"
        >
          <header className="border-b border-amber-100 bg-amber-50/80 px-4 py-4 dark:border-amber-900 dark:bg-amber-950 sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                  Duplicate cluster {clusterIndex + 1}
                </p>
                <h3 className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {formatAdminLabel(cluster.displayName)}
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Born {formatDobDisplay(cluster.dob) || cluster.dob} · {cluster.records.length} matching records
                </p>
              </div>
              <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-950 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-50">
                Compare side by side
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Why these may be duplicates</p>
              <ul className="space-y-2">
                {cluster.relationships.map((link) => (
                  <li
                    key={link.id}
                    className={`rounded-xl border px-3 py-2 text-sm ${relationshipToneClass(link.tone)}`}
                  >
                    <span className="font-semibold">{formatAdminLabel(link.label)}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed opacity-90">{link.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </header>

          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2 xl:grid-cols-3">
            {cluster.records.map((record, recordIndex) => (
              <DuplicateRecordCard
                key={record.email}
                record={record}
                recordIndex={recordIndex}
                clusterSize={cluster.records.length}
                cluster={cluster}
                actions={actions}
                requirements={requirementByEmail[cleanText(record.email).toLowerCase()]}
              />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function DuplicateRecordCard({
  record,
  recordIndex,
  clusterSize,
  cluster,
  actions,
  requirements,
}: {
  record: AdminPanelistPublicRow;
  recordIndex: number;
  clusterSize: number;
  cluster: DuplicateReviewCluster;
  actions: RowActions;
  requirements?: { email: RequirementApprovalStatus; phone: RequirementApprovalStatus; photoId: RequirementApprovalStatus };
}) {
  const isFlagged = isFlaggedPanelist(record);
  const busy = Boolean(cleanText(record.email)) && (actions.flaggingEmail === record.email || actions.deletingEmail === record.email);

  return (
    <div
      className="flex min-w-0 cursor-pointer flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition hover:border-teal-300 dark:hover:border-teal-700"
      onClick={(event) => {
        if (busy) return;
        const target = event.target;
        if (target instanceof Element && target.closest("button, a, input, select, textarea, label")) return;
        actions.onEdit(record.email);
      }}
    >
      <div className="flex items-start justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-teal-700">
            Record {recordIndex + 1} of {clusterSize}
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{cleanText(record.email)}</p>
          {recordIndex > 0 ? (
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-300">
              Linked to record 1 via {formatAdminLabel(cluster.relationships[0]?.label ?? "name + DOB")}
            </p>
          ) : null}
        </div>
        <RecordActionButtons email={record.email} actions={actions} flagged={isFlagged} />
      </div>

      <dl className="flex-1 space-y-2 px-4 py-3 text-sm">
        {COMPARE_FIELDS.map((field) => {
          const value = fieldValue(record, field.key);
          const shared = fieldMatchesAcrossCluster(cluster.records, field.key);
          return (
            <div
              key={field.key}
              className={`rounded-lg px-2.5 py-2 ${shared ? "bg-emerald-50/80 ring-1 ring-emerald-100" : "bg-zinc-50 dark:bg-zinc-950"}`}
            >
              <dt className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-300">
                {formatAdminLabel(field.label)}
                {shared ? (
                  <span className="ml-1.5 font-bold text-emerald-700">· Match</span>
                ) : value !== "—" ? (
                  <span className="ml-1.5 font-medium text-zinc-400 dark:text-zinc-300">· Differs</span>
                ) : null}
              </dt>
              <dd className="mt-0.5 break-all font-medium text-zinc-800 dark:text-zinc-200">{value}</dd>
            </div>
          );
        })}
      </dl>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3">
        <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-300">Requirements</p>
        <div className="mt-1.5">
          {requirements ? (
            <RequirementStatusGroup
              email={requirements.email}
              phone={requirements.phone}
              photoId={requirements.photoId}
              iconsOnly
            />
          ) : (
            <span className="text-xs text-zinc-400 dark:text-zinc-300">—</span>
          )}
        </div>
        {isFlagged ? (
          <p className="mt-2 text-xs font-semibold text-amber-800">Flagged as Possible Duplicate</p>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => actions.onFlag(record.email)}
            className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-3 text-xs font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-50"
          >
            {busy ? "Flagging…" : "Flag as possible duplicate"}
          </button>
        )}
      </div>
    </div>
  );
}

function RecordActionButtons({
  email,
  actions,
  flagged,
}: {
  email: string;
  actions: RowActions;
  flagged?: boolean;
}) {
  const busy = Boolean(cleanText(email)) && (actions.flaggingEmail === email || actions.deletingEmail === email);

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <IconButton label="View record" onClick={() => actions.onEdit(email)} disabled={busy}>
        <ViewIcon />
      </IconButton>
      <IconButton
        label="Flag as possible duplicate"
        onClick={() => actions.onFlag(email)}
        disabled={busy || flagged}
        tone={flagged ? "muted" : "amber"}
      >
        <FlagIcon />
      </IconButton>
      <IconButton label="Delete record" onClick={() => actions.onDelete(email)} disabled={busy} tone="red">
        <TrashIcon />
      </IconButton>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  tone = "default",
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "amber" | "red" | "muted";
  children: ReactNode;
}) {
  const toneClass =
    tone === "amber"
      ? "text-amber-700 hover:bg-amber-50"
      : tone === "red"
        ? "text-red-700 hover:bg-red-50"
        : tone === "muted"
          ? "text-zinc-300 cursor-not-allowed"
          : "text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/40";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg p-1.5 transition disabled:opacity-40 ${toneClass}`}
    >
      {children}
    </button>
  );
}

function ViewIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 22V4" />
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FilterMultiSelect, PageIntro } from "@/components/admin/shared/AdminUi";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import {
  buildSampleFilterOptions,
  PanelistGroupFiltersEditor,
} from "@/components/admin/panelist-groups/PanelistGroupFiltersEditor";
import { panelistToSampleRow } from "@/lib/admin-sample-selection";
import {
  countPanelistGroupMembers,
  normalizePanelistGroupEmails,
} from "@/lib/panelist-group-resolve";
import type { PanelistGroup, PanelistGroupType } from "@/lib/panelist-group-types";
import type { PanelistRow } from "@/lib/panelists";
import { formatHeadingCase } from "@/lib/sentence-case";

function panelistOptionLabel(row: PanelistRow): string {
  const name = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
  const email = row.email ?? "";
  return name ? `${name} (${email})` : email;
}

export function PanelistGroupFormClient({
  panelists,
  group,
}: {
  panelists: PanelistRow[];
  group?: PanelistGroup;
}) {
  const router = useRouter();
  const sampleRows = useMemo(() => panelists.map(panelistToSampleRow), [panelists]);
  const filterOptions = useMemo(() => buildSampleFilterOptions(sampleRows), [sampleRows]);
  const panelistOptions = useMemo(
    () =>
      [...panelists]
        .sort((a, b) => panelistOptionLabel(a).localeCompare(panelistOptionLabel(b), undefined, { sensitivity: "base" }))
        .map((row) => ({
          value: (row.email ?? "").toLowerCase(),
          label: panelistOptionLabel(row),
        }))
        .filter((option) => option.value),
    [panelists]
  );

  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [type, setType] = useState<PanelistGroupType>(group?.type ?? "static");
  const [emailsText, setEmailsText] = useState((group?.emails ?? []).join("\n"));
  const [selectedEmails, setSelectedEmails] = useState<string[]>(group?.emails ?? []);
  const [filters, setFilters] = useState(group?.filters ?? filterOptions.defaultFilters);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const draftGroup = useMemo<PanelistGroup>(
    () => ({
      id: group?.id ?? "draft",
      name,
      description,
      type,
      emails: type === "static" ? normalizePanelistGroupEmails([...selectedEmails, emailsText]) : undefined,
      filters: type === "filter" ? filters : undefined,
      createdAt: group?.createdAt ?? "",
      updatedAt: group?.updatedAt ?? "",
    }),
    [group, name, description, type, selectedEmails, emailsText, filters]
  );

  const memberCount = useMemo(
    () => countPanelistGroupMembers(panelists, draftGroup),
    [panelists, draftGroup]
  );

  const saveGroup = async () => {
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        name,
        description,
        type,
        emails: type === "static" ? normalizePanelistGroupEmails([...selectedEmails, emailsText]) : undefined,
        filters: type === "filter" ? filters : undefined,
      };
      const url = group
        ? `/api/admin/panelist-groups/${encodeURIComponent(group.id)}`
        : "/api/admin/panelist-groups";
      const res = await fetch(url, {
        method: group ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Could not save group.");
        return;
      }
      router.push("/admin/groups");
      router.refresh();
    } catch {
      setError("Network error while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteGroup = async () => {
    if (!group) return;
    if (!window.confirm(`Delete group "${group.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/panelist-groups/${encodeURIComponent(group.id)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Could not delete group.");
        return;
      }
      router.push("/admin/groups");
      router.refresh();
    } catch {
      setError("Network error while deleting.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageIntro
        eyebrow="Panelists"
        title={group ? formatHeadingCase("Edit group") : formatHeadingCase("Create group")}
        description="Save a reusable panelist audience for campaigns — either a fixed email list or filter rules that update as the register changes."
      />

      {error ? (
        <BrandedAlert tone="error" showIcon>
          {error}
        </BrandedAlert>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <div>
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Group name</label>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Belize City civic panel"
            className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-800"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional notes about how this group should be used"
            className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-800"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Group type</label>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {(
              [
                { id: "static" as const, label: "Static list", body: "Choose specific panelists by email." },
                { id: "filter" as const, label: "Filter rules", body: "Save criteria that match panelists dynamically." },
              ] as const
            ).map((option) => {
              const selected = type === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setType(option.id)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    selected
                      ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600/20 dark:border-teal-500 dark:bg-teal-950/40"
                      : "border-zinc-200 hover:border-teal-200 dark:border-zinc-700 dark:hover:border-teal-800"
                  }`}
                >
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{option.label}</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{option.body}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">
          {type === "static" ? formatHeadingCase("Panelist list") : formatHeadingCase("Filter rules")}
        </h2>

        {type === "static" ? (
          <div className="space-y-4">
            <FilterMultiSelect
              label="Select panelists"
              options={panelistOptions.map((option) => option.label)}
              selected={selectedEmails.map(
                (email) => panelistOptions.find((option) => option.value === email)?.label ?? email
              )}
              onChange={(labels) => {
                const next = labels
                  .map((label) => panelistOptions.find((option) => option.label === label)?.value)
                  .filter((value): value is string => Boolean(value));
                setSelectedEmails(next);
              }}
            />
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Additional emails</label>
              <textarea
                rows={4}
                value={emailsText}
                onChange={(event) => setEmailsText(event.target.value)}
                placeholder="One email per line, or comma-separated"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-800"
              />
            </div>
          </div>
        ) : (
          <PanelistGroupFiltersEditor filters={filters} options={filterOptions} onChange={setFilters} />
        )}

        <BrandedAlert tone="info" compact showIcon>
          {memberCount} panelist{memberCount === 1 ? "" : "s"} currently match this group.
        </BrandedAlert>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={submitting || !name.trim() || memberCount === 0}
          onClick={() => void saveGroup()}
          className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {submitting ? "Saving…" : group ? "Save changes" : "Create group"}
        </button>
        <Link
          href="/admin/groups"
          className="inline-flex min-h-11 items-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </Link>
        {group ? (
          <button
            type="button"
            disabled={deleting}
            onClick={() => void deleteGroup()}
            className="inline-flex min-h-11 items-center rounded-xl border border-red-200 bg-white px-5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            {deleting ? "Deleting…" : "Delete group"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

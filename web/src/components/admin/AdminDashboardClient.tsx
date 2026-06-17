"use client";

import { useMemo, useState } from "react";
import { PANELIST_STATUS, VERIFICATION_STATUS } from "@/lib/admin-constants";
import type { AdminPanelOverview } from "@/lib/admin-panelists";
import {
  applyAdminPanelistFilters,
  getDuplicateReviewRows,
  panelistDisplayLabel,
  type AdminPanelistPublicRow,
} from "@/lib/admin-panelists";
import { BELIZE_DISTRICTS, CITY_TOWN_VILLAGE, getConstituencyOptions } from "@/lib/constants";
import type { PanelistRow } from "@/lib/panelists";
import { formatHeadingCase } from "@/lib/sentence-case";

const DUPLICATE_REVIEW_COLUMNS = [
  "first_name",
  "last_name",
  "dob",
  "age",
  "username",
  "email",
  "phone_whatsapp",
  "district",
  "city_town_village",
  "constituency",
  "verification_status",
  "status",
  "notes",
] as const;

const TABLE_COLUMNS = [
  "registration_date",
  "first_name",
  "last_name",
  "email",
  "phone_whatsapp",
  "district",
  "constituency",
  "voter_status",
  "verification_status",
  "status",
] as const;

interface EditState {
  verification_status: string;
  status: string;
  email: string;
  phone_whatsapp: string;
  district: string;
  city_town_village: string;
  constituency: string;
  notes: string;
}

export function AdminDashboardClient({
  rows,
  overview,
  filterOptions,
}: {
  rows: PanelistRow[];
  overview: AdminPanelOverview;
  filterOptions: {
    verification: string[];
    district: string[];
    constituency: string[];
    voterStatus: string[];
  };
}) {
  const [verificationFilter, setVerificationFilter] = useState<string[]>([]);
  const [districtFilter, setDistrictFilter] = useState<string[]>([]);
  const [constituencyFilter, setConstituencyFilter] = useState<string[]>([]);
  const [voterFilter, setVoterFilter] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredRows = useMemo(
    () =>
      applyAdminPanelistFilters(rows, {
        verification: verificationFilter,
        district: districtFilter,
        constituency: constituencyFilter,
        voterStatus: voterFilter,
      }),
    [rows, verificationFilter, districtFilter, constituencyFilter, voterFilter]
  );

  const duplicateRows = useMemo(() => getDuplicateReviewRows(rows), [rows]);

  const panelistOptions = useMemo(
    () =>
      rows.map((row) => ({
        email: row.email,
        label: panelistDisplayLabel(row),
      })),
    [rows]
  );

  const cityOptions =
    editState?.district && editState.district in CITY_TOWN_VILLAGE
      ? ["", ...CITY_TOWN_VILLAGE[editState.district]]
      : [""];

  const selectPanelist = (email: string) => {
    setSelectedEmail(email);
    setMessage("");
    setError("");
    const row = rows.find((item) => item.email === email);
    if (!row) {
      setEditState(null);
      return;
    }
    setEditState({
      verification_status: row.verification_status ?? "Pending",
      status: row.status ?? "Active",
      email: row.email ?? "",
      phone_whatsapp: row.phone_whatsapp ?? "",
      district: row.district ?? "",
      city_town_village: row.city_town_village ?? "",
      constituency: row.constituency ?? "",
      notes: row.notes ?? "",
    });
  };

  const exportCsv = () => {
    const params = new URLSearchParams();
    verificationFilter.forEach((value) => params.append("verification", value));
    districtFilter.forEach((value) => params.append("district", value));
    constituencyFilter.forEach((value) => params.append("constituency", value));
    voterFilter.forEach((value) => params.append("voterStatus", value));
    window.location.assign(`/api/admin/panelists/export?${params.toString()}`);
  };

  const saveRecord = async () => {
    if (!selectedEmail || !editState) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/admin/panelists/${encodeURIComponent(selectedEmail)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editState),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok) {
        setError(data.message ?? "Could not save changes.");
        return;
      }
      setMessage("Record updated successfully.");
      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <div className="border-l-4 border-teal-600 pl-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Panel management</p>
        <h1 className="mt-1 text-2xl font-bold text-teal-950 sm:text-3xl">{formatHeadingCase("Admin dashboard")}</h1>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-teal-950">{formatHeadingCase("Panel overview")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total panelists", overview.total],
            ["Verified", overview.verified],
            ["Pending", overview.pending],
            ["Duplicate warnings", overview.duplicateWarnings],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-zinc-600">{label}</p>
              <p className="mt-2 text-3xl font-bold text-teal-950">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-teal-950">{formatHeadingCase("Filter panelists")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FilterMultiSelect
            label="Verification status"
            options={filterOptions.verification}
            selected={verificationFilter}
            onChange={setVerificationFilter}
          />
          <FilterMultiSelect
            label="District"
            options={filterOptions.district}
            selected={districtFilter}
            onChange={setDistrictFilter}
          />
          <FilterMultiSelect
            label="Constituency"
            options={filterOptions.constituency}
            selected={constituencyFilter}
            onChange={setConstituencyFilter}
          />
          <FilterMultiSelect
            label="Voter status"
            options={filterOptions.voterStatus}
            selected={voterFilter}
            onChange={setVoterFilter}
          />
        </div>
        <p className="mt-4 text-sm text-zinc-600">
          Showing <strong>{filteredRows.length}</strong> of <strong>{rows.length}</strong> panelists.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-teal-950">{formatHeadingCase("Duplicate review table")}</h2>
        {duplicateRows.length > 0 ? (
          <>
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {duplicateRows.length} records need duplicate review.
            </p>
            <div className="mt-4 overflow-x-auto">
              <DataTable rows={duplicateRows} columns={DUPLICATE_REVIEW_COLUMNS} />
            </div>
          </>
        ) : (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            No duplicate name + DOB records currently detected.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-teal-950">{formatHeadingCase("Panelist records")}</h2>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex min-h-10 items-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Download filtered CSV
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <DataTable rows={filteredRows} columns={TABLE_COLUMNS} highlightDuplicates />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-teal-950">{formatHeadingCase("Edit panelist record")}</h2>
        <div className="mt-4">
          <label htmlFor="panelist-select" className="block text-sm font-medium text-zinc-800">
            Select panelist
          </label>
          <select
            id="panelist-select"
            value={selectedEmail}
            onChange={(e) => selectPanelist(e.target.value)}
            className="mt-2 w-full max-w-3xl rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">Select a record to edit</option>
            {panelistOptions.map((option) => (
              <option key={option.email} value={option.email}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {editState ? (
          <div className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldSelect
                label="Verification status"
                value={editState.verification_status}
                options={VERIFICATION_STATUS}
                onChange={(value) => setEditState({ ...editState, verification_status: value })}
              />
              <FieldSelect
                label="Panelist status"
                value={editState.status}
                options={PANELIST_STATUS}
                onChange={(value) => setEditState({ ...editState, status: value })}
              />
              <FieldInput
                label="Email"
                value={editState.email}
                onChange={(value) => setEditState({ ...editState, email: value })}
              />
              <FieldInput
                label="Phone / WhatsApp"
                value={editState.phone_whatsapp}
                onChange={(value) => setEditState({ ...editState, phone_whatsapp: value })}
              />
              <FieldSelect
                label="District"
                value={editState.district}
                options={["", ...BELIZE_DISTRICTS]}
                onChange={(value) =>
                  setEditState({ ...editState, district: value, city_town_village: "" })
                }
              />
              <FieldSelect
                label="City / town / village"
                value={editState.city_town_village}
                options={cityOptions}
                onChange={(value) => setEditState({ ...editState, city_town_village: value })}
              />
              <FieldSelect
                label="Constituency"
                value={editState.constituency}
                options={["", ...getConstituencyOptions()]}
                onChange={(value) => setEditState({ ...editState, constituency: value })}
              />
            </div>
            <div>
              <label htmlFor="admin-notes" className="block text-sm font-medium text-zinc-800">
                Admin notes
              </label>
              <textarea
                id="admin-notes"
                rows={4}
                value={editState.notes}
                onChange={(e) => setEditState({ ...editState, notes: e.target.value })}
                className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
              />
            </div>
            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="text-sm text-emerald-700" role="status">
                {message}
              </p>
            ) : null}
            <button
              type="button"
              disabled={saving}
              onClick={saveRecord}
              className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save record changes"}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function FilterMultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-zinc-800">{formatHeadingCase(label)}</p>
      <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50/50 p-2">
        {options.length === 0 ? (
          <p className="px-2 py-1 text-xs text-zinc-500">No values</p>
        ) : (
          options.map((option) => {
            const checked = selected.includes(option);
            return (
              <label key={option} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange(checked ? selected.filter((value) => value !== option) : [...selected, option])
                  }
                  className="rounded border-zinc-300 text-teal-700"
                />
                <span className="truncate">{option}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

function DataTable({
  rows,
  columns,
  highlightDuplicates = false,
}: {
  rows: Array<PanelistRow | AdminPanelistPublicRow>;
  columns: readonly string[];
  highlightDuplicates?: boolean;
}) {
  return (
    <table className="min-w-full text-left text-xs sm:text-sm">
      <thead>
        <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
          {columns.map((column) => (
            <th key={column} className="whitespace-nowrap px-3 py-2 font-semibold">
              {column.replace(/_/g, " ")}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => {
          const flagged = highlightDuplicates && "duplicate_name_dob_flag" in row && row.duplicate_name_dob_flag;
          return (
            <tr
              key={`${row.email}-${index}`}
              className={`border-b border-zinc-100 ${flagged ? "bg-amber-50/80" : ""}`}
            >
              {columns.map((column) => (
                <td key={column} className="max-w-[14rem] truncate whitespace-nowrap px-3 py-2 text-zinc-700">
                  {row[column] ?? ""}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function FieldInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-800">{formatHeadingCase(label)}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
      />
    </div>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-800">{formatHeadingCase(label)}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm"
      >
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {option || "—"}
          </option>
        ))}
      </select>
    </div>
  );
}

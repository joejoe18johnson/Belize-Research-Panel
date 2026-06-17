"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PANELIST_STATUS, VERIFICATION_STATUS } from "@/lib/admin-constants";
import {
  applyAdminPanelistFilters,
  getDuplicateReviewRows,
  panelistDisplayLabel,
  type AdminPanelistPublicRow,
} from "@/lib/admin-panelists";
import { BELIZE_DISTRICTS, CITY_TOWN_VILLAGE, getConstituencyOptions } from "@/lib/constants";
import type { PanelistRow } from "@/lib/panelists";
import { formatHeadingCase } from "@/lib/sentence-case";
import { cleanText } from "@/lib/validation";
import { FilterMultiSelect } from "@/components/admin/shared/AdminUi";
import { TablePagination, useTablePagination } from "@/components/admin/shared/TablePagination";
import { BrandedAlert, BrandedConfirmDialog, BrandedModal } from "@/components/shared/BrandedFeedback";

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

type RowActions = {
  onEdit: (email: string) => void;
  onFlag: (email: string) => void;
  onDelete: (email: string) => void;
  flaggingEmail?: string;
  deletingEmail?: string;
};

export function AdminPanelistsClient({
  rows,
  filterOptions,
}: {
  rows: PanelistRow[];
  filterOptions: {
    verification: string[];
    district: string[];
    constituency: string[];
    voterStatus: string[];
  };
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "duplicates">("all");
  const [verificationFilter, setVerificationFilter] = useState<string[]>([]);
  const [districtFilter, setDistrictFilter] = useState<string[]>([]);
  const [constituencyFilter, setConstituencyFilter] = useState<string[]>([]);
  const [voterFilter, setVoterFilter] = useState<string[]>([]);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [markingDuplicates, setMarkingDuplicates] = useState(false);
  const [duplicateActionMessage, setDuplicateActionMessage] = useState("");
  const [flaggingEmail, setFlaggingEmail] = useState("");
  const [deletingEmail, setDeletingEmail] = useState("");
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState<string | null>(null);
  const [rowActionMessage, setRowActionMessage] = useState("");

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

  const allPagination = useTablePagination(filteredRows, 30);
  const duplicatePagination = useTablePagination(duplicateRows, 30);

  const cityOptions =
    editState?.district && editState.district in CITY_TOWN_VILLAGE
      ? ["", ...CITY_TOWN_VILLAGE[editState.district]]
      : [""];

  const openEdit = (email: string) => {
    setMessage("");
    setError("");
    setEditingEmail(email);
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

  const closeEdit = () => {
    setEditingEmail(null);
    setEditState(null);
    setError("");
    setMessage("");
  };

  const exportCsv = () => {
    const params = new URLSearchParams();
    verificationFilter.forEach((value) => params.append("verification", value));
    districtFilter.forEach((value) => params.append("district", value));
    constituencyFilter.forEach((value) => params.append("constituency", value));
    voterFilter.forEach((value) => params.append("voterStatus", value));
    window.location.assign(`/api/admin/panelists/export?${params.toString()}`);
  };

  const markDuplicates = async () => {
    setMarkingDuplicates(true);
    setDuplicateActionMessage("");
    try {
      const res = await fetch("/api/admin/panelists/mark-duplicates", { method: "POST" });
      const data = (await res.json()) as { message?: string };
      setDuplicateActionMessage(data.message ?? (res.ok ? "Done." : "Action failed."));
      if (res.ok) router.refresh();
    } catch {
      setDuplicateActionMessage("Network error.");
    } finally {
      setMarkingDuplicates(false);
    }
  };

  const flagRecord = async (email: string) => {
    setFlaggingEmail(email);
    setRowActionMessage("");
    try {
      const res = await fetch(`/api/admin/panelists/${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_status: "Possible Duplicate" }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setRowActionMessage(data.message ?? "Could not flag record.");
        return;
      }
      setRowActionMessage(
        `Flagged ${panelistDisplayLabel(rows.find((row) => row.email === email) ?? ({ email } as PanelistRow))} as Possible Duplicate. Their login account is now on hold until the review is cleared.`
      );
      router.refresh();
    } catch {
      setRowActionMessage("Network error while flagging record.");
    } finally {
      setFlaggingEmail("");
    }
  };

  const deleteRecord = (email: string) => {
    setDeleteConfirmEmail(email);
  };

  const confirmDeleteRecord = async () => {
    const email = deleteConfirmEmail;
    if (!email) return;

    const row = rows.find((item) => item.email === email);
    const label = row ? panelistDisplayLabel(row) : email;

    setDeletingEmail(email);
    setRowActionMessage("");
    setDeleteConfirmEmail(null);
    try {
      const res = await fetch(`/api/admin/panelists/${encodeURIComponent(email)}`, { method: "DELETE" });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setRowActionMessage(data.message ?? "Could not delete record.");
        return;
      }
      if (editingEmail === email) closeEdit();
      setRowActionMessage(`Deleted ${label}.`);
      router.refresh();
    } catch {
      setRowActionMessage("Network error while deleting record.");
    } finally {
      setDeletingEmail("");
    }
  };

  const saveRecord = async () => {
    if (!editingEmail || !editState) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/admin/panelists/${encodeURIComponent(editingEmail)}`, {
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
      closeEdit();
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const rowActions: RowActions = {
    onEdit: openEdit,
    onFlag: flagRecord,
    onDelete: deleteRecord,
    flaggingEmail,
    deletingEmail,
  };

  const TABS = [
    { id: "all" as const, label: "All panelists", count: filteredRows.length },
    { id: "duplicates" as const, label: "Duplicate review", count: duplicateRows.length },
  ];

  const rowActionTone =
    rowActionMessage.toLowerCase().includes("could not") ||
    rowActionMessage.toLowerCase().includes("network error")
      ? "error"
      : "success";

  const deleteConfirmLabel = deleteConfirmEmail
    ? panelistDisplayLabel(
        rows.find((row) => row.email === deleteConfirmEmail) ?? ({ email: deleteConfirmEmail } as PanelistRow)
      )
    : "";

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="border-l-4 border-teal-600 pl-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Panel register</p>
        <h1 className="mt-1 text-2xl font-bold text-teal-950 sm:text-3xl">{formatHeadingCase("Panelists")}</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600">
          Browse, filter, edit, flag, and delete panelist records. Use row actions on each record.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-teal-950">{formatHeadingCase("Filters")}</h2>
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
          <strong>{filteredRows.length}</strong> panelists match filters · <strong>{rows.length}</strong> total in register
        </p>
      </section>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
              tab === item.id
                ? "border border-b-0 border-teal-200 bg-white text-teal-900"
                : "text-zinc-600 hover:bg-teal-50/50 hover:text-teal-800"
            }`}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      {tab === "duplicates" ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-teal-950">{formatHeadingCase("Duplicate review")}</h2>
            {duplicateRows.length > 0 ? (
              <button
                type="button"
                disabled={markingDuplicates}
                onClick={markDuplicates}
                className="inline-flex min-h-10 items-center rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-50"
              >
                {markingDuplicates ? "Updating…" : "Mark all as Possible Duplicate"}
              </button>
            ) : null}
          </div>
          {duplicateActionMessage ? (
            <div className="mt-3">
              <BrandedAlert tone="success" compact showIcon>
                {duplicateActionMessage}
              </BrandedAlert>
            </div>
          ) : null}
          {duplicateRows.length > 0 ? (
            <>
              <div className="mt-2">
                <BrandedAlert tone="warning" compact showIcon>
                  {duplicateRows.length} records share the same name and date of birth.
                </BrandedAlert>
              </div>
              {rowActionMessage ? (
                <div className="mt-3">
                  <BrandedAlert tone={rowActionTone} compact showIcon>
                    {rowActionMessage}
                  </BrandedAlert>
                </div>
              ) : null}
              <div className="mt-4 overflow-x-auto">
                <DataTable
                  rows={duplicatePagination.paginatedRows}
                  columns={DUPLICATE_REVIEW_COLUMNS}
                  highlightDuplicates
                  actions={rowActions}
                />
              </div>
              <TablePagination
                page={duplicatePagination.page}
                pageSize={duplicatePagination.pageSize}
                totalPages={duplicatePagination.totalPages}
                totalRows={duplicatePagination.totalRows}
                onPageChange={duplicatePagination.setPage}
                onPageSizeChange={duplicatePagination.setPageSize}
              />
            </>
          ) : (
            <div className="mt-3">
              <BrandedAlert tone="success" compact showIcon>
                No duplicate name + DOB records currently detected.
              </BrandedAlert>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-teal-950">{formatHeadingCase("All panelists")}</h2>
              <p className="mt-1 text-sm text-zinc-500">Edit, flag, or delete from the actions column.</p>
            </div>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex min-h-10 items-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Download filtered CSV
            </button>
          </div>
          {rowActionMessage ? (
            <div className="mt-3">
              <BrandedAlert tone={rowActionTone} compact showIcon>
                {rowActionMessage}
              </BrandedAlert>
            </div>
          ) : null}
          <div className="mt-4 overflow-x-auto">
            <DataTable
              rows={allPagination.paginatedRows}
              columns={TABLE_COLUMNS}
              highlightDuplicates
              actions={rowActions}
            />
          </div>
          <TablePagination
            page={allPagination.page}
            pageSize={allPagination.pageSize}
            totalPages={allPagination.totalPages}
            totalRows={allPagination.totalRows}
            onPageChange={allPagination.setPage}
            onPageSizeChange={allPagination.setPageSize}
          />
        </section>
      )}

      {editingEmail && editState ? (
        <PanelistEditModal
          label={panelistDisplayLabel(
            rows.find((row) => row.email === editingEmail) ?? ({ email: editingEmail } as PanelistRow)
          )}
          editState={editState}
          cityOptions={cityOptions}
          saving={saving}
          error={error}
          message={message}
          onChange={setEditState}
          onClose={closeEdit}
          onSave={saveRecord}
          onDelete={() => deleteRecord(editingEmail)}
          deleting={deletingEmail === editingEmail}
        />
      ) : null}

      <BrandedConfirmDialog
        open={Boolean(deleteConfirmEmail)}
        title="Delete panelist record"
        description={`Delete panelist record for ${deleteConfirmLabel}? This removes the register entry and related survey data.`}
        confirmLabel="Delete record"
        cancelLabel="Keep record"
        tone="error"
        loading={Boolean(deletingEmail)}
        onConfirm={confirmDeleteRecord}
        onCancel={() => setDeleteConfirmEmail(null)}
      />
    </div>
  );
}

function PanelistEditModal({
  label,
  editState,
  cityOptions,
  saving,
  error,
  message,
  onChange,
  onClose,
  onSave,
  onDelete,
  deleting,
}: {
  label: string;
  editState: EditState;
  cityOptions: string[];
  saving: boolean;
  error: string;
  message: string;
  onChange: (state: EditState) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Edit panelist</p>
            <h2 className="mt-0.5 text-lg font-semibold text-teal-950">{label}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldSelect
              label="Verification status"
              value={editState.verification_status}
              options={VERIFICATION_STATUS}
              onChange={(value) => onChange({ ...editState, verification_status: value })}
            />
            <FieldSelect
              label="Panelist status"
              value={editState.status}
              options={PANELIST_STATUS}
              onChange={(value) => onChange({ ...editState, status: value })}
            />
            <FieldInput label="Email" value={editState.email} onChange={(value) => onChange({ ...editState, email: value })} />
            <FieldInput
              label="Phone / WhatsApp"
              value={editState.phone_whatsapp}
              onChange={(value) => onChange({ ...editState, phone_whatsapp: value })}
            />
            <FieldSelect
              label="District"
              value={editState.district}
              options={["", ...BELIZE_DISTRICTS]}
              onChange={(value) => onChange({ ...editState, district: value, city_town_village: "" })}
            />
            <FieldSelect
              label="City / town / village"
              value={editState.city_town_village}
              options={cityOptions}
              onChange={(value) => onChange({ ...editState, city_town_village: value })}
            />
            <FieldSelect
              label="Constituency"
              value={editState.constituency}
              options={["", ...getConstituencyOptions()]}
              onChange={(value) => onChange({ ...editState, constituency: value })}
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
              onChange={(e) => onChange({ ...editState, notes: e.target.value })}
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
          <div className="flex flex-wrap gap-3 border-t border-zinc-100 pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={onSave}
              className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={onDelete}
              className="inline-flex min-h-11 items-center rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete record"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center rounded-xl border border-zinc-200 px-5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RowActionButtons({
  email,
  actions,
  flagged,
}: {
  email: string;
  actions: RowActions;
  flagged?: boolean;
}) {
  const busy = actions.flaggingEmail === email || actions.deletingEmail === email;

  return (
    <div className="flex items-center gap-0.5">
      <IconButton label="Edit record" onClick={() => actions.onEdit(email)} disabled={busy}>
        <EditIcon />
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
          : "text-teal-700 hover:bg-teal-50";

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

function DataTable({
  rows,
  columns,
  highlightDuplicates = false,
  actions,
}: {
  rows: Array<PanelistRow | AdminPanelistPublicRow>;
  columns: readonly string[];
  highlightDuplicates?: boolean;
  actions?: RowActions;
}) {
  return (
    <table className="min-w-full text-left text-xs sm:text-sm">
      <thead>
        <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
          {actions ? (
            <th className="sticky left-0 z-10 whitespace-nowrap bg-zinc-50 px-2 py-2 font-semibold">Actions</th>
          ) : null}
          {columns.map((column) => (
            <th key={column} className="whitespace-nowrap px-3 py-2 font-semibold">
              {column.replace(/_/g, " ")}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-zinc-500">
              No records on this page.
            </td>
          </tr>
        ) : (
          rows.map((row, index) => {
            const flagged = highlightDuplicates && "duplicate_name_dob_flag" in row && row.duplicate_name_dob_flag;
            const alreadyFlagged = cleanText(row.verification_status) === "Possible Duplicate";
            return (
              <tr
                key={`${row.email}-${index}`}
                className={`border-b border-zinc-100 ${flagged || alreadyFlagged ? "bg-amber-50/80" : ""}`}
              >
                {actions ? (
                  <td className="sticky left-0 z-10 bg-inherit px-2 py-2">
                    <RowActionButtons email={row.email} actions={actions} flagged={alreadyFlagged} />
                  </td>
                ) : null}
                {columns.map((column) => (
                  <td key={column} className="max-w-[14rem] truncate whitespace-nowrap px-3 py-2 text-zinc-700">
                    {row[column] ?? ""}
                  </td>
                ))}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
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

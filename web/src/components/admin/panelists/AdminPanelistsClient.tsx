"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PANELIST_STATUS, VERIFICATION_STATUS } from "@/lib/admin-constants";
import {
  applyAdminPanelistFilters,
  countPanelistsByField,
  getDuplicateReviewRows,
  getFlaggedPanelists,
  groupDuplicateReviewClusters,
  isFlaggedPanelist,
  panelistDisplayLabel,
  type AdminPanelistPublicRow,
} from "@/lib/admin-panelists";
import { BELIZE_DISTRICTS, CITY_TOWN_VILLAGE, getConstituencyOptions } from "@/lib/constants";
import type { PanelistRow } from "@/lib/panelists";
import { SiteSelect, mapStringOptions } from "@/components/shared/SiteSelect";
import { formatHeadingCase } from "@/lib/sentence-case";
import { cleanText } from "@/lib/validation";
import { buildPanelistDeleteCode } from "@/lib/admin-delete-confirmation";
import { FilterMultiSelect } from "@/components/admin/shared/AdminUi";
import { AdminDeleteConfirmDialog } from "@/components/admin/shared/AdminDeleteConfirmDialog";
import { RequirementStatusGroup } from "@/components/admin/shared/RequirementStatusBadges";
import { TablePagination, useTablePagination } from "@/components/admin/shared/TablePagination";
import { BrandedAlert, BrandedModal } from "@/components/shared/BrandedFeedback";
import { DuplicateReviewClusters } from "./DuplicateReviewClusters";
import { RequirementReviewControls } from "@/components/admin/shared/RequirementReviewControls";
import type { AdminRequirementDecision, RequirementApprovalStatus } from "@/lib/panelist-requirements";
import {
  ADMIN_REQUIREMENT_FIELDS,
  requirementOnFile,
  verificationStatusFromRequirementApprovals,
} from "@/lib/panelist-requirements";

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
  admin_email_approved: AdminRequirementDecision;
  admin_phone_approved: AdminRequirementDecision;
  admin_photo_id_approved: AdminRequirementDecision;
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
  requirementByEmail,
  filterOptions,
  initialVerification,
  initialEmail,
  initialTab,
  photoUploadUsernames,
  residenceUploadUsernames,
}: {
  rows: PanelistRow[];
  requirementByEmail: Record<
    string,
    { email: RequirementApprovalStatus; phone: RequirementApprovalStatus; photoId: RequirementApprovalStatus }
  >;
  filterOptions: {
    verification: string[];
    district: string[];
    constituency: string[];
    voterStatus: string[];
  };
  initialVerification?: string;
  initialEmail?: string;
  initialTab?: "all" | "duplicates" | "flagged";
  photoUploadUsernames: Set<string>;
  residenceUploadUsernames: Set<string>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "duplicates" | "flagged">(initialTab ?? "all");
  const [verificationFilter, setVerificationFilter] = useState<string[]>([]);
  const [districtFilter, setDistrictFilter] = useState<string[]>([]);
  const [constituencyFilter, setConstituencyFilter] = useState<string[]>([]);
  const [voterFilter, setVoterFilter] = useState<string[]>([]);
  const [editingRow, setEditingRow] = useState<PanelistRow | null>(null);
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
  const duplicateClusters = useMemo(() => groupDuplicateReviewClusters(rows), [rows]);
  const flaggedRows = useMemo(
    () =>
      applyAdminPanelistFilters(getFlaggedPanelists(rows), {
        verification: verificationFilter,
        district: districtFilter,
        constituency: constituencyFilter,
        voterStatus: voterFilter,
      }),
    [rows, verificationFilter, districtFilter, constituencyFilter, voterFilter]
  );

  const verificationCounts = useMemo(
    () => countPanelistsByField(rows, "verification_status", filterOptions.verification),
    [rows, filterOptions.verification]
  );
  const districtCounts = useMemo(
    () => countPanelistsByField(rows, "district", filterOptions.district),
    [rows, filterOptions.district]
  );
  const constituencyCounts = useMemo(
    () => countPanelistsByField(rows, "constituency", filterOptions.constituency),
    [rows, filterOptions.constituency]
  );
  const voterCounts = useMemo(
    () => countPanelistsByField(rows, "voter_status", filterOptions.voterStatus),
    [rows, filterOptions.voterStatus]
  );

  const allPagination = useTablePagination(filteredRows);
  const duplicatePagination = useTablePagination(duplicateClusters);
  const flaggedPagination = useTablePagination(flaggedRows);

  const cityOptions =
    editState?.district && editState.district in CITY_TOWN_VILLAGE
      ? ["", ...CITY_TOWN_VILLAGE[editState.district]]
      : [""];

  const editingEmail = editingRow?.email ?? null;

  const openEdit = (email: string) => {
    setMessage("");
    setError("");
    const row = rows.find((item) => item.email === email);
    if (!row) {
      setEditingRow(null);
      setEditState(null);
      return;
    }

    const emailKey = cleanText(row.email).toLowerCase();
    const derived = requirementByEmail[emailKey];
    const readDecision = (field: string, derivedApproved: boolean): AdminRequirementDecision => {
      const stored = cleanText(row[field]).toLowerCase();
      if (stored === "true" || stored === "false") return stored;
      return derivedApproved ? "true" : "";
    };

    setEditingRow(row);
    setEditState({
      verification_status: row.verification_status ?? "Pending",
      status: row.status ?? "Active",
      email: row.email ?? "",
      phone_whatsapp: row.phone_whatsapp ?? "",
      district: row.district ?? "",
      city_town_village: row.city_town_village ?? "",
      constituency: row.constituency ?? "",
      notes: row.notes ?? "",
      admin_email_approved: readDecision(ADMIN_REQUIREMENT_FIELDS.email, derived?.email === "approved"),
      admin_phone_approved: readDecision(ADMIN_REQUIREMENT_FIELDS.phone, derived?.phone === "approved"),
      admin_photo_id_approved: readDecision(ADMIN_REQUIREMENT_FIELDS.photoId, derived?.photoId === "approved"),
    });
  };

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialVerification) {
      setVerificationFilter([initialVerification]);
    }
  }, [initialVerification]);

  useEffect(() => {
    if (!initialEmail) return;
    const match = rows.find((row) => cleanText(row.email).toLowerCase() === initialEmail.toLowerCase());
    if (match) openEdit(match.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deep-link opens the matching record once
  }, [initialEmail]);

  const closeEdit = () => {
    setEditingRow(null);
    setEditState(null);
    setError("");
    setMessage("");
  };

  const requirementReviewContext = useMemo(() => {
    if (!editingRow) return { hasPhotoUpload: false, hasResidenceUpload: false };
    const username = cleanText(editingRow.username);
    return {
      hasPhotoUpload: username ? photoUploadUsernames.has(username) : false,
      hasResidenceUpload: username ? residenceUploadUsernames.has(username) : false,
    };
  }, [editingRow, photoUploadUsernames, residenceUploadUsernames]);

  const applyRequirementDecision = (key: "email" | "phone" | "photoId", decision: "true" | "false") => {
    if (!editState || !editingRow) return;

    const field =
      key === "email"
        ? "admin_email_approved"
        : key === "phone"
          ? "admin_phone_approved"
          : "admin_photo_id_approved";

    const next: EditState = {
      ...editState,
      [field]: decision,
    };

    const mergedRow: PanelistRow = {
      ...editingRow,
      email: next.email,
      phone_whatsapp: next.phone_whatsapp,
      [ADMIN_REQUIREMENT_FIELDS.email]: next.admin_email_approved,
      [ADMIN_REQUIREMENT_FIELDS.phone]: next.admin_phone_approved,
      [ADMIN_REQUIREMENT_FIELDS.photoId]: next.admin_photo_id_approved,
    };

    next.verification_status = verificationStatusFromRequirementApprovals(
      mergedRow,
      requirementReviewContext,
      editState.verification_status
    );

    setEditState(next);
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

  const confirmDeleteRecord = async (confirmCode: string) => {
    const email = deleteConfirmEmail;
    if (!email) return;

    const row = rows.find((item) => item.email === email);
    const label = row ? panelistDisplayLabel(row) : email;

    setDeletingEmail(email);
    setRowActionMessage("");
    try {
      const res = await fetch(`/api/admin/panelists/${encodeURIComponent(email)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmCode }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setRowActionMessage(data.message ?? "Could not delete record.");
        return;
      }
      setDeleteConfirmEmail(null);
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
    { id: "flagged" as const, label: "Flagged", count: getFlaggedPanelists(rows).length },
    { id: "duplicates" as const, label: "Duplicate review", count: duplicateClusters.length },
  ];

  const rowActionTone =
    rowActionMessage.toLowerCase().includes("could not") ||
    rowActionMessage.toLowerCase().includes("network error")
      ? "error"
      : "success";

  const deleteConfirmRow = deleteConfirmEmail
    ? rows.find((row) => row.email === deleteConfirmEmail) ?? ({ email: deleteConfirmEmail } as PanelistRow)
    : null;
  const deleteConfirmLabel = deleteConfirmRow ? panelistDisplayLabel(deleteConfirmRow) : "";
  const deleteConfirmCode = deleteConfirmRow ? buildPanelistDeleteCode(deleteConfirmRow) : "";

  return (
    <div className="mx-auto min-w-0 max-w-[1400px] space-y-6">
      <div className="border-l-4 border-teal-600 pl-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-teal-700">Panel register</p>
        <h1 className="mt-1 text-2xl font-bold text-teal-950 dark:text-teal-100 sm:text-3xl">{formatHeadingCase("Panelists")}</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
          Browse, filter, edit, flag, and delete panelist records. Use row actions on each record.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Filters")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FilterMultiSelect
            label="Verification status"
            options={filterOptions.verification}
            selected={verificationFilter}
            onChange={setVerificationFilter}
            counts={verificationCounts}
          />
          <FilterMultiSelect
            label="District"
            options={filterOptions.district}
            selected={districtFilter}
            onChange={setDistrictFilter}
            counts={districtCounts}
          />
          <FilterMultiSelect
            label="Constituency"
            options={filterOptions.constituency}
            selected={constituencyFilter}
            onChange={setConstituencyFilter}
            counts={constituencyCounts}
          />
          <FilterMultiSelect
            label="Voter status"
            options={filterOptions.voterStatus}
            selected={voterFilter}
            onChange={setVoterFilter}
            counts={voterCounts}
          />
        </div>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
          <strong>{filteredRows.length}</strong> panelists match filters · <strong>{rows.length}</strong> total in register
        </p>
      </section>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
              tab === item.id
                ? "border border-b-0 border-teal-200 bg-white dark:bg-zinc-900 text-teal-900 dark:text-teal-100"
                : "text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 hover:bg-teal-50/50 hover:text-teal-800 dark:text-teal-200"
            }`}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      {tab === "duplicates" ? (
        <section className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Duplicate Review")}</h2>
              <p className="mt-1 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
                Records that share the same name and exact date of birth are grouped here for comparison. Flag a record
                to set its verification status to Possible Duplicate.
              </p>
            </div>
            {duplicateClusters.length > 0 ? (
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
          {duplicateClusters.length > 0 ? (
            <>
              <div className="mt-2">
                <BrandedAlert tone="warning" compact showIcon>
                  {duplicateClusters.length} duplicate {duplicateClusters.length === 1 ? "cluster" : "clusters"} ·{" "}
                  {duplicateRows.length} records grouped for side-by-side comparison.
                </BrandedAlert>
              </div>
              {rowActionMessage ? (
                <div className="mt-3">
                  <BrandedAlert tone={rowActionTone} compact showIcon>
                    {rowActionMessage}
                  </BrandedAlert>
                </div>
              ) : null}
              <div className="mt-4">
                <DuplicateReviewClusters
                  clusters={duplicatePagination.paginatedRows}
                  actions={rowActions}
                  requirementByEmail={requirementByEmail}
                />
              </div>
              {duplicatePagination.totalRows > 0 ? (
                <TablePagination
                  page={duplicatePagination.page}
                  pageSize={duplicatePagination.pageSize}
                  totalPages={duplicatePagination.totalPages}
                  totalRows={duplicatePagination.totalRows}
                  onPageChange={duplicatePagination.setPage}
                  onPageSizeChange={duplicatePagination.setPageSize}
                />
              ) : null}
            </>
          ) : (
            <div className="mt-3">
              <BrandedAlert tone="success" compact showIcon>
                No records share the same name and exact date of birth.
              </BrandedAlert>
            </div>
          )}
        </section>
      ) : tab === "flagged" ? (
        <section className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Flagged panelists")}</h2>
              <p className="mt-1 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
                Panelists with verification status Possible Duplicate. Their accounts are placed on hold until an
                administrator clears the review.
              </p>
            </div>
          </div>
          {rowActionMessage ? (
            <div className="mt-3">
              <BrandedAlert tone={rowActionTone} compact showIcon>
                {rowActionMessage}
              </BrandedAlert>
            </div>
          ) : null}
          {flaggedRows.length > 0 ? (
            <>
              <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
                <DataTable
                  rows={flaggedPagination.paginatedRows}
                  columns={TABLE_COLUMNS}
                  actions={rowActions}
                  requirementByEmail={requirementByEmail}
                />
              </div>
              <TablePagination
                page={flaggedPagination.page}
                pageSize={flaggedPagination.pageSize}
                totalPages={flaggedPagination.totalPages}
                totalRows={flaggedPagination.totalRows}
                onPageChange={flaggedPagination.setPage}
                onPageSizeChange={flaggedPagination.setPageSize}
              />
            </>
          ) : (
            <div className="mt-3">
              <BrandedAlert tone="success" compact showIcon>
                No panelists are currently flagged as Possible Duplicate.
              </BrandedAlert>
            </div>
          )}
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("All panelists")}</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">Edit, flag, or delete from the actions column.</p>
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
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
            <DataTable
              rows={allPagination.paginatedRows}
              columns={TABLE_COLUMNS}
              actions={rowActions}
              requirementByEmail={requirementByEmail}
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

      {editingEmail && editState && editingRow ? (
        <PanelistEditModal
          label={panelistDisplayLabel(editingRow)}
          editState={editState}
          cityOptions={cityOptions}
          saving={saving}
          error={error}
          message={message}
          photoIdType={cleanText(editingRow.photo_id_type)}
          panelistEmail={editingRow.email}
          requirementContext={requirementReviewContext}
          onRequirementDecision={applyRequirementDecision}
          onChange={setEditState}
          onClose={closeEdit}
          onSave={saveRecord}
          onDelete={() => deleteRecord(editingEmail)}
          deleting={deletingEmail === editingEmail}
        />
      ) : null}

      <AdminDeleteConfirmDialog
        open={Boolean(deleteConfirmEmail && deleteConfirmCode)}
        title="Delete panelist record"
        description={`Delete panelist record for ${deleteConfirmLabel}? This removes the register entry and related survey data.`}
        confirmCode={deleteConfirmCode}
        confirmLabel="Delete record"
        cancelLabel="Keep record"
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
  photoIdType,
  panelistEmail,
  requirementContext,
  onRequirementDecision,
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
  photoIdType: string;
  panelistEmail: string;
  requirementContext: { hasPhotoUpload?: boolean; hasResidenceUpload?: boolean };
  onRequirementDecision: (key: "email" | "phone" | "photoId", decision: "true" | "false") => void;
  onChange: (state: EditState) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const reviewPanelist = {
    email: editState.email,
    phone_whatsapp: editState.phone_whatsapp,
    photo_id_type: photoIdType,
    notes: editState.notes,
  };

  const onFile = {
    email: requirementOnFile("email", reviewPanelist, requirementContext),
    phone: requirementOnFile("phone", reviewPanelist, requirementContext),
    photoId: requirementOnFile("photo_id", reviewPanelist, requirementContext),
  };

  const allVerified =
    onFile.email &&
    onFile.phone &&
    onFile.photoId &&
    editState.admin_email_approved === "true" &&
    editState.admin_phone_approved === "true" &&
    editState.admin_photo_id_approved === "true";

  const documentBase = `/api/admin/panelists/${encodeURIComponent(panelistEmail)}/document`;
  const reviewDetail = {
    email: editState.email,
    phone: editState.phone_whatsapp,
    photoIdType,
    photoIdDocumentUrl: requirementContext.hasPhotoUpload ? `${documentBase}?kind=photo-id` : undefined,
    residenceDocumentUrl: requirementContext.hasResidenceUpload
      ? `${documentBase}?kind=residence-proof`
      : undefined,
  };

  return (
    <BrandedModal
      open
      onClose={onClose}
      title={label}
      eyebrow="Edit panelist"
      footer={
        <>
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
            className="inline-flex min-h-11 items-center rounded-xl border border-teal-200 bg-white dark:bg-zinc-900 px-5 text-sm font-semibold text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40"
          >
            Cancel
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-teal-100 dark:border-teal-900/60 bg-teal-50/40 p-4">
          <p className="text-sm font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Required checks")}</p>
          <p className="mt-1 text-xs text-teal-900/80">
            Verify or deny each item below. When email, phone, and photo ID are all verified, the panelist becomes fully verified.
          </p>
          <div className="mt-3">
            <RequirementReviewControls
              decisions={{
                email: editState.admin_email_approved,
                phone: editState.admin_phone_approved,
                photoId: editState.admin_photo_id_approved,
              }}
              onFile={onFile}
              detail={reviewDetail}
              onDecision={onRequirementDecision}
              disabled={saving}
            />
          </div>
          {allVerified ? (
            <p className="mt-3 text-xs font-semibold text-emerald-700">
              All required checks verified — verification status will be set to Verified when saved.
            </p>
          ) : null}
        </div>
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
          <label htmlFor="admin-notes" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Admin notes
          </label>
          <textarea
            id="admin-notes"
            rows={4}
            value={editState.notes}
            onChange={(e) => onChange({ ...editState, notes: e.target.value })}
            className="mt-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>
        {error ? (
          <BrandedAlert tone="error" compact showIcon>
            {error}
          </BrandedAlert>
        ) : null}
        {message ? (
          <BrandedAlert tone="success" compact showIcon>
            {message}
          </BrandedAlert>
        ) : null}
      </div>
    </BrandedModal>
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

function DataTable({
  rows,
  columns,
  actions,
  requirementByEmail,
}: {
  rows: Array<PanelistRow | AdminPanelistPublicRow>;
  columns: readonly string[];
  actions?: RowActions;
  requirementByEmail: Record<
    string,
    { email: RequirementApprovalStatus; phone: RequirementApprovalStatus; photoId: RequirementApprovalStatus }
  >;
}) {
  return (
    <table className="min-w-[1100px] text-left text-xs sm:text-sm">
      <thead>
        <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
          {actions ? (
            <th className="sticky left-0 z-10 whitespace-nowrap bg-zinc-50 dark:bg-zinc-950 px-2 py-2 font-semibold">Actions</th>
          ) : null}
          {columns.map((column) => (
            <th key={column} className="whitespace-nowrap px-3 py-2 font-semibold">
              {column.replace(/_/g, " ")}
            </th>
          ))}
          <th className="whitespace-nowrap px-3 py-2 font-semibold">Email · Phone · ID</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length + (actions ? 2 : 1)} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
              No records on this page.
            </td>
          </tr>
        ) : (
          rows.map((row, index) => {
            const isFlagged = isFlaggedPanelist(row);
            const requirements = requirementByEmail[cleanText(row.email).toLowerCase()];
            return (
              <tr
                key={`${row.email}-${index}`}
                className={`border-b border-zinc-100 dark:border-zinc-800 ${isFlagged ? "bg-amber-50/80" : ""}`}
              >
                {actions ? (
                  <td className="sticky left-0 z-10 bg-inherit px-2 py-2">
                    <RowActionButtons email={row.email} actions={actions} flagged={isFlagged} />
                  </td>
                ) : null}
                {columns.map((column) => (
                  <td key={column} className="max-w-[14rem] truncate whitespace-nowrap px-3 py-2 text-zinc-700 dark:text-zinc-300">
                    {row[column] ?? ""}
                  </td>
                ))}
                <td className="whitespace-nowrap px-3 py-2">
                  {requirements ? (
                    <RequirementStatusGroup
                      email={requirements.email}
                      phone={requirements.phone}
                      photoId={requirements.photoId}
                      iconsOnly
                    />
                  ) : (
                    "—"
                  )}
                </td>
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
      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">{formatHeadingCase(label)}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-sm"
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
      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">{formatHeadingCase(label)}</label>
      <SiteSelect
        value={value}
        onChange={onChange}
        options={mapStringOptions(options)}
        className="mt-2"
      />
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PANELIST_STATUS, VERIFICATION_STATUS } from "@/lib/admin-constants";
import {
  applyAdminPanelistFilters,
  countPanelistsByField,
  formatAccountOpenedAt,
  getDuplicateReviewRows,
  getFlaggedPanelists,
  groupDuplicateReviewClusters,
  isFlaggedPanelist,
  panelistDisplayLabel,
  panelistMatchesAdminSearch,
  sortPanelistRows,
  type AdminPanelistPublicRow,
} from "@/lib/admin-panelists";
import { formatAuthorisedByLabel, parseAuthorisedRegistration } from "@/lib/authorised-registrars";
import { BELIZE_DISTRICTS, CITY_TOWN_VILLAGE, getConstituencyOptions } from "@/lib/constants";
import type { PanelistRow } from "@/lib/panelists";
import { SiteSelect, mapStringOptions } from "@/components/shared/SiteSelect";
import { formatHeadingCase } from "@/lib/sentence-case";
import { cleanText } from "@/lib/validation";
import { buildPanelistDeleteCode } from "@/lib/admin-delete-confirmation";
import { FilterMultiSelect, adminFieldLabelClass, adminResponsiveTableClass } from "@/components/admin/shared/AdminUi";
import { AdminDeleteConfirmDialog } from "@/components/admin/shared/AdminDeleteConfirmDialog";
import { RequirementStatusGroup } from "@/components/admin/shared/RequirementStatusBadges";
import { TablePagination, useTablePagination } from "@/components/admin/shared/TablePagination";
import { BrandedAlert, BrandedModal } from "@/components/shared/BrandedFeedback";
import { useToast } from "@/components/shared/ToastProvider";

function requirementToastTitle(key: "email" | "phone" | "photoId", decision: "true" | "false"): string {
  const item = key === "phone" ? "Phone number" : key === "photoId" ? "Photo identification" : "Email";
  return decision === "true" ? `${item} verified` : `${item} not approved`;
}
import { DuplicateReviewClusters } from "./DuplicateReviewClusters";
import { RequirementReviewControls } from "@/components/admin/shared/RequirementReviewControls";
import type { AdminRequirementDecision, RequirementApprovalStatus } from "@/lib/panelist-requirements";
import {
  ADMIN_REQUIREMENT_FIELDS,
  requirementOnFile,
  verificationStatusFromRequirementApprovals,
} from "@/lib/panelist-requirements";
import {
  adminPanelistDocumentUrl,
  panelistHasPhotoDocument,
  panelistHasResidenceDocument,
  type UsernameCollection,
} from "@/lib/panelist-document-view";

const TABLE_COLUMNS = [
  "account_opened_at",
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

const COLUMN_LABELS: Record<string, string> = {
  account_opened_at: "Account opened",
  first_name: "First name",
  last_name: "Last name",
  email: "Email",
  phone_whatsapp: "Phone",
  district: "District",
  constituency: "Constituency",
  voter_status: "Voter status",
  verification_status: "Verification",
  status: "Status",
  requirements: "Email · Phone · ID",
  authorised_by: "Authorised by",
};

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
  emailVerifiedByAccount = {},
  filterOptions,
  initialVerification,
  initialEmail,
  initialTab,
  photoUploadUsernames,
  residenceUploadUsernames,
  liveDatabase = false,
  returnTo,
}: {
  rows: PanelistRow[];
  requirementByEmail: Record<
    string,
    { email: RequirementApprovalStatus; phone: RequirementApprovalStatus; photoId: RequirementApprovalStatus }
  >;
  emailVerifiedByAccount?: Record<string, boolean>;
  filterOptions: {
    verification: string[];
    district: string[];
    constituency: string[];
    voterStatus: string[];
  };
  initialVerification?: string;
  initialEmail?: string;
  initialTab?: "all" | "duplicates" | "flagged";
  photoUploadUsernames: UsernameCollection;
  residenceUploadUsernames: UsernameCollection;
  liveDatabase?: boolean;
  returnTo?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [tab, setTab] = useState<"all" | "duplicates" | "flagged">(initialTab ?? "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState("account_opened_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
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
  const [deleteDialogError, setDeleteDialogError] = useState("");
  const [deleteDialogSuccess, setDeleteDialogSuccess] = useState("");
  const [rowActionMessage, setRowActionMessage] = useState("");

  const filteredRows = useMemo(
    () =>
      applyAdminPanelistFilters(rows, {
        verification: verificationFilter,
        district: districtFilter,
        constituency: constituencyFilter,
        voterStatus: voterFilter,
        query: searchQuery,
      }),
    [rows, verificationFilter, districtFilter, constituencyFilter, voterFilter, searchQuery]
  );

  const duplicateRows = useMemo(() => getDuplicateReviewRows(rows), [rows]);
  const duplicateClusters = useMemo(() => {
    const clusters = groupDuplicateReviewClusters(rows);
    const query = searchQuery.trim();
    if (!query) return clusters;
    return clusters.filter((cluster) => cluster.records.some((row) => panelistMatchesAdminSearch(row, query)));
  }, [rows, searchQuery]);
  const flaggedRows = useMemo(
    () =>
      applyAdminPanelistFilters(getFlaggedPanelists(rows), {
        verification: verificationFilter,
        district: districtFilter,
        constituency: constituencyFilter,
        voterStatus: voterFilter,
        query: searchQuery,
      }),
    [rows, verificationFilter, districtFilter, constituencyFilter, voterFilter, searchQuery]
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

  const sortValue = useCallback((row: PanelistRow, key: string) => {
    if (key === "requirements") {
      const requirement = requirementByEmail[cleanText(row.email).toLowerCase()];
      if (!requirement) return "";
      return [requirement.email, requirement.phone, requirement.photoId].join(" ");
    }
    if (key === "authorised_by") {
      return formatAuthorisedByLabel({
        notes: row.notes,
        authorised_verification_code: row.authorised_verification_code,
        authorised_registrar_name: row.authorised_registrar_name,
      });
    }
    return row[key] ?? "";
  }, [requirementByEmail]);

  const sortedRows = useMemo(
    () => sortPanelistRows(filteredRows, sortKey, sortDirection, sortValue),
    [filteredRows, sortKey, sortDirection, sortValue]
  );
  const sortedFlaggedRows = useMemo(
    () => sortPanelistRows(flaggedRows, sortKey, sortDirection, sortValue),
    [flaggedRows, sortKey, sortDirection, sortValue]
  );
  const sortedDuplicateClusters = useMemo(() => {
    const sortable = duplicateClusters.flatMap((cluster) => {
      const record = cluster.records[0];
      if (!record) return [];
      const { duplicate_name_dob_flag: _ignored, ...rest } = record;
      return [{ ...rest, __clusterId: cluster.id }];
    });
    return sortPanelistRows(sortable, sortKey, sortDirection, sortValue)
      .map((row) => duplicateClusters.find((cluster) => cluster.id === row.__clusterId))
      .filter((cluster): cluster is (typeof duplicateClusters)[number] => Boolean(cluster));
  }, [duplicateClusters, sortKey, sortDirection, sortValue]);

  const allPagination = useTablePagination(sortedRows);
  const duplicatePagination = useTablePagination(sortedDuplicateClusters);
  const flaggedPagination = useTablePagination(sortedFlaggedRows);

  const onSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection(key === "account_opened_at" ? "desc" : "asc");
    }
    allPagination.setPage(1);
    flaggedPagination.setPage(1);
    duplicatePagination.setPage(1);
  };

  const cityOptions =
    editState?.district && editState.district in CITY_TOWN_VILLAGE
      ? ["", ...CITY_TOWN_VILLAGE[editState.district]]
      : [""];

  const editingEmail = editingRow?.email ?? null;

  const openRecord = (row: PanelistRow) => {
    setMessage("");
    setError("");

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
      admin_email_approved: readDecision(
        ADMIN_REQUIREMENT_FIELDS.email,
        derived?.email === "approved" || emailVerifiedByAccount[emailKey] === true
      ),
      admin_phone_approved: readDecision(ADMIN_REQUIREMENT_FIELDS.phone, derived?.phone === "approved"),
      admin_photo_id_approved: readDecision(ADMIN_REQUIREMENT_FIELDS.photoId, derived?.photoId === "approved"),
    });
  };

  const openEdit = (email: string) => {
    const row = rows.find((item) => item.email === email);
    if (!row) {
      setEditingRow(null);
      setEditState(null);
      return;
    }
    openRecord(row);
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
    if (returnTo) {
      router.push(returnTo);
    }
  };

  const requirementReviewContext = useMemo(() => {
    if (!editingRow) return { hasPhotoUpload: false, hasResidenceUpload: false, emailVerified: false };
    const emailKey = cleanText(editingRow.email).toLowerCase();
    return {
      hasPhotoUpload: panelistHasPhotoDocument(editingRow, photoUploadUsernames),
      hasResidenceUpload: panelistHasResidenceDocument(editingRow, residenceUploadUsernames),
      emailVerified: emailVerifiedByAccount[emailKey] === true,
    };
  }, [editingRow, photoUploadUsernames, residenceUploadUsernames, emailVerifiedByAccount]);

  const applyRequirementDecision = async (key: "email" | "phone" | "photoId", decision: "true" | "false") => {
    if (!editState || !editingRow || !editingEmail || saving) return;

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
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/admin/panelists/${encodeURIComponent(editingEmail)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok) {
        const failure = data.message ?? "Could not save this check.";
        setEditState(editState);
        setError(failure);
        showToast({ tone: "error", title: "Check not saved", body: failure });
        return;
      }
      const success = data.message ?? "Record updated successfully.";
      const tellsThePanelist = /panelist/i.test(success);
      const fullyVerified = /fully verified/i.test(success);
      setEditingRow(mergedRow);
      setMessage(success);
      showToast({
        tone: decision === "true" ? "success" : "warning",
        title: fullyVerified ? "Account verified" : requirementToastTitle(key, decision),
        body: tellsThePanelist ? success : "Saved. The panelist will see this in their alerts.",
      });
      router.refresh();
    } catch {
      setEditState(editState);
      setError("Network error. Please try again.");
      showToast({ tone: "error", title: "Check not saved", body: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const params = new URLSearchParams();
    verificationFilter.forEach((value) => params.append("verification", value));
    districtFilter.forEach((value) => params.append("district", value));
    constituencyFilter.forEach((value) => params.append("constituency", value));
    voterFilter.forEach((value) => params.append("voterStatus", value));
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
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
    setDeleteDialogError("");
    setDeleteDialogSuccess("");
    setDeleteConfirmEmail(email);
  };

  const closeDeleteDialog = () => {
    setDeleteConfirmEmail(null);
    setDeleteDialogError("");
    setDeleteDialogSuccess("");
  };

  const confirmDeleteRecord = async (confirmCode: string) => {
    const email = deleteConfirmEmail;
    if (!email) return;

    const row = rows.find((item) => item.email === email);
    const label = row ? panelistDisplayLabel(row) : email;

    setDeletingEmail(email);
    setDeleteDialogError("");
    setDeleteDialogSuccess("");
    setRowActionMessage("");
    try {
      const res = await fetch(`/api/admin/panelists/${encodeURIComponent(email)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmCode }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setDeleteDialogError(data.message ?? "Could not delete record.");
        return;
      }
      if (editingEmail === email) closeEdit();
      const successMessage = `The panelist record and login account for ${label} have been successfully deleted.`;
      setDeleteDialogSuccess(successMessage);
      setRowActionMessage(successMessage);
      router.refresh();
    } catch {
      setDeleteDialogError("Network error while deleting record.");
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
        const failure = data.message ?? "Could not save changes.";
        setError(failure);
        showToast({ tone: "error", title: "Changes not saved", body: failure });
        return;
      }
      setMessage("Record updated successfully.");
      showToast({ tone: "success", title: "Record updated", body: data.message ?? "Record updated successfully." });
      closeEdit();
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      showToast({ tone: "error", title: "Changes not saved", body: "Network error. Please try again." });
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
    { id: "flagged" as const, label: "Flagged", count: flaggedRows.length },
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
        <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">
          Browse, filter, and open panelist records. Click a row or View record to open someone. Flag and delete stay in the actions column.
        </p>
      </div>

      {liveDatabase ? (
        <BrandedAlert tone="info" compact showIcon>
          This list is loaded live from the database. A delete in Supabase will disappear here after you refresh.
        </BrandedAlert>
      ) : (
        <BrandedAlert tone="warning" showIcon>
          This admin list is using local files, not the live Supabase database. Deletes you make in Supabase will not
          show here, and this list can still block registration. Add the Supabase keys to web/.env.local and restart
          the app so admin and the live site stay in sync.
        </BrandedAlert>
      )}

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Filters")}</h2>
        <div className="mt-4">
          <label htmlFor="panelist-search" className={adminFieldLabelClass}>
            Search
          </label>
          <input
            id="panelist-search"
            type="search"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              allPagination.setPage(1);
              flaggedPagination.setPage(1);
              duplicatePagination.setPage(1);
            }}
            placeholder="Search name, username, email, or phone…"
            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>
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
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
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
                : "text-zinc-600 dark:text-zinc-300 hover:bg-teal-50/50 hover:text-teal-800 dark:text-teal-200"
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
              <p className="mt-1 max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">
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
                {searchQuery.trim()
                  ? "No duplicate clusters match that search."
                  : "No records share the same name and exact date of birth."}
              </BrandedAlert>
            </div>
          )}
        </section>
      ) : tab === "flagged" ? (
        <section className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Flagged panelists")}</h2>
              <p className="mt-1 max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">
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
                  onOpen={openRecord}
                  requirementByEmail={requirementByEmail}
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={onSort}
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
                {searchQuery.trim()
                  ? "No flagged panelists match that search."
                  : "No panelists are currently flagged as Possible Duplicate."}
              </BrandedAlert>
            </div>
          )}
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("All panelists")}</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-300">
                Click a row to open it. View record stays on screen while the other columns scroll.
              </p>
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
              onOpen={openRecord}
              requirementByEmail={requirementByEmail}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={onSort}
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
          authorisedCode={parseAuthorisedRegistration(editingRow).code}
          authorisedBy={parseAuthorisedRegistration(editingRow).registrarName}
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
        open={Boolean((deleteConfirmEmail && deleteConfirmCode) || deleteDialogSuccess)}
        title="Delete panelist record"
        description={`Delete panelist record for ${deleteConfirmLabel}? This removes the register entry, login account, and related survey data from Supabase.`}
        confirmCode={deleteConfirmCode}
        confirmLabel="Delete record"
        cancelLabel="Keep record"
        loading={Boolean(deletingEmail)}
        error={deleteDialogError}
        success={deleteDialogSuccess}
        onConfirm={confirmDeleteRecord}
        onCancel={closeDeleteDialog}
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
  authorisedCode,
  authorisedBy,
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
  authorisedCode: string;
  authorisedBy: string;
  panelistEmail: string;
  requirementContext: { hasPhotoUpload?: boolean; hasResidenceUpload?: boolean; emailVerified?: boolean };
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
    authorised_verification_code: authorisedCode,
    authorised_registrar_name: authorisedBy,
  };

  const onFile = {
    email: requirementOnFile("email", reviewPanelist, requirementContext),
    phone: requirementOnFile("phone", reviewPanelist, requirementContext),
    photoId: requirementOnFile("photo_id", reviewPanelist, requirementContext),
  };

  const emailSatisfied = editState.admin_email_approved === "true" || requirementContext.emailVerified === true;
  const allVerified =
    onFile.email &&
    onFile.phone &&
    onFile.photoId &&
    emailSatisfied &&
    editState.admin_phone_approved === "true" &&
    editState.admin_photo_id_approved === "true";

  const documentBase = `/api/admin/panelists/${encodeURIComponent(panelistEmail)}/document`;
  const reviewDetail = {
    email: editState.email || panelistEmail,
    phone: editState.phone_whatsapp,
    photoIdType,
    photoIdDocumentUrl: `${documentBase}?kind=photo-id`,
    residenceDocumentUrl: requirementContext.hasResidenceUpload
      ? `${documentBase}?kind=residence-proof`
      : undefined,
  };

  return (
    <BrandedModal
      open
      onClose={onClose}
      title={label}
      eyebrow="View record"
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
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-700 dark:bg-teal-950">
          <p className="text-sm font-semibold text-teal-950 dark:text-teal-50">{formatHeadingCase("Required checks")}</p>
          <p className="mt-1 text-xs text-teal-900 dark:text-teal-100">
            Email is verified automatically when the panelist confirms it from their inbox. Verify or deny phone
            and photo ID below — each choice saves immediately and notifies the panelist. When all three are
            verified, the panelist becomes fully verified.
          </p>
          <div className="mt-3">
            <RequirementReviewControls
              decisions={{
                email: emailSatisfied ? "true" : editState.admin_email_approved,
                phone: editState.admin_phone_approved,
                photoId: editState.admin_photo_id_approved,
              }}
              onFile={onFile}
              detail={reviewDetail}
              onDecision={onRequirementDecision}
              disabled={saving}
              itemNotes={{
                email: requirementContext.emailVerified
                  ? "Confirmed by the panelist from their inbox. No administrator check is required."
                  : undefined,
              }}
            />
          </div>
          {allVerified ? (
            <p className="mt-3 text-xs font-semibold text-emerald-700">
              All required checks verified — verification status will be set to Verified when saved.
            </p>
          ) : null}
        </div>
        {authorisedCode || authorisedBy ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
            <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
              {formatHeadingCase("Authorised registration")}
            </p>
            <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">
              No photo ID file is on record. The ID was checked in person.
            </p>
            <p className="mt-2 text-sm text-amber-950 dark:text-amber-100">
              Authorised by: <strong>{authorisedBy || "Name not stored"}</strong>
            </p>
            <p className="mt-1 font-mono text-sm tracking-wide text-amber-950 dark:text-amber-100">
              Code: {authorisedCode || "Not stored"}
            </p>
          </div>
        ) : null}
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
  photoDocumentUrl,
}: {
  email: string;
  actions: RowActions;
  flagged?: boolean;
  photoDocumentUrl?: string;
}) {
  const busy = Boolean(cleanText(email)) && (actions.flaggingEmail === email || actions.deletingEmail === email);

  return (
    <div className="flex items-center gap-0.5">
      {photoDocumentUrl ? (
        <a
          href={photoDocumentUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="View ID document"
          aria-label="View ID document"
          className="rounded-lg p-1.5 text-sky-700 transition hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950/40"
        >
          <IdDocumentIcon />
        </a>
      ) : null}
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
  onOpen,
  requirementByEmail,
  sortKey,
  sortDirection,
  onSort,
}: {
  rows: Array<PanelistRow | AdminPanelistPublicRow>;
  columns: readonly string[];
  actions?: RowActions;
  onOpen?: (row: PanelistRow) => void;
  requirementByEmail: Record<
    string,
    { email: RequirementApprovalStatus; phone: RequirementApprovalStatus; photoId: RequirementApprovalStatus }
  >;
  sortKey: string;
  sortDirection: "asc" | "desc";
  onSort: (key: string) => void;
}) {
  const [openedColumn, ...restColumns] = columns;
  const headerClass = "whitespace-nowrap px-3 py-2 font-semibold";
  const openedStickyClass =
    "sticky left-0 z-10 w-[10.5rem] min-w-[10.5rem] max-w-[10.5rem] bg-zinc-50 dark:bg-zinc-950";
  const viewStickyClass =
    "sticky left-[10.5rem] z-20 bg-zinc-50 dark:bg-zinc-950 lg:shadow-[4px_0_10px_-6px_rgba(0,0,0,0.45)]";

  return (
    <table className={`${adminResponsiveTableClass} w-full text-left text-xs sm:text-sm lg:min-w-[1100px]`}>
      <thead>
        <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
          {openedColumn ? (
            <SortableHeader
              columnKey={openedColumn}
              label={COLUMN_LABELS[openedColumn] ?? openedColumn}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={onSort}
              className={`${openedStickyClass} ${headerClass}`}
            />
          ) : null}
          {actions ? (
            <th className={`${viewStickyClass} ${headerClass}`}>View</th>
          ) : null}
          {actions ? (
            <th className={`bg-zinc-50 dark:bg-zinc-950 ${headerClass}`}>Actions</th>
          ) : null}
          {restColumns.map((column) => (
            <SortableHeader
              key={column}
              columnKey={column}
              label={COLUMN_LABELS[column] ?? column.replace(/_/g, " ")}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={onSort}
              className={headerClass}
            />
          ))}
          <SortableHeader
            columnKey="requirements"
            label={COLUMN_LABELS.requirements}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={onSort}
            className={headerClass}
          />
          <SortableHeader
            columnKey="authorised_by"
            label={COLUMN_LABELS.authorised_by}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={onSort}
            className={headerClass}
          />
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length + (actions ? 4 : 2)} data-label="" className="admin-table-empty px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
              No matching panelists.
            </td>
          </tr>
        ) : (
          rows.map((row, index) => {
            const isFlagged = isFlaggedPanelist(row);
            const requirements = requirementByEmail[cleanText(row.email).toLowerCase()];
            const openedLabel = COLUMN_LABELS[openedColumn] ?? "Account opened";
            const rowBusy =
              Boolean(cleanText(row.email)) &&
              (actions?.flaggingEmail === row.email || actions?.deletingEmail === row.email);
            const rowBg = isFlagged
              ? "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:hover:bg-amber-900"
              : "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800";
            return (
              <tr
                key={`${row.email}-${index}`}
                onClick={(event) => {
                  if (!onOpen || rowBusy) return;
                  const target = event.target;
                  if (target instanceof Element && target.closest("button, a, input, select, textarea, label")) {
                    return;
                  }
                  onOpen(row);
                }}
                className={`border-b border-zinc-100 dark:border-zinc-800 ${onOpen ? "cursor-pointer" : ""} ${rowBg}`}
              >
                {openedColumn ? (
                  <td
                    data-label={openedLabel}
                    className="sticky left-0 z-10 w-[10.5rem] min-w-[10.5rem] max-w-[10.5rem] bg-inherit px-3 py-2 whitespace-nowrap tabular-nums text-zinc-800 dark:text-zinc-200"
                  >
                    {formatAccountOpenedAt(row[openedColumn] ?? "")}
                  </td>
                ) : null}
                {actions ? (
                  <td
                    data-label="View"
                    className="sticky left-[10.5rem] z-20 bg-inherit px-2 py-2 lg:shadow-[4px_0_10px_-6px_rgba(0,0,0,0.45)]"
                  >
                    <ViewRecordButton disabled={rowBusy || !onOpen} onClick={() => onOpen?.(row)} />
                  </td>
                ) : null}
                {actions ? (
                  <td data-label="Actions" className="bg-inherit px-2 py-2">
                    <RowActionButtons
                      email={row.email}
                      actions={actions}
                      flagged={isFlagged}
                      photoDocumentUrl={
                        row.email ? adminPanelistDocumentUrl(row.email, "photo-id") : undefined
                      }
                    />
                  </td>
                ) : null}
                {restColumns.map((column) => (
                  <td
                    key={column}
                    data-label={COLUMN_LABELS[column] ?? column.replace(/_/g, " ")}
                    className="max-w-none px-3 py-2 text-zinc-700 dark:text-zinc-300 md:max-w-[14rem] md:truncate md:whitespace-nowrap"
                  >
                    {row[column] ?? ""}
                  </td>
                ))}
                <td data-label={COLUMN_LABELS.requirements} className="px-3 py-2 md:whitespace-nowrap">
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
                <td data-label={COLUMN_LABELS.authorised_by} className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                  {formatAuthorisedByLabel({
                    notes: row.notes,
                    authorised_verification_code: row.authorised_verification_code,
                    authorised_registrar_name: row.authorised_registrar_name,
                  }) || "—"}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

function SortableHeader({
  columnKey,
  label,
  sortKey,
  sortDirection,
  onSort,
  className,
}: {
  columnKey: string;
  label: string;
  sortKey: string;
  sortDirection: "asc" | "desc";
  onSort: (key: string) => void;
  className?: string;
}) {
  const active = sortKey === columnKey;
  const directionLabel = sortDirection === "asc" ? "ascending" : "descending";
  const tooltip = active
    ? `${label}, sorted ${directionLabel}. Click to reverse.`
    : `Sort by ${label}`;
  return (
    <th
      aria-sort={active ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
      className={className}
    >
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        data-tooltip={tooltip}
        className="inline-flex items-center gap-1 font-semibold text-inherit hover:text-teal-800 dark:hover:text-teal-200"
      >
        {label}
        <span aria-hidden className={active ? "text-teal-700 dark:text-teal-300" : "text-zinc-400"}>
          {active ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}

function IdDocumentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="12" r="2.2" />
      <path d="M14 10h5M14 14h5" />
    </svg>
  );
}

function ViewRecordButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-8 items-center gap-1 whitespace-nowrap rounded-lg bg-teal-700 px-2.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-40"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      View record
    </button>
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

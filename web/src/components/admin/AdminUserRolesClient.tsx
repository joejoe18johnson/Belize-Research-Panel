"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageIntro } from "@/components/admin/shared/AdminUi";
import { TablePagination, useTablePagination } from "@/components/admin/shared/TablePagination";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { SiteSelect } from "@/components/shared/SiteSelect";
import {
  STAFF_ROLE_LABELS,
  STAFF_ROLES,
  moduleLabelsForSlugs,
  type StaffRole,
} from "@/lib/staff-roles";
import type { StaffUserPublic } from "@/lib/staff-users";
import { formatHeadingCase } from "@/lib/sentence-case";

type DraftMap = Record<
  string,
  {
    firstName: string;
    lastName: string;
    role: StaffRole;
    status: "active" | "inactive";
    password: string;
  }
>;

function buildDrafts(users: StaffUserPublic[]): DraftMap {
  return Object.fromEntries(
    users.map((user) => [
      user.id,
      {
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        status: user.status,
        password: "",
      },
    ])
  );
}

export function AdminUserRolesClient({
  users,
  currentStaffId,
  roleAccess,
}: {
  users: StaffUserPublic[];
  currentStaffId: string;
  roleAccess: Record<StaffRole, string[]>;
}) {
  const router = useRouter();
  const pagination = useTablePagination(users);
  const [drafts, setDrafts] = useState<DraftMap>(() => buildDrafts(users));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "operations_manager" as StaffRole,
    password: "",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    setDrafts(buildDrafts(users));
  }, [users]);

  const roleOptions = useMemo(
    () =>
      STAFF_ROLES.map((role) => ({
        value: role,
        label: STAFF_ROLE_LABELS[role],
      })),
    []
  );

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const updateDraft = (id: string, patch: Partial<DraftMap[string]>) => {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  };

  const saveUser = async (id: string, options?: { roleOnly?: boolean }) => {
    const draft = drafts[id];
    if (!draft) return;

    setSavingId(id);
    setError("");
    setSuccess("");
    try {
      const payload: Record<string, string> = options?.roleOnly
        ? { role: draft.role, status: draft.status }
        : {
            firstName: draft.firstName,
            lastName: draft.lastName,
            role: draft.role,
            status: draft.status,
          };
      if (!options?.roleOnly && draft.password.trim()) payload.password = draft.password.trim();

      const res = await fetch(`/api/admin/staff-users/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Could not save staff account.");
        return;
      }
      setSuccess(
        options?.roleOnly
          ? "Role updated. The user must sign out and back in for their admin menu to reflect the change."
          : "Staff account updated."
      );
      setDrafts((current) => ({
        ...current,
        [id]: { ...current[id], password: "" },
      }));
      router.refresh();
    } catch {
      setError("Network error while saving.");
    } finally {
      setSavingId(null);
    }
  };

  const roleOrStatusChanged = (user: StaffUserPublic) => {
    const draft = drafts[user.id];
    if (!draft) return false;
    return draft.role !== user.role || draft.status !== user.status;
  };

  const deleteUser = async (user: StaffUserPublic) => {
    const name = `${user.first_name} ${user.last_name}`.trim() || user.email;
    if (!window.confirm(`Delete staff account "${name}"? This cannot be undone.`)) return;

    setDeletingId(user.id);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/staff-users/${encodeURIComponent(user.id)}`, { method: "DELETE" });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Could not delete staff account.");
        return;
      }
      setSuccess("Staff account deleted.");
      router.refresh();
    } catch {
      setError("Network error while deleting.");
    } finally {
      setDeletingId(null);
    }
  };

  const createUser = async () => {
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/staff-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Could not create staff account.");
        return;
      }
      setSuccess("Staff account created.");
      setCreateForm({
        firstName: "",
        lastName: "",
        email: "",
        role: "operations_manager",
        password: "",
        status: "active",
      });
      router.refresh();
    } catch {
      setError("Network error while creating account.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageIntro
        eyebrow="Access control"
        title={formatHeadingCase("User roles & permissions")}
        description="Super Admins can create staff accounts, assign roles, and control which admin modules each role can access."
      />

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

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Add staff account")}</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          New users sign in at the admin login page with their email and password.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">First name</label>
            <input
              value={createForm.firstName}
              onChange={(event) => setCreateForm((current) => ({ ...current, firstName: event.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Last name</label>
            <input
              value={createForm.lastName}
              onChange={(event) => setCreateForm((current) => ({ ...current, lastName: event.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Email</label>
            <input
              type="email"
              value={createForm.email}
              onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Role</label>
            <SiteSelect
              value={createForm.role}
              onChange={(value) => setCreateForm((current) => ({ ...current, role: value as StaffRole }))}
              options={roleOptions}
              className="mt-1.5"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Temporary password</label>
            <input
              type="password"
              value={createForm.password}
              onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Status</label>
            <SiteSelect
              value={createForm.status}
              onChange={(value) =>
                setCreateForm((current) => ({ ...current, status: value as "active" | "inactive" }))
              }
              options={statusOptions}
              className="mt-1.5"
            />
          </div>
        </div>
        <button
          type="button"
          disabled={creating}
          onClick={() => void createUser()}
          className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {creating ? "Creating…" : "Create staff account"}
        </button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Staff accounts")}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Change a user&apos;s role or status, then click <span className="font-semibold">Update role</span> or{" "}
            <span className="font-semibold">Save changes</span>. You cannot change your own role or deactivate yourself.
          </p>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-[11px] font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">New password</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagination.paginatedRows.map((user) => {
              const draft = drafts[user.id] ?? {
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                status: user.status,
                password: "",
              };
              const isSelf = user.id === currentStaffId;
              const roleDirty = roleOrStatusChanged(user);

              return (
                <tr key={user.id} className="border-b border-zinc-50 align-top dark:border-zinc-800/80">
                  <td className="px-4 py-3">
                    <div className="grid gap-2">
                      <input
                        value={draft.firstName}
                        onChange={(event) => updateDraft(user.id, { firstName: event.target.value })}
                        className="w-full min-w-[8rem] rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm dark:border-zinc-800"
                      />
                      <input
                        value={draft.lastName}
                        onChange={(event) => updateDraft(user.id, { lastName: event.target.value })}
                        className="w-full min-w-[8rem] rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm dark:border-zinc-800"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{user.email}</td>
                  <td className="px-4 py-3">
                    <SiteSelect
                      value={draft.role}
                      onChange={(value) => updateDraft(user.id, { role: value as StaffRole })}
                      options={roleOptions}
                      disabled={isSelf}
                      className="min-w-[11rem]"
                    />
                    <p className="mt-2 max-w-xs text-xs text-zinc-500 dark:text-zinc-400">
                      {moduleLabelsForSlugs(roleAccess[draft.role] ?? [])}
                    </p>
                    {roleDirty && !isSelf ? (
                      <button
                        type="button"
                        disabled={savingId === user.id}
                        onClick={() => void saveUser(user.id, { roleOnly: true })}
                        className="mt-2 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 disabled:opacity-60 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-200 dark:hover:bg-teal-950/60"
                      >
                        {savingId === user.id ? "Updating…" : "Update role"}
                      </button>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <SiteSelect
                      value={draft.status}
                      onChange={(value) =>
                        updateDraft(user.id, { status: value as "active" | "inactive" })
                      }
                      options={statusOptions}
                      disabled={isSelf}
                      className="min-w-[8rem]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="password"
                      value={draft.password}
                      onChange={(event) => updateDraft(user.id, { password: event.target.value })}
                      placeholder="Leave blank to keep"
                      className="w-full min-w-[10rem] rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm dark:border-zinc-800"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={savingId === user.id}
                        onClick={() => void saveUser(user.id)}
                        className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                      >
                        {savingId === user.id ? "Saving…" : "Save changes"}
                      </button>
                      {!isSelf ? (
                        <button
                          type="button"
                          disabled={deletingId === user.id}
                          onClick={() => void deleteUser(user)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"
                        >
                          {deletingId === user.id ? "Deleting…" : "Delete"}
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Your account</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <TablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalPages={pagination.totalPages}
            totalRows={pagination.totalRows}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </section>
    </div>
  );
}

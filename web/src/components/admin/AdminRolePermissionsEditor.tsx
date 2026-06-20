"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { ADMIN_NAV_SECTIONS, getAdminModulesBySection } from "@/lib/admin-modules";
import {
  DEFAULT_ROLE_MODULE_ACCESS,
  STAFF_ROLE_LABELS,
  STAFF_ROLES,
  moduleLabelsForSlugs,
  type StaffRole,
} from "@/lib/staff-roles";
import { formatAdminLabel, formatHeadingCase } from "@/lib/sentence-case";

type RoleDraft = {
  description: string;
  modules: Set<string>;
};

function buildRoleDrafts(
  access: Record<StaffRole, string[]>,
  descriptions: Record<StaffRole, string>
): Record<StaffRole, RoleDraft> {
  return Object.fromEntries(
    STAFF_ROLES.map((role) => [
      role,
      {
        description: descriptions[role] ?? "",
        modules: new Set(access[role] ?? DEFAULT_ROLE_MODULE_ACCESS[role]),
      },
    ])
  ) as Record<StaffRole, RoleDraft>;
}

function draftsEqual(
  role: StaffRole,
  draft: RoleDraft,
  savedAccess: Record<StaffRole, string[]>,
  savedDescriptions: Record<StaffRole, string>
): boolean {
  const savedModules = new Set(savedAccess[role] ?? []);
  if (draft.description.trim() !== (savedDescriptions[role] ?? "").trim()) return false;
  if (draft.modules.size !== savedModules.size) return false;
  for (const slug of draft.modules) {
    if (!savedModules.has(slug)) return false;
  }
  return true;
}

export function AdminRolePermissionsEditor({
  initialAccess,
  initialDescriptions,
}: {
  initialAccess: Record<StaffRole, string[]>;
  initialDescriptions: Record<StaffRole, string>;
}) {
  const router = useRouter();
  const [savedAccess, setSavedAccess] = useState(initialAccess);
  const [savedDescriptions, setSavedDescriptions] = useState(initialDescriptions);
  const [drafts, setDrafts] = useState(() => buildRoleDrafts(initialAccess, initialDescriptions));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingRole, setSavingRole] = useState<StaffRole | null>(null);
  const [resettingRole, setResettingRole] = useState<StaffRole | null>(null);

  const modulesBySection = useMemo(
    () =>
      ADMIN_NAV_SECTIONS.map((section) => ({
        section,
        modules: getAdminModulesBySection(section.id),
      })).filter((entry) => entry.modules.length > 0),
    []
  );

  const updateDraft = (role: StaffRole, patch: Partial<RoleDraft>) => {
    setDrafts((current) => ({
      ...current,
      [role]: { ...current[role], ...patch },
    }));
  };

  const toggleModule = (role: StaffRole, slug: string, checked: boolean) => {
    if (role === "super_admin") return;
    setDrafts((current) => {
      const nextModules = new Set(current[role].modules);
      if (checked) nextModules.add(slug);
      else nextModules.delete(slug);
      return { ...current, [role]: { ...current[role], modules: nextModules } };
    });
  };

  const saveRole = async (role: StaffRole) => {
    const draft = drafts[role];
    setSavingRole(role);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/staff-role-access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          description: draft.description,
          modules: role === "super_admin" ? undefined : Array.from(draft.modules),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        access?: Record<StaffRole, string[]>;
      };
      if (!res.ok || !data.ok || !data.access) {
        setError(data.message ?? "Could not save role permissions.");
        return;
      }

      setSavedAccess(data.access);
      const nextDescriptions = { ...savedDescriptions, [role]: draft.description.trim() };
      setSavedDescriptions(nextDescriptions);
      setDrafts(buildRoleDrafts(data.access, nextDescriptions));
      setSuccess(
        role === "super_admin"
          ? "Super Admin description updated."
          : `${STAFF_ROLE_LABELS[role]} permissions saved. Affected users must sign out and back in for menu changes to apply.`
      );
      router.refresh();
    } catch {
      setError("Network error while saving role permissions.");
    } finally {
      setSavingRole(null);
    }
  };

  const resetRole = async (role: StaffRole) => {
    if (role === "super_admin") return;
    if (!window.confirm(`Reset ${STAFF_ROLE_LABELS[role]} to default permissions?`)) return;

    setResettingRole(role);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/admin/staff-role-access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, reset: true }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        access?: Record<StaffRole, string[]>;
      };
      if (!res.ok || !data.ok || !data.access) {
        setError(data.message ?? "Could not reset role permissions.");
        return;
      }

      const nextDescriptions = { ...savedDescriptions };
      delete nextDescriptions[role];
      setSavedAccess(data.access);
      setSavedDescriptions(nextDescriptions);
      setDrafts(buildRoleDrafts(data.access, nextDescriptions));
      setSuccess(`${STAFF_ROLE_LABELS[role]} reset to defaults.`);
      router.refresh();
    } catch {
      setError("Network error while resetting role permissions.");
    } finally {
      setResettingRole(null);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">
          {formatHeadingCase("Role permissions")}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Choose which admin modules each role can access. Super Admin always has full access. Staff must sign out and
          back in after permission changes.
        </p>
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

      <div className="grid gap-4 xl:grid-cols-2">
        {STAFF_ROLES.map((role) => {
          const draft = drafts[role];
          const isSuperAdmin = role === "super_admin";
          const dirty = !draftsEqual(role, draft, savedAccess, savedDescriptions);
          const moduleSummary = moduleLabelsForSlugs(Array.from(draft.modules));

          return (
            <div
              key={role}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-teal-950 dark:text-teal-100">
                    {formatAdminLabel(STAFF_ROLE_LABELS[role])}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {draft.modules.size} module{draft.modules.size === 1 ? "" : "s"} selected
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isSuperAdmin ? (
                    <button
                      type="button"
                      disabled={resettingRole === role || savingRole === role}
                      onClick={() => void resetRole(role)}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      {resettingRole === role ? "Resetting…" : "Reset defaults"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={!dirty || savingRole === role || resettingRole === role}
                    onClick={() => void saveRole(role)}
                    className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                  >
                    {savingRole === role ? "Saving…" : "Save role"}
                  </button>
                </div>
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Description</span>
                <textarea
                  value={draft.description}
                  onChange={(event) => updateDraft(role, { description: event.target.value })}
                  rows={2}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                />
              </label>

              <div className="mt-4 max-h-72 space-y-4 overflow-y-auto rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
                {modulesBySection.map(({ section, modules }) => (
                  <div key={section.id}>
                    <p className="text-[10px] font-bold tracking-[0.14em] text-zinc-500 uppercase dark:text-zinc-400">
                      {formatHeadingCase(section.label)}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {modules.map((module) => {
                        const checked = draft.modules.has(module.slug);
                        return (
                          <li key={module.slug}>
                            <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={isSuperAdmin}
                                onChange={(event) => toggleModule(role, module.slug, event.target.checked)}
                                className="mt-0.5 rounded border-zinc-300 text-teal-700 focus:ring-teal-600 disabled:opacity-60"
                              />
                              <span>{module.label}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">{moduleSummary}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

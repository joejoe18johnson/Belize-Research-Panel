"use client";

import Link from "next/link";
import { AdminNavIcon } from "@/components/admin/AdminNavIcons";
import { PageIntro } from "@/components/admin/shared/AdminUi";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import type { AdminModule } from "@/lib/admin-modules";
import { STAFF_ROLE_LABELS, type StaffRole } from "@/lib/staff-roles";
import { formatHeadingCase } from "@/lib/sentence-case";

export function AdminStaffHomeClient({
  displayName,
  email,
  role,
  roleDescription,
  modules,
  summaries = {},
  accessDenied = false,
}: {
  displayName: string;
  email: string;
  role: StaffRole;
  roleDescription: string;
  modules: AdminModule[];
  summaries?: Record<string, string>;
  accessDenied?: boolean;
}) {
  const roleLabel = STAFF_ROLE_LABELS[role];

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      {accessDenied ? (
        <BrandedAlert tone="warning" title="That page is not in your role" showIcon>
          You are signed in as {roleLabel}. Use the quick access links below, or the sidebar, to open a module you are
          allowed to use.
        </BrandedAlert>
      ) : null}

      <PageIntro
        eyebrow="Staff console"
        title={`Signed in as ${roleLabel}`}
        description={`${displayName} (${email}). ${roleDescription}`}
      />

      <section className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-700 via-teal-800 to-teal-950 p-5 text-white shadow-md shadow-teal-950/20 sm:p-6">
        <p className="text-xs font-semibold tracking-[0.14em] text-teal-100/80">{formatHeadingCase("Current session")}</p>
        <h2 className="mt-2 text-2xl font-bold">{displayName}</h2>
        <p className="mt-1 text-sm text-teal-50/90">{roleLabel}</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-teal-50/80">{roleDescription}</p>
        <p className="mt-4 text-xs text-teal-100/70">{email}</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatHeadingCase("Quick access")}</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Only modules assigned to {roleLabel} are listed. Open one to go straight to your work.
        </p>
        {modules.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No modules are assigned to this role yet. Ask a Super Admin to update User Roles & Permissions.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => (
              <li key={module.slug}>
                <Link
                  href={module.href ?? "/admin/home"}
                  className="flex h-full min-h-[7.5rem] flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-teal-950/[0.03] transition hover:border-teal-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-teal-700"
                >
                  <span className="flex items-start gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-100">
                      <AdminNavIcon module={module} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatHeadingCase(module.label)}
                      </span>
                      {summaries[module.slug] ? (
                        <span className="mt-1 block text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                          {summaries[module.slug]}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span className="mt-auto pt-3 text-xs font-semibold text-teal-700 dark:text-teal-300">Open →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

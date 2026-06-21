"use client";

import Link from "next/link";
import { adminAuthCardClassName } from "@/components/admin/AdminAuthShell";
import { STAFF_DEMO_PASSWORD } from "@/lib/demo-staff-users";
import { STAFF_ROLE_DESCRIPTIONS, STAFF_ROLE_LABELS, type StaffRole } from "@/lib/staff-roles";

const STAFF_LOGIN_ROWS: Array<{ role: StaffRole; email: string }> = [
  { role: "super_admin", email: "super.admin@belizepanel.test" },
  { role: "operations_manager", email: "ops.manager@belizepanel.test" },
  { role: "research_analyst", email: "research.analyst@belizepanel.test" },
  { role: "field_supervisor", email: "field.supervisor@belizepanel.test" },
  { role: "finance_officer", email: "finance.officer@belizepanel.test" },
  { role: "client_viewer", email: "client.viewer@belizepanel.test" },
];

const PANELIST_LOGIN_ROWS = [
  {
    label: "Panelist — signup only",
    email: "panelist.signup@belizepanel.test",
    access: "Public signup complete; finish panel registration at /register",
  },
  {
    label: "Panelist — pending verification",
    email: "panelist.pending@belizepanel.test",
    access: "Dashboard access; admin verification still pending",
  },
  {
    label: "Panelist — verified",
    email: "panelist.verified@belizepanel.test",
    access: "Full verified panelist dashboard, surveys, and rewards",
  },
  {
    label: "Panelist — account on hold",
    email: "panelist.onhold@belizepanel.test",
    access: "Login allowed; dashboard blocked until hold is cleared",
  },
] as const;

const TABLE_HEAD_CLASS =
  "border-b border-zinc-100 bg-zinc-50 text-[11px] font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400";

const TABLE_ROW_CLASS = "border-b border-zinc-100 dark:border-zinc-800";

const CODE_CLASS =
  "rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";

export function RoleTestAccountsReference({
  onSelectStaff,
  compact = false,
}: {
  onSelectStaff?: (email: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={adminAuthCardClassName}>
      <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">Role test accounts</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Use these accounts to see what each role can access. Staff password:{" "}
        <code className={CODE_CLASS}>{STAFF_DEMO_PASSWORD}</code> · Panelist password:{" "}
        <code className={CODE_CLASS}>DemoPass1!</code>
      </p>

      <div className="mt-5 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className={TABLE_HEAD_CLASS}>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Login</th>
              {!compact ? <th className="px-4 py-3 font-semibold">Access</th> : null}
              {onSelectStaff ? <th className="px-4 py-3 font-semibold">Use</th> : null}
            </tr>
          </thead>
          <tbody>
            {STAFF_LOGIN_ROWS.map((row) => (
              <tr key={row.email} className={TABLE_ROW_CLASS}>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{STAFF_ROLE_LABELS[row.role]}</td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  <div>{row.email}</div>
                </td>
                {!compact ? (
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{STAFF_ROLE_DESCRIPTIONS[row.role]}</td>
                ) : null}
                {onSelectStaff ? (
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSelectStaff(row.email)}
                      className="text-sm font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
                    >
                      Fill login
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-teal-950 dark:text-teal-100">Panelist personas</h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Sign in at the public panelist login page.</p>
        <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className={TABLE_HEAD_CLASS}>
                <th className="px-4 py-3 font-semibold">Persona</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                {!compact ? <th className="px-4 py-3 font-semibold">What you can access</th> : null}
              </tr>
            </thead>
            <tbody>
              {PANELIST_LOGIN_ROWS.map((row) => (
                <tr key={row.email} className={TABLE_ROW_CLASS}>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{row.label}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{row.email}</td>
                  {!compact ? <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row.access}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200">
            Open panelist login →
          </Link>
        </p>
      </div>
    </div>
  );
}

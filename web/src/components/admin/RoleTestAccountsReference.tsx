"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrpLogoLink } from "@/components/BrpLogo";
import { isDemoAccountsEnabled } from "@/lib/demo-accounts";
import { STAFF_DEMO_PASSWORD } from "@/lib/demo-staff-users";
import { formatHeadingCase } from "@/lib/sentence-case";
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

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const showReference = isDemoAccountsEnabled();

  const fillStaffLogin = (staffEmail: string) => {
    setEmail(staffEmail);
    setPassword(STAFF_DEMO_PASSWORD);
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; redirectTo?: string };
      if (!res.ok) {
        setError(data.message ?? "Invalid email or password.");
        return;
      }
      router.push(data.redirectTo ?? "/admin/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-teal-950 via-teal-900 to-zinc-900 text-white">
      <header className="safe-top px-4 py-4 sm:px-6">
        <BrpLogoLink href="/" variant="dark" />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:px-6">
        <div className="w-full max-w-2xl space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/95 p-6 text-zinc-900 shadow-xl sm:p-8">
            <p className="text-xs font-semibold tracking-[0.14em] text-teal-700">
              {formatHeadingCase("Admin access")}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-teal-950">{formatHeadingCase("Staff login")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Sign in with a staff email and password. Each role only sees the admin modules assigned to that role.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="admin-email" className="block text-sm font-medium text-zinc-800">
                  Staff email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="name.role@belizepanel.test"
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-zinc-800">
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                />
              </div>
              {error ? (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={submitting}
                className="flex min-h-11 w-full items-center justify-center rounded-xl bg-teal-700 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {submitting ? "Signing in…" : "Enter admin console"}
              </button>
            </form>
            <p className="mt-4 text-xs text-zinc-500">
              Legacy fallback: leave email blank and use the shared <code>ADMIN_PASSWORD</code> env value for super
              admin access.
            </p>
            <p className="mt-6 text-center text-sm text-zinc-600">
              <Link href="/" className="font-medium text-teal-700 hover:text-teal-900">
                ← Back to public site
              </Link>
            </p>
          </div>

          {showReference ? (
            <RoleTestAccountsReference onSelectStaff={fillStaffLogin} compact />
          ) : null}
        </div>
      </main>
    </div>
  );
}

export function RoleTestAccountsReference({
  onSelectStaff,
  compact = false,
}: {
  onSelectStaff?: (email: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/95 p-6 text-zinc-900 shadow-xl sm:p-8">
      <h2 className="text-lg font-semibold text-teal-950">Role test accounts</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Use these accounts to see what each role can access. Staff password:{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">{STAFF_DEMO_PASSWORD}</code> · Panelist password:{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">DemoPass1!</code>
      </p>

      <div className="mt-5 overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50 text-[11px] font-semibold text-zinc-600">
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Login</th>
              {!compact ? <th className="px-4 py-3 font-semibold">Access</th> : null}
              {onSelectStaff ? <th className="px-4 py-3 font-semibold">Use</th> : null}
            </tr>
          </thead>
          <tbody>
            {STAFF_LOGIN_ROWS.map((row) => (
              <tr key={row.email} className="border-b border-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">{STAFF_ROLE_LABELS[row.role]}</td>
                <td className="px-4 py-3 text-zinc-700">
                  <div>{row.email}</div>
                </td>
                {!compact ? (
                  <td className="px-4 py-3 text-zinc-600">{STAFF_ROLE_DESCRIPTIONS[row.role]}</td>
                ) : null}
                {onSelectStaff ? (
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSelectStaff(row.email)}
                      className="text-sm font-semibold text-teal-700 hover:text-teal-900"
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
        <h3 className="text-sm font-semibold text-teal-950">Panelist personas</h3>
        <p className="mt-1 text-xs text-zinc-500">Sign in at the public panelist login page.</p>
        <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-200">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-[11px] font-semibold text-zinc-600">
                <th className="px-4 py-3 font-semibold">Persona</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                {!compact ? <th className="px-4 py-3 font-semibold">What you can access</th> : null}
              </tr>
            </thead>
            <tbody>
              {PANELIST_LOGIN_ROWS.map((row) => (
                <tr key={row.email} className="border-b border-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">{row.label}</td>
                  <td className="px-4 py-3 text-zinc-700">{row.email}</td>
                  {!compact ? <td className="px-4 py-3 text-zinc-600">{row.access}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-zinc-600">
          <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-900">
            Open panelist login →
          </Link>
        </p>
      </div>
    </div>
  );
}

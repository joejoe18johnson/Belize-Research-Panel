"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrpLogoLink } from "@/components/BrpLogo";
import { RoleTestAccountsReference } from "@/components/admin/RoleTestAccountsReference";
import { isDemoAccountsEnabled } from "@/lib/demo-accounts";
import { STAFF_DEMO_PASSWORD } from "@/lib/demo-staff-users";
import { formatHeadingCase } from "@/lib/sentence-case";

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
          <div className="rounded-2xl border border-white/10 bg-white/95 p-6 text-zinc-900 dark:text-zinc-100 shadow-xl sm:p-8">
            <p className="text-xs font-semibold tracking-[0.14em] text-teal-700">
              {formatHeadingCase("Admin access")}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-teal-950 dark:text-teal-100">{formatHeadingCase("Staff login")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
              Sign in with a staff email and password. Each role only sees the admin modules assigned to that role.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="admin-email" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Staff email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="name.role@belizepanel.test"
                  className="mt-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="mt-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2.5 text-sm"
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
            <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
              Legacy fallback: leave email blank and use the shared <code>ADMIN_PASSWORD</code> env value for super
              admin access.
            </p>
            <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
              <Link href="/" className="font-medium text-teal-700 hover:text-teal-900 dark:text-teal-100">
                ← Back to public site
              </Link>
            </p>
          </div>

          {showReference ? <RoleTestAccountsReference onSelectStaff={fillStaffLogin} compact /> : null}
        </div>
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BrpLogoLink } from "@/components/BrpLogo";
import { ThemeIconButton } from "@/components/theme/ThemeToggle";
import { formatHeadingCase } from "@/lib/sentence-case";

export function ClientLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/client/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; redirectTo?: string };
      if (!res.ok) {
        setError(data.message ?? "Invalid email or password.");
        return;
      }
      const next = searchParams.get("next");
      router.push(next && next.startsWith("/client") ? next : data.redirectTo ?? "/client");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen min-w-0 w-full max-w-full flex-col overflow-x-clip bg-[linear-gradient(180deg,#f0fdfa_0%,#f4f4f5_14rem,#f4f4f5_100%)] dark:bg-[linear-gradient(180deg,#042f2e_0%,#09090b_14rem,#09090b_100%)]">
      <header className="safe-top shrink-0 border-b border-teal-100 bg-white/95 shadow-sm dark:border-teal-900/50 dark:bg-zinc-900/95">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 py-4">
            <BrpLogoLink href="/" variant="light" />
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300">
                <span className="lg:hidden">{formatHeadingCase("Login")}</span>
                <span className="hidden lg:inline">{formatHeadingCase("Panelist login")}</span>
              </Link>
              <ThemeIconButton />
            </div>
          </div>
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center sm:px-6">
        <div className="w-full max-w-lg lg:max-w-xl">
          <div className="rounded-2xl border border-teal-100 bg-white p-6 shadow-sm dark:border-teal-900/50 dark:bg-zinc-900 sm:p-8">
            <p className="text-xs font-semibold tracking-[0.14em] text-teal-700">{formatHeadingCase("Client portal")}</p>
            <h1 className="mt-2 text-2xl font-bold text-teal-950 dark:text-teal-100">
              {formatHeadingCase("Research results login")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Sign in to review fieldwork metrics, sample profiles, and survey findings for your commissioned studies.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="client-email" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Client email
                </label>
                <input
                  id="client-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>
              <div>
                <label htmlFor="client-password" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Password
                </label>
                <input
                  id="client-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
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
                {submitting ? "Signing in…" : "View my campaigns"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

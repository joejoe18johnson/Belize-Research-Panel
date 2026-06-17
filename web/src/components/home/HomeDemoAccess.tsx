"use client";

import Link from "next/link";
import { useState } from "react";
import {
  DEMO_ACCOUNT_PASSWORD,
  DEMO_ADMIN_ACCOUNT,
  isDemoAccountsEnabled,
} from "@/lib/demo-accounts";
import { formatHeadingCase } from "@/lib/sentence-case";

export function HomeDemoAccess() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isDemoAccountsEnabled()) return null;

  const loginAsAdmin = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: DEMO_ADMIN_ACCOUNT.email,
          password: DEMO_ACCOUNT_PASSWORD,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };

      if (!res.ok) {
        setError(data.message ?? "Could not sign in with the demo account.");
        return;
      }

      window.location.assign("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-14 rounded-2xl border border-amber-300/40 bg-amber-400/10 p-5 sm:mt-16 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
            {formatHeadingCase("Testing access")}
          </p>
          <h2 className="mt-2 text-lg font-bold text-white sm:text-xl">
            {formatHeadingCase("Admin demo login")}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-amber-50/90">
            Use the full-access demo account to explore the branded panelist dashboard — verified profile,
            surveys, rewards, and verification center.
          </p>
          <dl className="mt-4 space-y-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-teal-50">
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-amber-100">Email</dt>
              <dd className="font-mono text-white">{DEMO_ADMIN_ACCOUNT.email}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-amber-100">Password</dt>
              <dd className="font-mono text-white">{DEMO_ACCOUNT_PASSWORD}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-amber-100">Profile</dt>
              <dd>
                {DEMO_ADMIN_ACCOUNT.firstName} {DEMO_ADMIN_ACCOUNT.lastName} · verified · 2,800 pts earned
              </dd>
            </div>
          </dl>
          {error ? (
            <p className="mt-3 text-sm text-red-200" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[12rem]">
          <button
            type="button"
            disabled={submitting}
            onClick={loginAsAdmin}
            className="flex min-h-12 items-center justify-center rounded-xl bg-amber-400 px-5 text-sm font-semibold text-teal-950 shadow-lg transition hover:bg-amber-300 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Log in as admin demo"}
          </button>
          <Link
            href={`/login?email=${encodeURIComponent(DEMO_ADMIN_ACCOUNT.email)}`}
            className="flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {formatHeadingCase("Open login form")}
          </Link>
        </div>
      </div>
    </section>
  );
}

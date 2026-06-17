"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrpLogoLink } from "@/components/BrpLogo";
import { formatHeadingCase } from "@/lib/sentence-case";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok) {
        setError(data.message ?? "Invalid admin password.");
        return;
      }
      router.push("/admin/dashboard");
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
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/95 p-6 text-zinc-900 shadow-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
            {formatHeadingCase("Admin access")}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-teal-950">{formatHeadingCase("Admin dashboard login")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Enter the admin password to access panel management.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-zinc-800">
                Admin password
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
              {submitting ? "Signing in…" : "Enter admin dashboard"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-600">
            <Link href="/" className="font-medium text-teal-700 hover:text-teal-900">
              ← Back to public site
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

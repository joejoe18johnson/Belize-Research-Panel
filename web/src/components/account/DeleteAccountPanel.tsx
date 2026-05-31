"use client";

import { useState } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { DashboardCard } from "@/components/dashboard/DashboardShell";
import { formatHeadingCase } from "@/lib/sentence-case";

export function DeleteAccountPanel({ compact = false }: { compact?: boolean }) {
  const [password, setPassword] = useState("");
  const [confirmOptOut, setConfirmOptOut] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password, confirmOptOut }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };

      if (!res.ok || !data.ok) {
        setError(data.message ?? "Could not delete your account. Please try again.");
        return;
      }

      window.location.assign("/?accountDeleted=1");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <>
      <p className="text-sm leading-relaxed text-zinc-600">
        {formatHeadingCase(
          "You can delete your account and opt out of the Belize Research Panel at any time. This removes your login, withdraws panel membership, and anonymises personal data we are not required to retain."
        )}
      </p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-zinc-600">
        <li>{formatHeadingCase("Your account login will be permanently removed")}</li>
        <li>{formatHeadingCase("You will stop receiving research invitations")}</li>
        <li>{formatHeadingCase("Profile and contact details will be anonymised or deleted")}</li>
        <li>{formatHeadingCase("Pending rewards or redemption requests may be cancelled")}</li>
      </ul>

      <div className="mt-5 space-y-4">
        <label className="flex items-start gap-3 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={confirmOptOut}
            onChange={(event) => setConfirmOptOut(event.target.checked)}
            className="site-checkbox mt-0.5"
          />
          <span>
            {formatHeadingCase(
              "I understand this permanently deletes my account, opts me out of the panel, and cannot be undone."
            )}
          </span>
        </label>

        <div>
          <label htmlFor="delete-account-password" className="mb-1.5 block text-sm font-medium text-zinc-800">
            {formatHeadingCase("Confirm your password")}
          </label>
          <PasswordInput
            id="delete-account-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

        <button
          type="button"
          onClick={handleDelete}
          disabled={submitting || !confirmOptOut || !password.trim()}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-red-300 bg-red-50 px-4 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {submitting ? formatHeadingCase("Deleting account…") : formatHeadingCase("Delete account and opt out")}
        </button>
      </div>
    </>
  );

  if (compact) {
    return <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5">{content}</div>;
  }

  return (
    <DashboardCard className="border-red-200">
      <h3 className="text-base font-semibold text-zinc-900">{formatHeadingCase("Delete account and opt out")}</h3>
      <div className="mt-4">{content}</div>
    </DashboardCard>
  );
}

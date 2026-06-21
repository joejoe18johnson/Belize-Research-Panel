"use client";

import Link from "next/link";
import { useState } from "react";
import { formatHeadingCase } from "@/lib/sentence-case";
import type { FieldErrors } from "@/lib/validation";
import { validEmail } from "@/lib/validation";

export function AdminForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    const nextErrors: FieldErrors = {};
    if (!normalizedEmail) nextErrors.email = "Staff email is required.";
    else if (!validEmail(normalizedEmail)) nextErrors.email = "Please enter a valid email address.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; errors?: FieldErrors };

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setErrors({ submit: data.message ?? "Could not send reset link." });
        return;
      }

      setSent(true);
      setMessage(
        data.message ??
          "If an active staff account exists for that email address, we sent a password reset link."
      );
    } catch {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{message}</p>
        <Link
          href="/admin/login"
          className="flex min-h-11 w-full items-center justify-center rounded-xl bg-teal-700 text-sm font-semibold text-white hover:bg-teal-800"
        >
          {formatHeadingCase("Back to staff login")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="admin-forgot-email" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Staff email
        </label>
        <input
          id="admin-forgot-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        {errors.email ? (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.email}
          </p>
        ) : null}
      </div>

      {errors.submit ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {errors.submit}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="flex min-h-11 w-full items-center justify-center rounded-xl bg-teal-700 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {submitting ? formatHeadingCase("Sending link…") : formatHeadingCase("Send reset link")}
      </button>
    </form>
  );
}

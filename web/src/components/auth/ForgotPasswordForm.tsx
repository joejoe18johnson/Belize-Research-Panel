"use client";

import Link from "next/link";
import { useState } from "react";
import { Field, TextInput } from "@/components/registration/form-ui";
import { formatSiteCase } from "@/lib/sentence-case";
import type { FieldErrors } from "@/lib/validation";
import { validEmail } from "@/lib/validation";

export function ForgotPasswordForm() {
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
    if (!normalizedEmail) nextErrors.email = "Email address is required.";
    else if (!validEmail(normalizedEmail)) nextErrors.email = "Please enter a valid email address.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
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
          "If an account exists for that email address, we sent a password reset link. Check your inbox and spam folder."
      );
    } catch {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{formatSiteCase(message)}</p>
        <Link
          href="/login"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          {formatSiteCase("Back to login")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Field label="Email address" required error={errors.email} id="email">
        <TextInput
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          autoComplete="email"
        />
      </Field>

      {errors.submit ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {formatSiteCase(errors.submit)}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500"
      >
        {submitting ? formatSiteCase("Sending link…") : formatSiteCase("Send reset link")}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/login" className="font-medium text-teal-700 hover:text-teal-900 dark:text-teal-300">
          {formatSiteCase("Back to login")}
        </Link>
      </p>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatHeadingCase } from "@/lib/sentence-case";
import { validateStaffPasswordResetForm } from "@/lib/password-reset-validation";
import type { FieldErrors } from "@/lib/validation";

export function AdminResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});

    const validationErrors = validateStaffPasswordResetForm({ password, confirmPassword });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        redirectTo?: string;
        errors?: FieldErrors;
        message?: string;
      };

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setErrors({ submit: data.message ?? "Could not reset password." });
        return;
      }

      router.push(data.redirectTo ?? "/admin/dashboard");
      router.refresh();
    } catch {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="admin-new-password" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          New password
        </label>
        <input
          id="admin-new-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        {errors.password ? (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.password}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">At least 8 characters.</p>
        )}
      </div>

      <div>
        <label
          htmlFor="admin-confirm-password"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Confirm new password
        </label>
        <input
          id="admin-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        {errors.confirmPassword ? (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {errors.confirmPassword}
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
        {submitting ? formatHeadingCase("Updating password…") : formatHeadingCase("Update password")}
      </button>
    </form>
  );
}

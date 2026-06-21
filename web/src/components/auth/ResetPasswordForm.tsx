"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordMatchStatus } from "@/components/auth/PasswordMatchStatus";
import { Field } from "@/components/registration/form-ui";
import { PasswordStrengthBar } from "@/components/registration/PasswordStrengthBar";
import { validatePasswordResetForm } from "@/lib/password-reset-validation";
import { formatSiteCase } from "@/lib/sentence-case";
import { passwordStrength, type FieldErrors } from "@/lib/validation";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const pwdStrength = useMemo(() => passwordStrength(password), [password]);
  const confirmPasswordError =
    errors.confirmPassword ??
    (confirmPasswordTouched || confirmPassword
      ? validatePasswordResetForm({ password, confirmPassword }).confirmPassword
      : undefined);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});

    const validationErrors = validatePasswordResetForm({ password, confirmPassword });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        account?: { emailVerified: boolean; panelistRegistered: boolean; accountStatus?: string };
        errors?: FieldErrors;
        message?: string;
      };

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setErrors({ submit: data.message ?? "Could not reset password." });
        return;
      }

      setDone(true);

      if (!data.account?.emailVerified) {
        window.location.assign("/signup/check-email");
        return;
      }
      if (data.account.accountStatus === "on_hold") {
        window.location.assign("/dashboard/account-on-hold");
        return;
      }
      window.location.assign(data.account.panelistRegistered ? "/dashboard" : "/register");
    } catch {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{formatSiteCase("Password updated. Redirecting…")}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Field label="New password" required error={errors.password} id="password">
        <PasswordInput
          id="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />
      </Field>

      <PasswordStrengthBar strength={pwdStrength} />

      <Field label="Confirm new password" required error={confirmPasswordError} id="confirmPassword">
        <PasswordInput
          id="confirmPassword"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          onBlur={() => setConfirmPasswordTouched(true)}
          error={confirmPasswordError}
          autoComplete="new-password"
        />
      </Field>

      <PasswordMatchStatus
        password={password}
        confirmPassword={confirmPassword}
        show={confirmPasswordTouched || Boolean(confirmPassword)}
      />

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
        {submitting ? formatSiteCase("Updating password…") : formatSiteCase("Update password")}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/login" className="font-medium text-teal-700 hover:text-teal-900 dark:text-teal-300">
          {formatSiteCase("Back to login")}
        </Link>
      </p>
    </form>
  );
}

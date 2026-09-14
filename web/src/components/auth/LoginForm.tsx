"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AuthMethodDivider, FacebookAuthButton } from "@/components/auth/FacebookAuthButton";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useAuthCopy, useLocale } from "@/components/locale/LocaleProvider";
import { Field, TextInput } from "@/components/registration/form-ui";
import type { FieldErrors } from "@/lib/validation";
import { localizeFieldErrors, localizeValidationMessage } from "@/lib/validation-i18n";

export function LoginForm({
  nextPath = "/register",
  initialEmail = "",
}: {
  nextPath?: string;
  initialEmail?: string;
}) {
  const copy = useAuthCopy();
  const locale = useLocale();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const tError = (message?: string) =>
    message ? localizeValidationMessage(message, locale) : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const normalizedEmail = email.trim();
      const normalizedPassword = (password || passwordRef.current?.value || "").trim();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        account?: {
          emailVerified: boolean;
          panelistRegistered: boolean;
          accountStatus?: string;
        };
        errors?: FieldErrors;
        message?: string;
      };

      if (!res.ok) {
        if (data.errors) setErrors(localizeFieldErrors(data.errors, locale));
        else setErrors({ submit: localizeValidationMessage(data.message ?? "Login failed.", locale) });
        return;
      }

      if (!data.account?.emailVerified) {
        const params = new URLSearchParams({ email: normalizedEmail, next: nextPath });
        window.location.assign(`/signup/check-email?${params.toString()}`);
        return;
      }

      if (data.account.accountStatus === "on_hold") {
        window.location.assign("/dashboard/account-on-hold");
        return;
      }

      window.location.assign(data.account.panelistRegistered ? nextPath : "/register");
    } catch {
      setErrors({ submit: localizeValidationMessage("Network error. Please try again.", locale) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <FacebookAuthButton nextPath={nextPath} mode="login" />
      <AuthMethodDivider />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label={copy.loginEmail} required error={tError(errors.email)} id="email">
          <TextInput
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={tError(errors.email)}
            autoComplete="email"
          />
        </Field>

        <Field label={copy.loginPassword} required error={tError(errors.password)} id="password">
          <PasswordInput
            id="password"
            ref={passwordRef}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={tError(errors.password)}
            autoComplete="current-password"
          />
        </Field>

        <p className="-mt-2 text-right text-sm">
          <Link href="/forgot-password" className="font-medium text-teal-700 hover:text-teal-900 dark:text-teal-300">
            {copy.forgotPassword}
          </Link>
        </p>

        {errors.submit ? (
          <p className="text-sm text-red-600" role="alert">
            {tError(errors.submit)}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {submitting ? copy.loggingIn : copy.loginSubmit}
        </button>

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
          {copy.noAccount}{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(nextPath)}`}
            className="font-medium text-teal-700 hover:text-teal-900 dark:text-teal-100"
          >
            {copy.signUp}
          </Link>
        </p>
      </form>
    </div>
  );
}

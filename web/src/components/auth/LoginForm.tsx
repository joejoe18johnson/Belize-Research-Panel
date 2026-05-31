"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { DEMO_ACCOUNT_PASSWORD, DEMO_REGISTERED_ACCOUNT, DEMO_REGISTRATION_READY_ACCOUNT, DEMO_UNVERIFIED_REGISTERED_ACCOUNT } from "@/lib/demo-accounts";
import { Field, TextInput } from "@/components/registration/form-ui";
import { PasswordInput } from "@/components/auth/PasswordInput";
import type { FieldErrors } from "@/lib/validation";

export function LoginForm({ nextPath = "/register" }: { nextPath?: string }) {
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_ACCOUNT_PASSWORD);
    setErrors({});
  };

  const loginWithDemo = async (demoEmail: string) => {
    setSubmitting(true);
    setErrors({});
    fillDemo(demoEmail);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: demoEmail, password: DEMO_ACCOUNT_PASSWORD }),
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
        if (data.errors) setErrors(data.errors);
        else setErrors({ submit: data.message ?? "Login failed." });
        return;
      }

      if (!data.account?.emailVerified) {
        const params = new URLSearchParams({ email: demoEmail, next: nextPath });
        window.location.assign(`/signup/check-email?${params.toString()}`);
        return;
      }

      if (data.account.accountStatus === "on_hold") {
        window.location.assign("/dashboard/account-on-hold");
        return;
      }

      window.location.assign(data.account.panelistRegistered ? "/dashboard" : nextPath);
    } catch {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

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
        if (data.errors) setErrors(data.errors);
        else setErrors({ submit: data.message ?? "Login failed." });
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

      window.location.assign(data.account.panelistRegistered ? "/dashboard" : nextPath);
    } catch {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Field label="Email address" required error={errors.email} id="email">
        <TextInput
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />
      </Field>

      <Field label="Password" required error={errors.password} id="password">
        <PasswordInput
          id="password"
          ref={passwordRef}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
        />
      </Field>

      {errors.submit ? <p className="text-sm text-red-600" role="alert">{errors.submit}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
      >
        {submitting ? "Signing in…" : "Log in"}
      </button>

      <p className="text-center text-sm text-zinc-600">
        Need an account?{" "}
        <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="font-medium text-teal-700 hover:text-teal-900">
          Create account
        </Link>
      </p>

      {process.env.NODE_ENV !== "production" ? (
        <div className="space-y-2 text-center text-xs text-zinc-500">
          <p>
            Dev:{" "}
            <button
              type="button"
              disabled={submitting}
              className="font-medium text-teal-700 hover:text-teal-900 disabled:opacity-60"
              onClick={() => loginWithDemo(DEMO_REGISTRATION_READY_ACCOUNT.email)}
            >
              Log in as registration demo
            </button>
            {" "}(verified, ready to register)
          </p>
          <p>
            Dev:{" "}
            <button
              type="button"
              disabled={submitting}
              className="font-medium text-teal-700 hover:text-teal-900 disabled:opacity-60"
              onClick={() => loginWithDemo(DEMO_REGISTERED_ACCOUNT.email)}
            >
              Log in as registered demo
            </button>
            {" "}(verified, dashboard ready)
          </p>
          <p>
            Dev:{" "}
            <button
              type="button"
              disabled={submitting}
              className="font-medium text-teal-700 hover:text-teal-900 disabled:opacity-60"
              onClick={() => loginWithDemo(DEMO_UNVERIFIED_REGISTERED_ACCOUNT.email)}
            >
              Log in as unverified demo
            </button>
            {" "}(registered, pending verification)
          </p>
          <p className="text-[11px] leading-relaxed text-zinc-400">
            {DEMO_REGISTERED_ACCOUNT.email} · {DEMO_UNVERIFIED_REGISTERED_ACCOUNT.email} · {DEMO_ACCOUNT_PASSWORD}
          </p>
        </div>
      ) : null}
    </form>
  );
}

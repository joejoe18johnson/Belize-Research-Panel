"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { AUTH_COPY } from "@/lib/auth-locale";
import {
  readStoredHomeLocale,
  storeHomeLocale,
  type HomeLocale,
} from "@/lib/home-locale";

type VerifyState =
  | { kind: "verified" }
  | { kind: "email-change" }
  | { kind: "missing" }
  | { kind: "expired" }
  | { kind: "failed" }
  | { kind: "default" };

export function VerifyEmailClient({ state }: { state: VerifyState }) {
  const [locale, setLocale] = useState<HomeLocale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredHomeLocale();
    setLocale(stored);
    document.documentElement.lang = stored;
    setReady(true);
  }, []);

  if (!ready) return null;

  const copy = AUTH_COPY[locale];
  const shellProps = {
    locale,
    onLocaleChange: (next: HomeLocale) => {
      storeHomeLocale(next);
      setLocale(next);
    },
    formatTitle: false as const,
  };

  if (state.kind === "verified") {
    return (
      <AuthPageShell
        {...shellProps}
        title={copy.verifySuccessTitle}
        subtitle={copy.verifySuccessSubtitle}
      >
        <div className="flex flex-col gap-3">
          <Link
            href="/login?next=/register&verified=1"
            className="rounded-xl bg-teal-700 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-800"
          >
            {copy.logIn}
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-zinc-300 px-5 py-2.5 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {copy.backToHome}
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  if (state.kind === "email-change") {
    return (
      <AuthPageShell
        {...shellProps}
        title={copy.verifyAdminTitle}
        subtitle={copy.verifyAdminSubtitle}
      >
        <Link
          href="/dashboard/account-on-hold"
          className="inline-block rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
        >
          {copy.viewAccountStatus}
        </Link>
      </AuthPageShell>
    );
  }

  if (state.kind === "missing") {
    return (
      <AuthPageShell
        {...shellProps}
        title={copy.verifyMissingTitle}
        subtitle={copy.verifyMissingSubtitle}
      >
        <Link
          href="/signup"
          className="inline-block rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
        >
          {copy.createAccount}
        </Link>
      </AuthPageShell>
    );
  }

  if (state.kind === "expired") {
    return (
      <AuthPageShell
        {...shellProps}
        title={copy.verifyExpiredTitle}
        subtitle={copy.verifyExpiredSubtitle}
      >
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-teal-700 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-800"
          >
            {copy.logIn}
          </Link>
          <Link
            href="/signup"
            className="rounded-xl border border-zinc-300 px-5 py-2.5 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950"
          >
            {copy.createNewAccount}
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  if (state.kind === "failed") {
    return (
      <AuthPageShell
        {...shellProps}
        title={copy.verifyFailedTitle}
        subtitle={copy.verifyFailedSubtitle}
      >
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="rounded-xl bg-teal-700 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-800"
          >
            {copy.logIn}
          </Link>
          <Link
            href="/signup"
            className="rounded-xl border border-zinc-300 px-5 py-2.5 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950"
          >
            {copy.createAccount}
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      {...shellProps}
      title={copy.verifyDefaultTitle}
      subtitle={copy.verifyDefaultSubtitle}
    >
      <div className="flex flex-col gap-3">
        <Link
          href="/signup/check-email"
          className="rounded-xl bg-teal-700 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-800"
        >
          {copy.goToVerificationHelp}
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-zinc-300 px-5 py-2.5 text-center text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950"
        >
          {copy.logIn}
        </Link>
      </div>
    </AuthPageShell>
  );
}

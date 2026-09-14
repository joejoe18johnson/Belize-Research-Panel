"use client";

import { useEffect, useState } from "react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { SignedInBanner } from "@/components/auth/SignedInBanner";
import { SignupForm } from "@/components/auth/SignupForm";
import type { SessionAccount } from "@/lib/auth-types";
import {
  readStoredHomeLocale,
  storeHomeLocale,
  type HomeLocale,
} from "@/lib/home-locale";
import { SIGNUP_COPY } from "@/lib/signup-locale";

export function SignupPageClient({
  account,
  destination,
}: {
  account: SessionAccount | null;
  destination: string;
}) {
  const [locale, setLocale] = useState<HomeLocale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredHomeLocale();
    setLocale(stored);
    document.documentElement.lang = stored;
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  const copy = SIGNUP_COPY[locale];

  return (
    <AuthPageShell
      locale={locale}
      onLocaleChange={(next) => {
        storeHomeLocale(next);
        setLocale(next);
      }}
      formatTitle={false}
      title={copy.pageTitle}
      subtitle={copy.pageSubtitle}
    >
      {account ? <SignedInBanner account={account} nextPath={destination} /> : null}
      <SignupForm nextPath={destination} />
    </AuthPageShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignedInBanner } from "@/components/auth/SignedInBanner";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { AUTH_COPY } from "@/lib/auth-locale";
import type { SessionAccount } from "@/lib/auth-types";
import {
  readStoredHomeLocale,
  storeHomeLocale,
  type HomeLocale,
} from "@/lib/home-locale";

export function LoginPageClient({
  account,
  destination,
  initialEmail,
  verified,
}: {
  account: SessionAccount | null;
  destination: string;
  initialEmail: string;
  verified: boolean;
}) {
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

  return (
    <AuthPageShell
      locale={locale}
      onLocaleChange={(next) => {
        storeHomeLocale(next);
        setLocale(next);
      }}
      formatTitle={false}
      title={copy.loginPageTitle}
      subtitle={copy.loginPageSubtitle}
    >
      {verified ? (
        <BrandedAlert
          tone="success"
          title={copy.emailVerifiedBannerTitle}
          className="mb-6"
          showIcon
          formatBody={false}
        >
          {copy.emailVerifiedBannerBody}
        </BrandedAlert>
      ) : null}
      {account ? <SignedInBanner account={account} nextPath={destination} /> : null}
      <LoginForm nextPath={destination} initialEmail={initialEmail} />
    </AuthPageShell>
  );
}

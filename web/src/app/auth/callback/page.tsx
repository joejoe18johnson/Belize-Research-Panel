"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { AuthPageSkeleton } from "@/components/shared/PageSkeletons";
import { AUTH_COPY } from "@/lib/auth-locale";
import { FACEBOOK_ELIGIBILITY_STORAGE_KEY } from "@/lib/facebook-auth";
import {
  readStoredHomeLocale,
  storeHomeLocale,
  type HomeLocale,
} from "@/lib/home-locale";
import { safeAppNextPath } from "@/lib/login-redirect";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { localizeValidationMessage } from "@/lib/validation-i18n";

type EligibilityPayload = {
  citizenshipStatus?: string;
  commonwealthCountry?: string;
  dob?: string;
};

function AuthCallbackInner() {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [locale, setLocale] = useState<HomeLocale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredHomeLocale();
    setLocale(stored);
    document.documentElement.lang = stored;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    const finish = async () => {
      const nextPath = safeAppNextPath(searchParams.get("next") ?? "", "/dashboard");
      const code = searchParams.get("code");
      const oauthError = searchParams.get("error_description") || searchParams.get("error");

      if (oauthError) {
        setError(oauthError);
        return;
      }

      try {
        const supabase = getSupabaseBrowser();

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(exchangeError.message);
            return;
          }
        }

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session?.access_token) {
          setError(sessionError?.message || "Facebook session was not created. Try again.");
          return;
        }

        let eligibility: EligibilityPayload = {};
        try {
          const raw = sessionStorage.getItem(FACEBOOK_ELIGIBILITY_STORAGE_KEY);
          if (raw) {
            eligibility = JSON.parse(raw) as EligibilityPayload;
            sessionStorage.removeItem(FACEBOOK_ELIGIBILITY_STORAGE_KEY);
          }
        } catch {
          // ignore
        }

        const res = await fetch("/api/auth/facebook/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            accessToken: sessionData.session.access_token,
            ...eligibility,
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          message?: string;
          account?: {
            panelistRegistered?: boolean;
            accountStatus?: string;
          };
        };

        if (!res.ok || !data.ok) {
          setError(data.message ?? "Could not complete Facebook sign-in.");
          return;
        }

        if (cancelled) return;

        if (data.account?.accountStatus === "on_hold") {
          window.location.assign("/dashboard/account-on-hold");
          return;
        }

        if (data.account?.panelistRegistered) {
          window.location.assign(nextPath);
          return;
        }

        window.location.assign("/register");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Facebook sign-in failed.");
      }
    };

    void finish();
    return () => {
      cancelled = true;
    };
  }, [searchParams, ready]);

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
      title={copy.facebookPageTitle}
      subtitle={copy.facebookPageSubtitle}
    >
      {error ? (
        <BrandedAlert tone="error" title={copy.facebookCouldNotSignIn} showIcon formatBody={false}>
          <p>{localizeValidationMessage(error, locale)}</p>
          <p className="mt-2 text-sm">{copy.facebookSetupHelp}</p>
          <a href="/login" className="mt-3 inline-block font-semibold text-teal-800 underline">
            {copy.backToLogin}
          </a>
        </BrandedAlert>
      ) : (
        <BrandedAlert tone="info" title={copy.facebookPleaseWait} showIcon formatBody={false}>
          {copy.facebookFinishing}
        </BrandedAlert>
      )}
    </AuthPageShell>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <AuthCallbackInner />
    </Suspense>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { FACEBOOK_ELIGIBILITY_STORAGE_KEY } from "@/lib/facebook-auth";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { safeAppNextPath } from "@/lib/login-redirect";

type EligibilityPayload = {
  citizenshipStatus?: string;
  commonwealthCountry?: string;
  dob?: string;
};

function AuthCallbackInner() {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
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
  }, [searchParams]);

  return (
    <AuthPageShell title="Facebook sign-in" subtitle="Connecting your Facebook account to the Belize Research Panel.">
      {error ? (
        <BrandedAlert tone="error" title="Could not sign in with Facebook" showIcon>
          <p>{error}</p>
          <p className="mt-2 text-sm">
            If Meta / Facebook Login is still pending verification, finish setup in the Meta Developer Console and enable
            the Facebook provider in Supabase Auth, then try again.
          </p>
          <a href="/login" className="mt-3 inline-block font-semibold text-teal-800 underline">
            Back to login
          </a>
        </BrandedAlert>
      ) : (
        <BrandedAlert tone="info" title="Please wait" showIcon>
          Finishing Facebook sign-in…
        </BrandedAlert>
      )}
    </AuthPageShell>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthPageShell title="Facebook sign-in" subtitle="Connecting your Facebook account…">
          <BrandedAlert tone="info" title="Please wait" showIcon>
            Finishing Facebook sign-in…
          </BrandedAlert>
        </AuthPageShell>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import {
  FACEBOOK_ELIGIBILITY_STORAGE_KEY,
  isFacebookLoginConfigured,
} from "@/lib/facebook-auth";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { formatSiteCase } from "@/lib/sentence-case";

function FacebookGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 4.99 3.63 9.13 8.38 9.93v-7.02H7.9v-2.91h2.34V9.84c0-2.31 1.37-3.59 3.48-3.59.99 0 2.03.18 2.03.18v2.23h-1.14c-1.13 0-1.48.7-1.48 1.42v1.71h2.52l-.4 2.91h-2.12V22c4.75-.8 8.38-4.94 8.38-9.93Z" />
    </svg>
  );
}

export function FacebookAuthButton({
  nextPath = "/dashboard",
  mode = "login",
  eligibility,
  className = "",
}: {
  nextPath?: string;
  mode?: "login" | "signup";
  eligibility?: {
    citizenshipStatus?: string;
    commonwealthCountry?: string;
    dob?: string;
  };
  className?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const enabled = isFacebookLoginConfigured();

  const label =
    mode === "signup"
      ? submitting
        ? "Connecting Facebook…"
        : "Sign up with Facebook"
      : submitting
        ? "Connecting Facebook…"
        : "Continue with Facebook";

  const startFacebook = async () => {
    setError("");
    if (!enabled) {
      setError(
        "Facebook login will be available after Meta app verification and enabling Facebook in Supabase Auth."
      );
      return;
    }

    setSubmitting(true);
    try {
      if (eligibility) {
        sessionStorage.setItem(FACEBOOK_ELIGIBILITY_STORAGE_KEY, JSON.stringify(eligibility));
      } else {
        sessionStorage.removeItem(FACEBOOK_ELIGIBILITY_STORAGE_KEY);
      }

      const supabase = getSupabaseBrowser();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo,
          scopes: "email,public_profile",
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setSubmitting(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Facebook sign-in.");
      setSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={startFacebook}
        disabled={submitting}
        className="inline-flex w-full min-h-12 items-center justify-center gap-2.5 rounded-xl bg-[#1877F2] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#166FE5] disabled:opacity-60"
      >
        <FacebookGlyph />
        {formatSiteCase(label)}
      </button>
      {!enabled ? (
        <p className="mt-2 text-center text-xs text-zinc-500">
          Facebook sign-in is ready in the app. Enable the Facebook provider in Supabase after your Meta app is
          verified.
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-center text-sm text-red-600" role="alert">
          {formatSiteCase(error)}
        </p>
      ) : null}
    </div>
  );
}

export function AuthMethodDivider({ label = "or continue with email" }: { label?: string }) {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-wide">
        <span className="bg-white px-3 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
          {formatSiteCase(label)}
        </span>
      </div>
    </div>
  );
}

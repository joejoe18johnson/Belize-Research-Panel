"use client";

import { useState } from "react";
import { useAuthCopy, useLocale } from "@/components/locale/LocaleProvider";
import {
  GOOGLE_ELIGIBILITY_STORAGE_KEY,
  isGoogleLoginConfigured,
} from "@/lib/google-auth";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { localizeValidationMessage } from "@/lib/validation-i18n";
import { formatSiteCase } from "@/lib/sentence-case";

function GoogleGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.64Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.08.72-2.46 1.15-4.06 1.15-3.12 0-5.76-2.11-6.7-4.94H1.3v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3A7.2 7.2 0 0 1 4.92 12c0-.8.14-1.58.38-2.3V6.59H1.3A12 12 0 0 0 0 12c0 1.94.46 3.77 1.3 5.41l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.3 6.59l4 3.11C6.24 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}

export function GoogleAuthButton({
  nextPath = "/dashboard",
  mode = "login",
  eligibility,
  className = "",
  label: labelOverride,
  connectingLabel,
}: {
  nextPath?: string;
  mode?: "login" | "signup";
  eligibility?: {
    citizenshipStatus?: string;
    commonwealthCountry?: string;
    dob?: string;
  };
  className?: string;
  label?: string;
  connectingLabel?: string;
}) {
  const copy = useAuthCopy();
  const locale = useLocale();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const enabled = isGoogleLoginConfigured();

  const connecting = connectingLabel ?? copy.googleConnecting;
  const defaultIdle = mode === "signup" ? copy.googleSignup : copy.googleContinue;
  const label = labelOverride ?? (submitting ? connecting : defaultIdle);
  const displayLabel = submitting ? connecting : label;

  const startGoogle = async () => {
    setError("");
    if (!enabled) {
      setError(copy.googleNotEnabled);
      return;
    }

    setSubmitting(true);
    try {
      if (eligibility) {
        sessionStorage.setItem(GOOGLE_ELIGIBILITY_STORAGE_KEY, JSON.stringify(eligibility));
      } else {
        sessionStorage.removeItem(GOOGLE_ELIGIBILITY_STORAGE_KEY);
      }

      const supabase = getSupabaseBrowser();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}&provider=google`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (oauthError) {
        setError(localizeValidationMessage(oauthError.message, locale));
        setSubmitting(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : copy.googleCouldNotStart;
      setError(localizeValidationMessage(message, locale));
      setSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={startGoogle}
        disabled={submitting}
        className="inline-flex w-full min-h-12 items-center justify-center gap-2.5 rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
      >
        <GoogleGlyph />
        {locale === "en" ? formatSiteCase(displayLabel) : displayLabel}
      </button>
      {!enabled ? (
        <p className="mt-2 text-center text-xs text-zinc-500">{copy.googleReadyHint}</p>
      ) : null}
      {error ? (
        <p className="mt-2 text-center text-sm text-red-600" role="alert">
          {locale === "en" ? formatSiteCase(error) : error}
        </p>
      ) : null}
    </div>
  );
}

export function AuthMethodDivider({ label }: { label?: string }) {
  const copy = useAuthCopy();
  const locale = useLocale();
  const text = label ?? copy.orContinueWithEmail;

  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-wide">
        <span className="bg-white px-3 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
          {locale === "en" ? formatSiteCase(text) : text}
        </span>
      </div>
    </div>
  );
}

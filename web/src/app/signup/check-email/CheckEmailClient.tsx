"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { AUTH_COPY, type AuthCopy } from "@/lib/auth-locale";
import {
  readStoredHomeLocale,
  storeHomeLocale,
  type HomeLocale,
} from "@/lib/home-locale";
import { localizeValidationMessage } from "@/lib/validation-i18n";

export default function CheckEmailClient() {
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
      title={copy.checkEmailTitle}
      subtitle={copy.checkEmailSubtitle}
    >
      <CheckEmailBody copy={copy} locale={locale} />
    </AuthPageShell>
  );
}

function CheckEmailBody({ copy, locale }: { copy: AuthCopy; locale: HomeLocale }) {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const nextPath = searchParams.get("next") ?? "/register";
  const [verifyUrl, setVerifyUrl] = useState(searchParams.get("verifyUrl") ?? "");
  const [emailSent, setEmailSent] = useState(searchParams.get("emailSent") !== "0");
  const [emailError, setEmailError] = useState(searchParams.get("emailError") ?? "");
  const [resendMessage, setResendMessage] = useState("");
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    setResendMessage("");
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        alreadyVerified?: boolean;
        emailSent?: boolean;
        emailError?: string;
        verifyUrl?: string;
        message?: string;
      };
      if (data.alreadyVerified) {
        window.location.assign(nextPath);
        return;
      }
      if (!res.ok) {
        setResendMessage(
          localizeValidationMessage(data.message ?? copy.couldNotResend, locale)
        );
        return;
      }
      setEmailSent(Boolean(data.emailSent));
      setEmailError(data.emailError ?? "");
      if (data.verifyUrl) setVerifyUrl(data.verifyUrl);
      setResendMessage(
        localizeValidationMessage(data.message ?? copy.checkInboxNewLink, locale)
      );
    } catch {
      setResendMessage(localizeValidationMessage("Network error. Please try again.", locale));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
      <p>
        {emailSent ? copy.checkEmailSentPrefix : copy.checkEmailTriedPrefix} {copy.checkEmailTo}{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {email || copy.checkEmailYourAddress}
        </span>
        . {copy.checkEmailOpenLink}
      </p>
      <p>{copy.checkEmailAfterVerify}</p>

      {emailSent ? (
        <BrandedAlert tone="info" title={copy.checkInboxTitle} showIcon formatBody={false}>
          {copy.checkInboxBody}
        </BrandedAlert>
      ) : (
        <BrandedAlert tone="warning" title={copy.emailNotDeliveredTitle} showIcon formatBody={false}>
          {localizeValidationMessage(emailError || copy.emailNotDeliveredFallback, locale)}{" "}
          {copy.emailNotDeliveredHint}
        </BrandedAlert>
      )}

      {verifyUrl ? (
        <BrandedAlert tone="warning" title={copy.verifyOnSiteTitle} showIcon formatBody={false}>
          {copy.verifyOnSiteBody}
          <Link
            href={verifyUrl}
            className="mt-2 inline-block break-all font-medium text-teal-700 hover:text-teal-900 dark:text-teal-100"
          >
            {copy.confirmEmailAddress}
          </Link>
        </BrandedAlert>
      ) : null}

      {resendMessage ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{resendMessage}</p>
      ) : null}

      <div className="flex flex-col gap-3 pt-2">
        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={resending}
          className="rounded-xl border border-zinc-300 px-5 py-2.5 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {resending ? copy.sending : copy.resendVerification}
        </button>
        <Link
          href={`/login?next=${encodeURIComponent(nextPath)}`}
          className="rounded-xl bg-teal-700 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-800"
        >
          {copy.backToLogin}
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-zinc-300 px-5 py-2.5 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:bg-zinc-950"
        >
          {copy.backToHome}
        </Link>
      </div>
    </div>
  );
}

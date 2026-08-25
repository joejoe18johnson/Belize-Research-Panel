"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";

export default function CheckEmailClient() {
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
        setResendMessage(data.message ?? "Could not resend the email.");
        return;
      }
      setEmailSent(Boolean(data.emailSent));
      setEmailError(data.emailError ?? "");
      if (data.verifyUrl) setVerifyUrl(data.verifyUrl);
      setResendMessage(data.message ?? "Check your inbox for a new link.");
    } catch {
      setResendMessage("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthPageShell
      title="Verify your email"
      subtitle="Panelist registration is available once your email address is verified."
    >
      <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
        <p>
          We {emailSent ? "sent" : "tried to send"} a verification link to{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{email || "your email address"}</span>.
          Open that link to continue. The link expires after 24 hours.
        </p>
        <p>After verification, you can complete your panelist registration profile.</p>

        {emailSent ? (
          <BrandedAlert tone="info" title="Check your inbox" showIcon>
            Look in spam if you do not see it within a minute. Without a custom sending domain, Resend can only
            deliver to the email on your Resend account.
          </BrandedAlert>
        ) : (
          <BrandedAlert tone="warning" title="Email was not delivered" showIcon>
            {emailError || "The verification email could not be sent."} Use the on-site link below, or resend after
            signing up with your Resend account email.
          </BrandedAlert>
        )}

        {verifyUrl ? (
          <BrandedAlert tone="warning" title="Verify on this site" showIcon>
            This is the same confirmation as clicking the button in the email. It verifies your address on Belize
            Research Panel.
            <Link
              href={verifyUrl}
              className="mt-2 inline-block break-all font-medium text-teal-700 hover:text-teal-900 dark:text-teal-100"
            >
              Confirm email address
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
            {resending ? "Sending…" : "Resend verification email"}
          </button>
          <Link
            href={`/login?next=${encodeURIComponent(nextPath)}`}
            className="rounded-xl bg-teal-700 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-800"
          >
            Back to login
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-zinc-300 px-5 py-2.5 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:bg-zinc-950"
          >
            Back to home
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
}

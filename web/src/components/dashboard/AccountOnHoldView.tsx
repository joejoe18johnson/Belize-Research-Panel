import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import type { SessionAccount } from "@/lib/auth-types";
import { isDemoAccountsEnabled } from "@/lib/demo-accounts";
import { formatHeadingCase } from "@/lib/sentence-case";

export function AccountOnHoldView({ account }: { account: SessionAccount }) {
  const pendingEmail = account.pendingEmail;
  const pendingPhone = account.pendingPhone;
  const fraudReview = account.holdReason === "fraud_review";

  return (
    <div className="w-full space-y-6">
      <BrandedAlert
        tone="warning"
        title="Account on hold"
        className="rounded-2xl px-5 py-5 sm:px-6"
      >
        {fraudReview
          ? "Your panelist account is on hold while an administrator reviews a possible duplicate registration. Dashboard access, surveys, profile editing, and rewards are paused until the review is complete."
          : "Your panelist account is temporarily on hold while we verify a contact detail change. Dashboard access, surveys, and profile editing are paused until an administrator approves the update."}
      </BrandedAlert>

      <div className="space-y-4 rounded-2xl border border-teal-100 dark:border-teal-900/60 bg-white dark:bg-zinc-900 p-6 shadow-sm shadow-teal-950/5">
        <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("What is pending")}</h2>

        {fraudReview ? (
          <BrandedAlert tone="info" title="Duplicate review" compact showIcon>
            An administrator flagged this account for possible duplicate registration (same name, date of birth, or
            contact details). No action is required from you right now — we will notify you when the review is
            complete.
          </BrandedAlert>
        ) : null}

        {pendingEmail ? (
          <div className="rounded-xl border border-teal-100 dark:border-teal-900/60 bg-teal-50/40 px-4 py-3 text-sm">
            <p className="font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Email change")}</p>
            <p className="mt-1 text-teal-900/80">
              Requested address: <span className="font-medium text-teal-950 dark:text-teal-100">{pendingEmail}</span>
            </p>
            <p className="mt-2 text-teal-900/80">
              An administrator must approve this change before your account is reactivated. Your login email stays{" "}
              <span className="font-medium">{account.email}</span> until then.
            </p>
            {isDemoAccountsEnabled() ? (
              <p className="mt-2 text-xs text-teal-800/70">
                Dev: approve with{" "}
                <code className="rounded bg-teal-100 px-1 py-0.5">
                  POST /api/admin/approve-email-change
                </code>{" "}
                and body{" "}
                <code className="rounded bg-teal-100 px-1 py-0.5">{`{"email":"${account.email}"}`}</code>
              </p>
            ) : null}
          </div>
        ) : null}

        {pendingPhone ? (
          <div className="rounded-xl border border-teal-100 dark:border-teal-900/60 bg-teal-50/40 px-4 py-3 text-sm">
            <p className="font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Phone change")}</p>
            <p className="mt-1 text-teal-900/80">
              Requested number: <span className="font-medium text-teal-950 dark:text-teal-100">{pendingPhone}</span>
            </p>
            <p className="mt-2 text-teal-900/80">
              An administrator must approve this change before your account is reactivated. Current number on file
              remains active until then.
            </p>
            {isDemoAccountsEnabled() ? (
              <p className="mt-2 text-xs text-teal-800/70">
                Dev: approve with{" "}
                <code className="rounded bg-teal-100 px-1 py-0.5">
                  POST /api/admin/approve-phone-change
                </code>{" "}
                and body{" "}
                <code className="rounded bg-teal-100 px-1 py-0.5">{`{"email":"${account.email}"}`}</code>
              </p>
            ) : null}
          </div>
        ) : null}

        {!fraudReview && !pendingEmail && !pendingPhone ? (
          <BrandedAlert tone="info" compact showIcon>
            No pending contact changes were found. Try logging in again.
          </BrandedAlert>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/profile"
          className="rounded-xl border border-teal-200 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-semibold text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40"
        >
          Back to profile
        </Link>
        <LogoutButton className="rounded-xl border border-teal-200 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-semibold text-teal-800 dark:text-teal-200 shadow-sm hover:bg-teal-50 dark:hover:bg-teal-900/40" />
      </div>
    </div>
  );
}

import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { formatHeadingCase } from "@/lib/sentence-case";
import type { SessionAccount } from "@/lib/auth-types";

export function AccountOnHoldView({ account }: { account: SessionAccount }) {
  const pendingEmail = account.pendingEmail;
  const pendingPhone = account.pendingPhone;

  return (
    <div className="w-full space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-amber-950">{formatHeadingCase("Account on hold")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-amber-900">
          Your panelist account is temporarily on hold while we verify a contact detail change. Dashboard access,
          surveys, and profile editing are paused until an administrator approves the update.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-900">{formatHeadingCase("What is pending")}</h2>

        {pendingEmail ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
            <p className="font-semibold text-zinc-900">{formatHeadingCase("Email change")}</p>
            <p className="mt-1 text-zinc-600">
              Requested address: <span className="font-medium text-zinc-900">{pendingEmail}</span>
            </p>
            <p className="mt-2 text-zinc-600">
              An administrator must approve this change before your account is reactivated. Your login email stays{" "}
              <span className="font-medium">{account.email}</span> until then.
            </p>
            {process.env.NODE_ENV !== "production" ? (
              <p className="mt-2 text-xs text-zinc-500">
                Dev: approve with{" "}
                <code className="rounded bg-zinc-200 px-1 py-0.5">
                  POST /api/admin/approve-email-change
                </code>{" "}
                and body{" "}
                <code className="rounded bg-zinc-200 px-1 py-0.5">{`{"email":"${account.email}"}`}</code>
              </p>
            ) : null}
          </div>
        ) : null}

        {pendingPhone ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
            <p className="font-semibold text-zinc-900">{formatHeadingCase("Phone change")}</p>
            <p className="mt-1 text-zinc-600">
              Requested number: <span className="font-medium text-zinc-900">{pendingPhone}</span>
            </p>
            <p className="mt-2 text-zinc-600">
              An administrator must approve this change before your account is reactivated. Current number on file
              remains active until then.
            </p>
            {process.env.NODE_ENV !== "production" ? (
              <p className="mt-2 text-xs text-zinc-500">
                Dev: approve with{" "}
                <code className="rounded bg-zinc-200 px-1 py-0.5">
                  POST /api/admin/approve-phone-change
                </code>{" "}
                and body{" "}
                <code className="rounded bg-zinc-200 px-1 py-0.5">{`{"email":"${account.email}"}`}</code>
              </p>
            ) : null}
          </div>
        ) : null}

        {!pendingEmail && !pendingPhone ? (
          <p className="text-sm text-zinc-600">No pending contact changes were found. Try logging in again.</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/profile"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          Back to profile
        </Link>
        <LogoutButton className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50" />
      </div>
    </div>
  );
}

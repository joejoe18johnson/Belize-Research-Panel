"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";

export default function CheckEmailClient() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const nextPath = searchParams.get("next") ?? "/register";
  const verifyUrl = searchParams.get("verifyUrl") ?? "";

  return (
    <AuthPageShell
      title="Verify your email"
      subtitle="Panelist registration is available once your email address is verified."
    >
      <div className="space-y-4 text-sm text-zinc-700">
        <p>
          We sent a verification link to{" "}
          <span className="font-medium text-zinc-900">{email || "your email address"}</span>.
          Open the link in that message to continue.
        </p>
        <p>After verification, you can complete your panelist registration profile.</p>

        {verifyUrl ? (
          <BrandedAlert tone="warning" title="Development verification link" showIcon>
            Email delivery is not configured yet. Use this link to verify your account:{" "}
            <Link href={verifyUrl} className="mt-2 inline-block break-all font-medium text-teal-700 hover:text-teal-900">
              {verifyUrl}
            </Link>
          </BrandedAlert>
        ) : null}

        <div className="flex flex-col gap-3 pt-2">
          <Link
            href={`/login?next=${encodeURIComponent(nextPath)}`}
            className="rounded-xl bg-teal-700 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-800"
          >
            Back to login
          </Link>
          <Link href="/" className="rounded-xl border border-zinc-300 px-5 py-2.5 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50">
            Back to home
          </Link>
        </div>
      </div>
    </AuthPageShell>
  );
}

import Link from "next/link";
import type { VerificationCenterSummary } from "@/lib/panelist-verification";
import { ShieldCheckIcon } from "./DashboardIcons";
import { DashboardVerificationItems } from "./DashboardVerificationItems";
import { DashboardCard, SectionHeading } from "./DashboardShell";
import { formatHeadingCase } from "@/lib/sentence-case";

export function DashboardVerificationSection({ summary }: { summary: VerificationCenterSummary }) {
  return (
    <div className="space-y-6">
      <DashboardCard className="overflow-hidden border-teal-200 bg-gradient-to-br from-teal-50 via-white to-white p-0">
        <div className="overflow-hidden rounded-t-2xl border-b border-teal-100 bg-teal-700 px-5 py-5 text-white sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-teal-100">{formatHeadingCase("Verification center")}</p>
              <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{summary.overallStatus}</p>
              <p className="mt-2 text-sm text-teal-100/90">
                {summary.isVerified
                  ? formatHeadingCase("Your essential verification items have been approved.")
                  : formatHeadingCase(
                      "Our team is reviewing the items below from your registration. You will be notified when verification is complete."
                    )}
              </p>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <ShieldCheckIcon className="h-6 w-6" />
            </span>
          </div>
        </div>
        <div className="space-y-2 px-5 py-4 text-sm text-zinc-600 sm:px-6">
          <p>
            {formatHeadingCase("Submitted")}: {summary.registrationDate}
          </p>
          {!summary.isVerified ? (
            <p>
              {formatHeadingCase(
                "Phone number and photo ID are required for verification. Commonwealth citizens in Belize may also need proof of residence."
              )}
            </p>
          ) : null}
        </div>
      </DashboardCard>

      <DashboardVerificationItems items={summary.items} />

      {!summary.isVerified ? (
        <DashboardCard>
          <SectionHeading as="h3">{formatHeadingCase("Need to update something?")}</SectionHeading>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            {formatHeadingCase(
              "Contact details such as phone number can be updated from your profile. Photo ID changes require support from the panel team."
            )}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/profile"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              {formatHeadingCase("Go to profile")}
            </Link>
            <Link
              href="/dashboard/notifications"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              {formatHeadingCase("View notifications")}
            </Link>
          </div>
        </DashboardCard>
      ) : null}
    </div>
  );
}

import Link from "next/link";
import type { VerificationCenterSummary, VerificationItemStatus } from "@/lib/panelist-verification";
import { ShieldCheckIcon } from "./DashboardIcons";
import { DashboardCard, SectionHeading, StatusBadge } from "./DashboardShell";
import { formatHeadingCase } from "@/lib/sentence-case";

function itemStatusTone(status: VerificationItemStatus): "success" | "warning" | "default" {
  switch (status) {
    case "verified":
      return "success";
    case "under_review":
    case "pending_approval":
      return "warning";
    case "missing":
      return "default";
    default:
      return "default";
  }
}

function itemStatusClass(status: VerificationItemStatus): string {
  switch (status) {
    case "verified":
      return "border-emerald-200 bg-emerald-50/80";
    case "under_review":
    case "pending_approval":
      return "border-amber-200 bg-amber-50/70";
    case "missing":
      return "border-red-200 bg-red-50/80";
    default:
      return "border-zinc-200 bg-white";
  }
}

function VerificationItemIcon({ id }: { id: VerificationCenterSummary["items"][number]["id"] }) {
  if (id === "phone") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    );
  }

  if (id === "proof_of_residence") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
    </svg>
  );
}

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

      <div className="space-y-4">
        {summary.items.map((item) => (
          <DashboardCard key={item.id} className={itemStatusClass(item.status)}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-teal-800 shadow-sm">
                  <VerificationItemIcon id={item.id} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SectionHeading as="h3" className="text-base font-semibold text-zinc-900">
                      {item.label}
                    </SectionHeading>
                    {item.essential ? (
                      <span className="rounded-full bg-zinc-900/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
                        {formatHeadingCase("Essential")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">{item.description}</p>
                  <p className="mt-3 text-sm">
                    <span className="font-medium text-zinc-800">
                      {item.valueLabel ?? formatHeadingCase("On file")}:{" "}
                    </span>
                    <span className="text-zinc-700">{item.valueOnFile}</span>
                  </p>
                  {item.status === "pending_approval" ? (
                    <p className="mt-2 text-sm text-amber-900">
                      {formatHeadingCase(
                        "A phone number change is waiting for administrator approval before it can be verified."
                      )}
                    </p>
                  ) : null}
                  {item.status === "missing" ? (
                    <p className="mt-2 text-sm text-red-800">
                      {formatHeadingCase(
                        "This item is missing or incomplete. Update your profile or contact the panel team if you need help."
                      )}
                    </p>
                  ) : null}
                </div>
              </div>
              {item.status === "missing" ? (
                <span className="inline-flex shrink-0 items-center rounded-full border border-red-300 bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                  {item.statusLabel}
                </span>
              ) : (
                <StatusBadge label={item.statusLabel} tone={itemStatusTone(item.status)} />
              )}
            </div>
          </DashboardCard>
        ))}
      </div>

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

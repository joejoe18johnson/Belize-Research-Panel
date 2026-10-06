"use client";

import type { VerificationCenterSummary, VerificationItemStatus } from "@/lib/panelist-verification";
import type { ViewLayout } from "@/lib/view-layout";
import { viewLayoutContainerClass, viewLayoutItemClass } from "@/lib/view-layout";
import { ViewLayoutToggle, useViewLayout } from "@/components/shared/ViewLayoutToggle";
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
      return "border-emerald-300 bg-emerald-50/80 dark:border-emerald-700 dark:bg-emerald-950!";
    case "under_review":
    case "pending_approval":
      return "border-amber-300 bg-amber-50/70 dark:border-amber-700 dark:bg-amber-950!";
    case "missing":
    case "denied":
      return "border-red-300 bg-red-50/80 dark:border-red-800 dark:bg-red-950!";
    default:
      return "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900";
  }
}

function VerificationItemIcon({ id }: { id: VerificationCenterSummary["items"][number]["id"] }) {
  if (id === "email") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    );
  }

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

function VerificationItemCard({
  item,
  layout,
}: {
  item: VerificationCenterSummary["items"][number];
  layout: ViewLayout;
}) {
  const statusBadge =
    item.status === "missing" || item.status === "denied" ? (
      <span className="inline-flex shrink-0 items-center rounded-full border border-red-800 bg-red-200 px-3 py-1 text-xs font-semibold text-red-950">
        {item.statusLabel}
      </span>
    ) : (
      <StatusBadge label={item.statusLabel} tone={itemStatusTone(item.status)} />
    );

  if (layout === "list") {
    return (
      <DashboardCard className={`p-4 ${itemStatusClass(item.status)}`}>
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-900 shadow-sm dark:bg-zinc-800 dark:text-teal-100">
            <VerificationItemIcon id={item.id} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionHeading as="h3" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {item.label}
              </SectionHeading>
              {statusBadge}
            </div>
            <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
              <span className="font-medium">{item.valueLabel ?? formatHeadingCase("On file")}: </span>
              {item.valueOnFile}
            </p>
          </div>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard className={itemStatusClass(item.status)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-900 shadow-sm dark:bg-zinc-800 dark:text-teal-100">
            <VerificationItemIcon id={item.id} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <SectionHeading as="h3" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {item.label}
              </SectionHeading>
              {item.essential ? (
                <span className="rounded-full bg-zinc-900/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                  {formatHeadingCase("Essential")}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{item.description}</p>
            <p className="mt-3 text-sm">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {item.valueLabel ?? formatHeadingCase("On file")}:{" "}
              </span>
              <span className="text-zinc-700 dark:text-zinc-300">{item.valueOnFile}</span>
            </p>
            {item.status === "pending_approval" ? (
              <p className="mt-2 text-sm text-amber-950 dark:text-amber-100">
                {formatHeadingCase(
                  "A phone number change is waiting for administrator approval before it can be verified."
                )}
              </p>
            ) : null}
            {item.status === "denied" ? (
              <p className="mt-2 text-sm text-red-900 dark:text-red-100">
                {formatHeadingCase("This check was not approved. Contact the panel team if you need to submit it again.")}
              </p>
            ) : null}
            {item.status === "missing" ? (
              <p className="mt-2 text-sm text-red-900 dark:text-red-100">
                {formatHeadingCase(
                  "This item is missing or incomplete. Update your profile or contact the panel team if you need help."
                )}
              </p>
            ) : null}
          </div>
        </div>
        {statusBadge}
      </div>
    </DashboardCard>
  );
}

export function DashboardVerificationItems({ items }: { items: VerificationCenterSummary["items"] }) {
  const [layout, setLayout] = useViewLayout("dashboard-verification");

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ViewLayoutToggle value={layout} onChange={setLayout} />
      </div>
      <div className={viewLayoutContainerClass(layout, "space-y-4")}>
        {items.map((item) => (
          <div key={item.id} className={viewLayoutItemClass(layout)}>
            <VerificationItemCard item={item} layout={layout} />
          </div>
        ))}
      </div>
    </div>
  );
}

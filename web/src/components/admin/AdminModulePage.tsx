import Link from "next/link";
import type { ReactNode } from "react";
import type { AdminModule } from "@/lib/admin-modules";
import type { AdminModuleContent } from "@/lib/admin-module-content";
import { getMvpAlignment, portalStatusLabel } from "@/lib/admin-alignment";
import { formatHeadingCase } from "@/lib/sentence-case";

function statusTone(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes("live") || lower.includes("working")) {
    return "border-teal-300 bg-teal-50 text-teal-900 dark:text-teal-100";
  }
  if (lower.includes("partial") || lower.includes("streamlit")) {
    return "border-teal-200 bg-teal-50/80 text-teal-950 dark:text-teal-100";
  }
  return "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200";
}

function SectionBlock({ section }: { section: AdminModuleContent["sections"][number] }) {
  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase(section.title)}</h2>
      {section.body ? (
        <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{section.body}</p>
      ) : null}
      {section.bullets?.length ? (
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {section.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function AdminModulePage({
  module,
  content,
  livePanel,
}: {
  module: AdminModule;
  content: AdminModuleContent;
  livePanel?: ReactNode;
}) {
  const alignment = getMvpAlignment(module.slug);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="border-l-4 border-teal-600 pl-4">
        <h1 className="text-2xl font-bold text-teal-950 dark:text-teal-100 sm:text-3xl">{module.label}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{content.summary}</p>
      </div>

      {alignment ? (
        <div className="rounded-2xl border border-teal-100 dark:border-teal-900/60 bg-teal-50/60 px-5 py-4 text-sm text-teal-950 dark:text-teal-100">
          <p className="font-semibold">
            MVP alignment: {alignment.mvpOriginalStatus} → {portalStatusLabel(alignment.portalStatus)}
          </p>
          <p className="mt-2 leading-relaxed opacity-90">{alignment.rationale}</p>
        </div>
      ) : null}

      <div className={`rounded-2xl border px-5 py-4 text-sm ${statusTone(content.statusLabel)}`}>
        <p className="font-semibold">{content.statusLabel}</p>
        <p className="mt-2 leading-relaxed opacity-90">{content.statusDetail}</p>
      </div>

      {module.externalHref ? (
        <div className="flex flex-wrap gap-3">
          <Link
            href={module.externalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            {formatHeadingCase(`Open ${module.label.toLowerCase()}`)}
          </Link>
        </div>
      ) : null}

      {livePanel}

      {content.liveInPortal?.length ? (
        <section className="rounded-2xl border border-teal-100 dark:border-teal-900/60 bg-teal-50/50 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">
            {formatHeadingCase("Live in the panel portal")}
          </h2>
          <ul className="mt-4 space-y-3">
            {content.liveInPortal.map((item) => (
              <li key={item.label} className="rounded-xl border border-teal-100 dark:border-teal-900/60 bg-white dark:bg-zinc-900 px-4 py-3 text-sm">
                <p className="font-semibold text-teal-900 dark:text-teal-100">
                  {item.href ? (
                    <Link href={item.href} className="hover:underline">
                      {item.label}
                    </Link>
                  ) : (
                    item.label
                  )}
                </p>
                <p className="mt-1 leading-relaxed text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="space-y-4">
        {content.sections.map((section) => (
          <SectionBlock key={section.title} section={section} />
        ))}
      </div>

      {content.adminActions?.length ? (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">
            {formatHeadingCase("Admin actions available now")}
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {content.adminActions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {content.dataSources?.length ? (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Data sources")}</h2>
          <ul className="mt-3 space-y-1 font-mono text-xs text-zinc-700 dark:text-zinc-300">
            {content.dataSources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {content.plannedNext?.length ? (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Planned next")}</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {content.plannedNext.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {!module.externalHref ? (
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/admin/dashboard"
            className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
          >
            {formatHeadingCase("Open admin dashboard")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

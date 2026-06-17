import Link from "next/link";
import type { AdminModule } from "@/lib/admin-modules";
import { formatHeadingCase } from "@/lib/sentence-case";

export function AdminModulePlaceholder({ module }: { module: AdminModule }) {
  const statusLabel =
    module.status === "working"
      ? "Working MVP"
      : module.status === "mvp"
        ? "MVP / to refine later"
        : "Concept module";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="border-l-4 border-teal-600 pl-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Module placeholder</p>
        <h1 className="mt-1 text-2xl font-bold text-teal-950 sm:text-3xl">{module.label}</h1>
        <p className="mt-2 text-sm text-zinc-600">
          {formatHeadingCase(
            module.description ??
              "This module is defined in the Streamlit MVP sidebar and will be implemented in a later phase."
          )}
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
        <p className="font-semibold">Status: {statusLabel}</p>
        <p className="mt-2 leading-relaxed opacity-90">
          The Next.js admin console mirrors the MVP navigation structure. Working modules are linked from the sidebar;
          concept modules appear here until they are built out.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/dashboard"
          className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
        >
          {formatHeadingCase("Open admin dashboard")}
        </Link>
        <Link
          href="/admin/mvp-status"
          className="inline-flex min-h-11 items-center rounded-xl border border-teal-200 bg-white px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50"
        >
          {formatHeadingCase("View MVP checklist")}
        </Link>
      </div>
    </div>
  );
}

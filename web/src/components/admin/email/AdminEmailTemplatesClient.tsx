"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageIntro } from "@/components/admin/shared/AdminUi";
import type { EmailTemplateMeta } from "@/lib/email/email-templates";
import { EMAIL_TEMPLATE_CATEGORIES, listEmailTemplatesByCategory } from "@/lib/email/email-templates";
import { formatHeadingCase } from "@/lib/sentence-case";

function TemplatePreviewFrame({ templateId }: { templateId: string }) {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(`/api/admin/email-templates/${encodeURIComponent(templateId)}/preview`)
      .then(async (res) => {
        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as { message?: string } | null;
          throw new Error(payload?.message ?? "Could not load preview.");
        }
        return res.text();
      })
      .then((content) => {
        if (!cancelled) {
          setHtml(content);
          setLoading(false);
        }
      })
      .catch((fetchError: Error) => {
        if (!cancelled) {
          setError(fetchError.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [templateId]);

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-500 sm:min-h-[360px] lg:min-h-[420px] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        Loading preview…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 text-center text-sm text-red-700 sm:min-h-[360px] lg:min-h-[420px] dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
        {error}
      </div>
    );
  }

  return (
    <iframe
      title={`Email preview: ${templateId}`}
      srcDoc={html}
      className="min-h-[320px] w-full rounded-xl border border-zinc-200 bg-white sm:min-h-[400px] lg:min-h-[520px] dark:border-zinc-800"
      sandbox="allow-same-origin"
    />
  );
}

function TemplateList({
  grouped,
  selectedId,
  onSelect,
}: {
  grouped: ReturnType<typeof listEmailTemplatesByCategory>;
  selectedId: string;
  onSelect: (template: EmailTemplateMeta) => void;
}) {
  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <section
          key={group.category}
          className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{group.label}</h2>
          </div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {group.templates.map((template) => {
              const active = template.id === selectedId;
              return (
                <li key={template.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(template)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                      active
                        ? "bg-teal-50 dark:bg-teal-950/40"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {template.name}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                        {template.description}
                      </span>
                    </span>
                    <span
                      className="mt-0.5 shrink-0 text-zinc-400 lg:hidden dark:text-zinc-500"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function TemplatePreviewPanel({
  template,
  onBack,
  showBack,
}: {
  template: EmailTemplateMeta;
  onBack: () => void;
  showBack: boolean;
}) {
  return (
    <div className="min-w-0 space-y-4">
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 lg:hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          ← All templates
        </button>
      ) : null}

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {formatHeadingCase(template.name)}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{template.description}</p>
          </div>
          <code className="max-w-full shrink-0 break-all rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {template.id}
          </code>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Trigger</dt>
            <dd className="mt-1 break-all font-mono text-xs text-zinc-700 dark:text-zinc-300">{template.trigger}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Category</dt>
            <dd className="mt-1 text-zinc-700 dark:text-zinc-300">
              {EMAIL_TEMPLATE_CATEGORIES[template.category]}
            </dd>
          </div>
        </dl>
      </div>

      <TemplatePreviewFrame templateId={template.id} />
    </div>
  );
}

export function AdminEmailTemplatesClient() {
  const grouped = useMemo(() => listEmailTemplatesByCategory(), []);
  const firstTemplate = grouped[0]?.templates[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(firstTemplate);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  const selectedTemplate = useMemo(() => {
    for (const group of grouped) {
      const match = group.templates.find((template) => template.id === selectedId);
      if (match) return match;
    }
    return grouped[0]?.templates[0] ?? null;
  }, [grouped, selectedId]);

  const selectTemplate = useCallback((template: EmailTemplateMeta) => {
    setSelectedId(template.id);
    setMobilePreviewOpen(true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMobilePreviewOpen(false);
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageIntro
        eyebrow="Admin console"
        title="Email templates"
        description="Branded transactional emails sent through Resend at each step of the panelist and admin workflow. Select a template to preview sample content."
      />

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className={`min-w-0 ${mobilePreviewOpen ? "hidden lg:block" : "block"}`}>
          <TemplateList grouped={grouped} selectedId={selectedId} onSelect={selectTemplate} />
        </div>

        <div className={`min-w-0 ${mobilePreviewOpen ? "block" : "hidden lg:block"}`}>
          {selectedTemplate ? (
            <TemplatePreviewPanel
              template={selectedTemplate}
              showBack={mobilePreviewOpen}
              onBack={() => setMobilePreviewOpen(false)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

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
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        Loading preview…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 text-center text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
        {error}
      </div>
    );
  }

  return (
    <iframe
      title={`Email preview: ${templateId}`}
      srcDoc={html}
      className="min-h-[520px] w-full rounded-xl border border-zinc-200 bg-white dark:border-zinc-800"
      sandbox="allow-same-origin"
    />
  );
}

export function AdminEmailTemplatesClient({ resendConfigured }: { resendConfigured: boolean }) {
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

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Admin console"
        title="Email templates"
        description="Branded transactional emails sent through Resend at each step of the panelist and admin workflow. Select a template to preview sample content."
      />

      {!resendConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Set <code className="font-mono text-xs">RESEND_API_KEY</code> and{" "}
          <code className="font-mono text-xs">RESEND_FROM_EMAIL</code> in your environment to deliver live emails.
          Without them, messages are logged to <code className="font-mono text-xs">data/outbound-messages.json</code>.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="space-y-4">
          {grouped.map((group) => (
            <section key={group.category} className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {EMAIL_TEMPLATE_CATEGORIES[group.category]}
                </h2>
              </div>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {group.templates.map((template) => {
                  const active = template.id === selectedId;
                  return (
                    <li key={template.id}>
                      <button
                        type="button"
                        onClick={() => selectTemplate(template)}
                        className={`w-full px-4 py-3 text-left transition ${
                          active
                            ? "bg-teal-50 dark:bg-teal-950/40"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                        }`}
                      >
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{template.name}</div>
                        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{template.description}</div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className={`space-y-4 ${mobilePreviewOpen ? "block" : "hidden lg:block"}`}>
          {selectedTemplate ? (
            <>
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatHeadingCase(selectedTemplate.name)}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{selectedTemplate.description}</p>
                  </div>
                  <code className="rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {selectedTemplate.id}
                  </code>
                </div>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Trigger
                    </dt>
                    <dd className="mt-1 font-mono text-xs text-zinc-700 dark:text-zinc-300">{selectedTemplate.trigger}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Category
                    </dt>
                    <dd className="mt-1 text-zinc-700 dark:text-zinc-300">
                      {EMAIL_TEMPLATE_CATEGORIES[selectedTemplate.category]}
                    </dd>
                  </div>
                </dl>
              </div>

              <TemplatePreviewFrame templateId={selectedTemplate.id} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

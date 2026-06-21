"use client";

import Link from "next/link";
import { useState } from "react";
import { Field, TextInput } from "@/components/registration/form-ui";
import { SiteSelect } from "@/components/shared/SiteSelect";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { SUPPORT_TOPICS, type SupportFaqItem } from "@/lib/support-contact";
import { formatHeadingCase, formatSiteCase } from "@/lib/sentence-case";
import type { FieldErrors } from "@/lib/validation";
import { validEmail } from "@/lib/validation";

function FaqList({ items }: { items: SupportFaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-xl border border-zinc-200 bg-zinc-50/80 open:bg-white dark:border-zinc-800 dark:bg-zinc-950/60 dark:open:bg-zinc-900"
        >
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-zinc-900 marker:content-none dark:text-zinc-100 [&::-webkit-details-marker]:hidden">
            <span className="flex items-start justify-between gap-3">
              <span>{formatHeadingCase(item.question)}</span>
              <span className="text-zinc-400 transition group-open:rotate-45 dark:text-zinc-500">+</span>
            </span>
          </summary>
          <div className="border-t border-zinc-200 px-4 py-3 text-sm leading-relaxed text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  );
}

export function HelpContactClient({
  faq,
  supportEmail,
  privacyEmail,
  defaultName = "",
  defaultEmail = "",
}: {
  faq: SupportFaqItem[];
  supportEmail: string;
  privacyEmail: string;
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});

    const nextErrors: FieldErrors = {};
    if (!name.trim()) nextErrors.name = "Your name is required.";
    if (!email.trim()) nextErrors.email = "Email address is required.";
    else if (!validEmail(email.trim())) nextErrors.email = "Please enter a valid email address.";
    if (!topic) nextErrors.topic = "Please select a topic.";
    if (!message.trim()) nextErrors.message = "Please describe how we can help.";
    else if (message.trim().length < 20) {
      nextErrors.message = "Please provide a bit more detail (at least 20 characters).";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; errors?: FieldErrors };

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setErrors({ submit: data.message ?? "Could not send your message." });
        return;
      }

      setSubmitted(true);
      setSuccessMessage(data.message ?? "Your message has been sent.");
      setMessage("");
      setTopic("");
    } catch {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <section className="min-w-0 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {formatHeadingCase("Frequently asked questions")}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Quick answers about accounts, verification, surveys, rewards, and privacy.
          </p>
        </div>
        <FaqList items={faq} />
      </section>

      <section className="min-w-0">
        <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5 dark:border-teal-900/50 dark:bg-teal-950/20 sm:p-6">
          <h2 className="text-lg font-semibold text-teal-950 dark:text-teal-100">
            {formatHeadingCase("Contact support")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Send us a message and our team will reply within{" "}
            <strong className="font-semibold text-zinc-800 dark:text-zinc-200">1–2 business days</strong>.
          </p>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Email{" "}
            <a href={`mailto:${supportEmail}`} className="font-medium text-teal-700 hover:underline dark:text-teal-300">
              {supportEmail}
            </a>{" "}
            directly, or use the form below.
          </p>

          {submitted ? (
            <div className="mt-5">
              <BrandedAlert tone="success" title="Message sent">
                {formatSiteCase(successMessage)}
              </BrandedAlert>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-4 text-sm font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
              <Field label="Your name" required error={errors.name} id="support-name">
                <TextInput
                  id="support-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  error={errors.name}
                  autoComplete="name"
                />
              </Field>

              <Field label="Email address" required error={errors.email} id="support-email">
                <TextInput
                  id="support-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  error={errors.email}
                  autoComplete="email"
                />
              </Field>

              <Field label="Topic" required error={errors.topic} id="support-topic">
                <SiteSelect
                  id="support-topic"
                  value={topic}
                  onChange={setTopic}
                  placeholder="Select a topic"
                  options={SUPPORT_TOPICS.map((item) => ({ value: item.id, label: item.label }))}
                />
                {errors.topic ? (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                    {errors.topic}
                  </p>
                ) : null}
              </Field>

              <Field label="How can we help?" required error={errors.message} id="support-message">
                <textarea
                  id="support-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 transition hover:bg-zinc-50 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  placeholder="Tell us what you need help with…"
                />
              </Field>

              {errors.submit ? (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {formatSiteCase(errors.submit)}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="flex min-h-11 w-full items-center justify-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500"
              >
                {submitting ? formatSiteCase("Sending…") : formatSiteCase("Send message")}
              </button>
            </form>
          )}

          <p className="mt-5 border-t border-teal-200/80 pt-4 text-xs leading-relaxed text-zinc-500 dark:border-teal-900/50 dark:text-zinc-400">
            {formatHeadingCase("Privacy requests")}:{" "}
            <a href={`mailto:${privacyEmail}`} className="font-medium text-teal-700 hover:underline dark:text-teal-300">
              {privacyEmail}
            </a>{" "}
            or choose “Privacy & data requests” above. See also our{" "}
            <Link href="/data-use-policy" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
              data use policy
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageIntro } from "@/components/admin/shared/AdminUi";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import type { PlatformTestingSettings } from "@/lib/platform-testing-settings";

function TestingToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</span>
        <span className="mt-1 block text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</span>
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="h-7 w-12 rounded-full bg-zinc-300 transition peer-checked:bg-teal-700 peer-disabled:opacity-50 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-600 dark:bg-zinc-700" />
        <span className="pointer-events-none absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function AdminTestingSettingsClient({
  initialSettings,
}: {
  initialSettings: PlatformTestingSettings;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [savingKey, setSavingKey] = useState<string>("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const saveToggle = async (key: "allowDuplicateEmails" | "allowDuplicatePhones", value: boolean) => {
    const previous = settings;
    const next = { ...settings, [key]: value };
    setSettings(next);
    setSavingKey(key);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/testing-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      const data = (await res.json()) as { ok?: boolean; settings?: PlatformTestingSettings; message?: string };
      if (!res.ok || !data.settings) {
        setSettings(previous);
        setError(data.message ?? "Could not save that testing option.");
        return;
      }
      setSettings(data.settings);
      setMessage("Testing option saved. New signups and registrations will use it immediately.");
      router.refresh();
    } catch {
      setSettings(previous);
      setError("Network error. Please try again.");
    } finally {
      setSavingKey("");
    }
  };

  const anyOn = settings.allowDuplicateEmails || settings.allowDuplicatePhones;

  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-6">
      <PageIntro
        eyebrow="Platform"
        title="Testing"
        description="Temporary options for QA. Turn these off before you treat the panel as live production data."
      />

      {anyOn ? (
        <BrandedAlert tone="warning" title="Testing options are on" showIcon>
          Duplicate email or phone checks are relaxed on the public site. Turn these off when testing is finished.
        </BrandedAlert>
      ) : null}

      {error ? (
        <BrandedAlert tone="error" compact showIcon>
          {error}
        </BrandedAlert>
      ) : null}
      {message ? (
        <BrandedAlert tone="success" compact showIcon>
          {message}
        </BrandedAlert>
      ) : null}

      <div className="space-y-3">
        <TestingToggle
          label="Allow duplicate emails"
          description="Lets you create another account with an email that already has an account. Sign in with that same email. Each account must use a different password so the site can tell them apart. Registration will also allow that reused email."
          checked={settings.allowDuplicateEmails}
          disabled={Boolean(savingKey)}
          onChange={(value) => void saveToggle("allowDuplicateEmails", value)}
        />
        <TestingToggle
          label="Allow duplicate phone numbers"
          description="Lets more than one panelist use the same phone or WhatsApp number at registration and when requesting a phone change."
          checked={settings.allowDuplicatePhones}
          disabled={Boolean(savingKey)}
          onChange={(value) => void saveToggle("allowDuplicatePhones", value)}
        />
      </div>

      {settings.updatedAt ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Last updated {new Date(settings.updatedAt).toLocaleString()}
          {settings.updatedBy ? ` by ${settings.updatedBy}` : ""}.
        </p>
      ) : null}
    </div>
  );
}

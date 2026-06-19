"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiteSelect } from "@/components/shared/SiteSelect";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import type { ClientUserRecord } from "@/lib/client-users";
import { formatHeadingCase } from "@/lib/sentence-case";

export function AdminCampaignClientAssignment({
  campaignId,
  clientId,
  clients,
}: {
  campaignId: string;
  clientId?: string;
  clients: ClientUserRecord[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(clientId ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const save = async (nextClientId: string) => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/admin/campaigns/${encodeURIComponent(campaignId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: nextClientId }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Could not update client assignment.");
        setValue(clientId ?? "");
        return;
      }
      setMessage(data.message ?? "Client assignment updated.");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setValue(clientId ?? "");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-teal-950 dark:text-teal-100">
        {formatHeadingCase("Client portal access")}
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Assign a client account so they can sign in and view results for this study only.
      </p>
      <div className="mt-4 max-w-xl">
        <SiteSelect
          value={value}
          onChange={(next) => {
            setValue(next);
            void save(next);
          }}
          disabled={saving}
          options={[
            { value: "", label: "No client portal access" },
            ...clients
              .filter((client) => client.status === "active")
              .map((client) => ({
                value: client.id,
                label: `${client.organization_name} (${client.email})`,
              })),
          ]}
        />
      </div>
      {message ? (
        <p className="mt-3 text-sm text-teal-800 dark:text-teal-200" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <div className="mt-3">
          <BrandedAlert tone="error" showIcon>
            {error}
          </BrandedAlert>
        </div>
      ) : null}
    </section>
  );
}

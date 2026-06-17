"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminMarkReadButton({
  scope,
  label = "Mark all as read",
}: {
  scope: "notifications" | "payouts" | "campaigns";
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const markRead = async () => {
    setBusy(true);
    try {
      await fetch("/api/admin/read-state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, markAll: true }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={markRead}
      disabled={busy}
      className="inline-flex min-h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60"
    >
      {busy ? "Updating…" : label}
    </button>
  );
}

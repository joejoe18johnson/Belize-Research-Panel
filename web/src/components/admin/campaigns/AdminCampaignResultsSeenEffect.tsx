"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function AdminCampaignResultsSeenEffect({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const requested = useRef(false);

  useEffect(() => {
    if (!campaignId || requested.current) return;
    requested.current = true;

    void fetch("/api/admin/read-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "campaigns", ids: [campaignId] }),
    })
      .then((res) => {
        if (res.ok) router.refresh();
      })
      .catch(() => undefined);
  }, [campaignId, router]);

  return null;
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function SurveyInvitationsSeenEffect() {
  const router = useRouter();
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    void fetch("/api/dashboard/surveys/seen", { method: "POST" })
      .then((res) => {
        if (res.ok) router.refresh();
      })
      .catch(() => undefined);
  }, [router]);

  return null;
}

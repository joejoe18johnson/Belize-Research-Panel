"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function LogoutIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
    </svg>
  );
}

export function LogoutButton({
  className = "",
  compact = false,
  showIcon = false,
  label,
  loadingLabel,
}: {
  className?: string;
  /** Icon-only control for cramped mobile toolbars. */
  compact?: boolean;
  /** Show the logout icon beside the label. */
  showIcon?: boolean;
  label?: string;
  loadingLabel?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const idleLabel = label ?? "Log out";
  const busyLabel = loadingLabel ?? "Logging out…";
  const displayLabel = loading ? busyLabel : idleLabel;

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      aria-label={displayLabel}
      title={displayLabel}
      className={className}
    >
      {compact ? (
        <LogoutIcon className="h-5 w-5 shrink-0" />
      ) : (
        <>
          {showIcon ? <LogoutIcon className="h-5 w-5 shrink-0" /> : null}
          {displayLabel}
        </>
      )}
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatSiteCase } from "@/lib/sentence-case";

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
      aria-label={loading ? "Logging out" : "Log out"}
      className={className}
    >
      {loading ? formatSiteCase("Logging out…") : formatSiteCase("Log out")}
    </button>
  );
}

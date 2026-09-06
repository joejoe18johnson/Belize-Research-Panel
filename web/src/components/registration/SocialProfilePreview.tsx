"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getSocialPlatformLabel,
  resolveSocialProfileUrl,
  type SocialPlatform,
  type SocialProfilePreviewResult,
} from "@/lib/social-profile";
import { SocialPlatformIcon } from "./SocialPlatformIcon";

function looksLikeProfilePersonName(displayName: string, handle: string): boolean {
  const name = displayName.trim();
  const normalizedHandle = handle.replace(/^@/, "").trim().toLowerCase();
  if (!name) return false;
  if (name.toLowerCase() === normalizedHandle) return false;
  if (name.toLowerCase() === normalizedHandle.replace(/[._]/g, " ")) return false;
  // Prefer names that look like a person (at least one space, letters).
  if (!/[A-Za-z]/.test(name)) return false;
  return /\s/.test(name) || name.length > normalizedHandle.length + 2;
}

export function SocialProfilePreview({
  platform,
  value,
}: {
  platform: SocialPlatform;
  value: string;
}) {
  const base = useMemo(() => resolveSocialProfileUrl(platform, value), [platform, value]);
  const [remoteName, setRemoteName] = useState<string | null>(null);

  useEffect(() => {
    setRemoteName(null);
    if (!base) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ platform, value: value.trim() });
        const res = await fetch(`/api/social-preview?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as SocialProfilePreviewResult;
        if (
          data.previewAvailable &&
          looksLikeProfilePersonName(data.displayName, data.handle || base.handle)
        ) {
          setRemoteName(data.displayName.trim());
        }
      } catch {
        // Ignore aborted / network failures — handle-only preview is enough.
      }
    }, 400);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [base, platform, value]);

  if (!base) return null;

  const platformLabel = getSocialPlatformLabel(platform);
  const handle = base.handle.replace(/^@/, "");

  return (
    <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-3">
        <SocialPlatformIcon platform={platform} />
        <div className="min-w-0 flex-1">
          {remoteName ? (
            <>
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{remoteName}</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {platformLabel}
                {handle ? ` · @${handle}` : ""}
              </p>
            </>
          ) : (
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {platformLabel}
              {handle ? ` · @${handle}` : ""}
            </p>
          )}
        </div>
        <a
          href={base.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800"
        >
          View profile
        </a>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
        Open the profile and confirm this is your {platformLabel} account before continuing.
      </p>
    </div>
  );
}

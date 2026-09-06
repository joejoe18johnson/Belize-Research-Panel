"use client";

import { useMemo } from "react";
import { getSocialPlatformLabel, resolveSocialProfileUrl, type SocialPlatform } from "@/lib/social-profile";
import { cleanText } from "@/lib/validation";

function personName(firstName?: string, lastName?: string): string {
  return [cleanText(firstName ?? ""), cleanText(lastName ?? "")].filter(Boolean).join(" ");
}

function initials(name: string, fallback: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return fallback.slice(0, 2).toUpperCase();
}

export function SocialProfilePreview({
  platform,
  value,
  firstName,
  lastName,
}: {
  platform: SocialPlatform;
  value: string;
  firstName?: string;
  lastName?: string;
}) {
  const preview = useMemo(() => resolveSocialProfileUrl(platform, value), [platform, value]);
  if (!preview) return null;

  const platformLabel = getSocialPlatformLabel(platform);
  const displayName = personName(firstName, lastName) || preview.displayName;
  const handle = preview.handle.replace(/^@/, "");

  return (
    <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-200">
          {initials(displayName, handle)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{displayName}</p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {platformLabel}
            {handle ? ` · @${handle}` : ""}
          </p>
        </div>
        <a
          href={preview.profileUrl}
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

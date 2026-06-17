"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getSocialPlatformLabel,
  resolveSocialProfileUrl,
  type SocialPlatform,
  type SocialProfilePreviewResult,
} from "@/lib/social-profile";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function SocialProfilePreview({
  platform,
  value,
}: {
  platform: SocialPlatform;
  value: string;
}) {
  const [preview, setPreview] = useState<SocialProfilePreviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const localPreview = useMemo(() => resolveSocialProfileUrl(platform, value), [platform, value]);

  useEffect(() => {
    setImageError(false);

    if (!localPreview) {
      setPreview(null);
      setLoading(false);
      return;
    }

    setPreview(localPreview);
    setLoading(true);

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const params = new URLSearchParams({ platform, value });
          const res = await fetch(`/api/social-preview?${params.toString()}`);
          const data = (await res.json()) as SocialProfilePreviewResult & { error?: string };
          if (res.ok) {
            setPreview(data);
          } else {
            setPreview({
              ...localPreview,
              message: data.error ?? "We couldn't load a live preview. Please double-check your handle or link.",
            });
          }
        } catch {
          setPreview({
            ...localPreview,
            message: "We couldn't load a live preview. Please double-check your handle or link.",
          });
        } finally {
          setLoading(false);
        }
      })();
    }, 650);

    return () => window.clearTimeout(timer);
  }, [localPreview, platform, value]);

  if (!preview) return null;

  const platformLabel = getSocialPlatformLabel(platform);
  const proxiedImage =
    preview.imageUrl && !imageError
      ? `/api/social-preview/image?url=${encodeURIComponent(preview.imageUrl)}`
      : null;

  return (
    <div className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-100 text-sm font-semibold text-teal-800 dark:text-teal-200">
          {proxiedImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={proxiedImage}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            initials(preview.displayName)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{preview.displayName}</p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
            {platformLabel}
            {preview.handle ? ` · @${preview.handle.replace(/^@/, "")}` : ""}
          </p>
          <a
            href={preview.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-block truncate text-xs text-teal-700 hover:text-teal-900 dark:text-teal-100"
          >
            View profile
          </a>
        </div>
        {loading ? (
          <span className="text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">Loading…</span>
        ) : preview.previewAvailable ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
            Preview
          </span>
        ) : null}
      </div>
      {preview.message ? (
        <p className="mt-2 text-xs text-amber-800">{preview.message}</p>
      ) : (
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Does this look like your {platformLabel} account?</p>
      )}
    </div>
  );
}

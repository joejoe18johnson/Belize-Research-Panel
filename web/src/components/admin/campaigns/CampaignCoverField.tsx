"use client";

import { useEffect, useState } from "react";
import { campaignCoverAssetUrl } from "@/lib/campaign-branding-shared";
import { getSurveyCategoryStyle } from "@/lib/survey-category-styles";
import type { SurveyCategory } from "@/lib/panelist-surveys-types";
import { formatHeadingCase } from "@/lib/sentence-case";

export function CampaignCoverField({
  category,
  campaignId,
  savedCoverFile,
  onCoverChange,
}: {
  category: SurveyCategory;
  campaignId?: string;
  savedCoverFile?: string;
  onCoverChange: (file: File | null) => void;
}) {
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const style = getSurveyCategoryStyle(category);
  const savedUrl = campaignId && savedCoverFile ? campaignCoverAssetUrl(campaignId) : null;

  useEffect(() => {
    if (!coverFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  return (
    <div className="sm:col-span-2">
      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Cover image (optional)</label>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Shown on the panelist survey inbox card. Wide images work best · PNG, JPG, or WebP · max 5 MB. If you skip this,
        the category banner is used.
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-start">
        <div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setCoverFile(file);
              onCoverChange(file);
            }}
            className="block w-full text-sm text-zinc-600 dark:text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800 dark:file:bg-teal-950 dark:file:text-teal-100"
          />
          {coverFile ? (
            <button
              type="button"
              onClick={() => {
                setCoverFile(null);
                onCoverChange(null);
              }}
              className="mt-2 text-xs font-semibold text-red-600 hover:text-red-800"
            >
              Remove cover image
            </button>
          ) : null}
        </div>
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="relative aspect-[16/9] w-full">
            {previewUrl || savedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl ?? savedUrl ?? ""} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className={`flex h-full items-end bg-gradient-to-br ${style.gradient} p-3`}>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white">
                  {style.icon} {formatHeadingCase(style.label)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export async function uploadCampaignCover(
  campaignId: string,
  file: File | null
): Promise<{ ok: boolean; message?: string }> {
  if (!file) return { ok: true };

  const formData = new FormData();
  formData.append("cover", file);

  const res = await fetch(`/api/admin/campaigns/${encodeURIComponent(campaignId)}/cover`, {
    method: "POST",
    body: formData,
  });
  const data = (await res.json()) as { ok?: boolean; message?: string };
  if (!res.ok || !data.ok) {
    return { ok: false, message: data.message ?? "Could not upload campaign cover image." };
  }
  return { ok: true };
}

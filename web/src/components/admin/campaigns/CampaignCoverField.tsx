"use client";

import { useEffect, useState } from "react";
import { BrpInitialsMark } from "@/components/BrpLogo";
import { campaignCoverAssetUrl, campaignLogoAssetUrl } from "@/lib/campaign-branding-shared";
import { getSurveyCategoryStyle } from "@/lib/survey-category-styles";
import type { SurveyCategory } from "@/lib/panelist-surveys-types";
import { formatHeadingCase } from "@/lib/sentence-case";

function BrandingPreview({
  category,
  coverUrl,
  logoUrl,
}: {
  category: SurveyCategory;
  coverUrl: string | null;
  logoUrl: string | null;
}) {
  const style = getSurveyCategoryStyle(category);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="relative aspect-[16/9] w-full">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className={`flex h-full items-end bg-gradient-to-br ${style.gradient} p-3`}>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white">
              {style.icon} {formatHeadingCase(style.label)}
            </span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 rounded-lg border border-white/40 bg-white/95 p-1 shadow-lg">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Campaign logo" className="max-h-7 max-w-[4.5rem] object-contain" />
          ) : (
            <BrpInitialsMark size="xs" />
          )}
        </div>
      </div>
    </div>
  );
}

export function CampaignCoverField({
  category,
  campaignId,
  savedCoverFile,
  savedLogoFile,
  onCoverChange,
  onLogoChange,
}: {
  category: SurveyCategory;
  campaignId?: string;
  savedCoverFile?: string;
  savedLogoFile?: string;
  onCoverChange: (file: File | null) => void;
  onLogoChange: (file: File | null) => void;
}) {
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const savedCoverUrl = campaignId && savedCoverFile ? campaignCoverAssetUrl(campaignId) : null;
  const savedLogoUrl = campaignId && savedLogoFile ? campaignLogoAssetUrl(campaignId) : null;

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  return (
    <div className="sm:col-span-2 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Logo (optional)</label>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Shown on survey cards and the survey header · PNG, JPG, or WebP · max 2 MB. If you skip this, the BRP
            initials mark is used.
          </p>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setLogoFile(file);
              onLogoChange(file);
            }}
            className="mt-3 block w-full text-sm text-zinc-600 dark:text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800 dark:file:bg-teal-950 dark:file:text-teal-100"
          />
          {logoFile ? (
            <button
              type="button"
              onClick={() => {
                setLogoFile(null);
                onLogoChange(null);
              }}
              className="mt-2 text-xs font-semibold text-red-600 hover:text-red-800"
            >
              Remove logo
            </button>
          ) : null}
        </div>
        <div>
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Cover image (optional)</label>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Shown on the panelist survey inbox card. Wide images work best · PNG, JPG, or WebP · max 5 MB. If you skip
            this, the category banner is used.
          </p>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setCoverFile(file);
              onCoverChange(file);
            }}
            className="mt-3 block w-full text-sm text-zinc-600 dark:text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800 dark:file:bg-teal-950 dark:file:text-teal-100"
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
      </div>
      <div className="max-w-[220px]">
        <p className="mb-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">Preview</p>
        <BrandingPreview
          category={category}
          coverUrl={coverPreviewUrl ?? savedCoverUrl}
          logoUrl={logoPreviewUrl ?? savedLogoUrl}
        />
      </div>
    </div>
  );
}

export async function uploadCampaignCover(
  campaignId: string,
  file: File | null
): Promise<{ ok: boolean; message?: string }> {
  return uploadCampaignBranding(campaignId, { cover: file, logo: null });
}

export async function uploadCampaignBranding(
  campaignId: string,
  files: { cover?: File | null; logo?: File | null }
): Promise<{ ok: boolean; message?: string }> {
  if (!files.cover && !files.logo) return { ok: true };

  const formData = new FormData();
  if (files.cover) formData.append("cover", files.cover);
  if (files.logo) formData.append("logo", files.logo);

  const res = await fetch(`/api/admin/campaigns/${encodeURIComponent(campaignId)}/cover`, {
    method: "POST",
    body: formData,
  });
  const data = (await res.json()) as { ok?: boolean; message?: string };
  if (!res.ok || !data.ok) {
    return { ok: false, message: data.message ?? "Could not upload campaign branding." };
  }
  return { ok: true };
}

"use client";

import { useEffect, useState } from "react";
import type { SurveyCategory } from "@/lib/panelist-surveys-types";
import type { SurveyDefinition } from "@/lib/survey-types";
import { SurveyBrandingHeader } from "@/components/surveys/SurveyBrandingHeader";

export function SurveyBrandingFields({
  surveyId,
  initialSurvey,
  title,
  description,
  category,
  companyIntro,
  onCompanyIntroChange,
  onBrandingChange,
}: {
  surveyId?: string;
  initialSurvey?: SurveyDefinition;
  title: string;
  description: string;
  category: SurveyCategory;
  companyIntro: string;
  onCompanyIntroChange: (value: string) => void;
  onBrandingChange: (state: SurveyBrandingUploadState) => void;
}) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeCover, setRemoveCover] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const hasSavedLogo = Boolean(initialSurvey?.companyLogoFile) && !removeLogo && !logoFile;
  const hasSavedCover = Boolean(initialSurvey?.coverImageFile) && !removeCover && !coverFile;

  const publishBrandingState = (next: Partial<SurveyBrandingUploadState>) => {
    onBrandingChange({
      logoFile,
      coverFile,
      removeLogo,
      removeCover,
      ...next,
    });
  };

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  const previewDefinition = initialSurvey
    ? {
        ...initialSurvey,
        companyLogoFile: removeLogo ? "" : initialSurvey.companyLogoFile,
        coverImageFile: removeCover ? "" : initialSurvey.coverImageFile,
      }
    : undefined;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-teal-950">Company branding</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Add a sponsor logo, company introduction, and optional cover image. If no cover is uploaded, the default
        category banner is used.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Company intro</label>
          <textarea
            rows={3}
            value={companyIntro}
            onChange={(event) => onCompanyIntroChange(event.target.value)}
            placeholder="Brief welcome message from the research sponsor or client."
            className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Company logo</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setLogoFile(file);
              const nextRemoveLogo = file ? false : removeLogo;
              if (file) setRemoveLogo(false);
              publishBrandingState({ logoFile: file, removeLogo: nextRemoveLogo });
            }}
            className="mt-1.5 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800"
          />
          <p className="mt-1 text-xs text-zinc-500">PNG, JPG, or WebP · max 2 MB</p>
          {hasSavedLogo || logoFile ? (
            <button
              type="button"
              onClick={() => {
                setLogoFile(null);
                setRemoveLogo(true);
                publishBrandingState({ logoFile: null, removeLogo: true });
              }}
              className="mt-2 text-xs font-semibold text-red-600 hover:text-red-800"
            >
              Remove logo
            </button>
          ) : null}
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Cover image (optional)</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setCoverFile(file);
              const nextRemoveCover = file ? false : removeCover;
              if (file) setRemoveCover(false);
              publishBrandingState({ coverFile: file, removeCover: nextRemoveCover });
            }}
            className="mt-1.5 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-teal-800"
          />
          <p className="mt-1 text-xs text-zinc-500">Wide image recommended · max 5 MB</p>
          {hasSavedCover || coverFile ? (
            <button
              type="button"
              onClick={() => {
                setCoverFile(null);
                setRemoveCover(true);
                publishBrandingState({ coverFile: null, removeCover: true });
              }}
              className="mt-2 text-xs font-semibold text-red-600 hover:text-red-800"
            >
              Remove cover image
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Preview</p>
        <div className="mt-2">
          <SurveyBrandingHeader
            title={title || "Survey title preview"}
            description={description}
            companyIntro={companyIntro}
            category={category}
            surveyId={surveyId}
            definition={previewDefinition}
            logoPreviewUrl={logoPreviewUrl}
            coverPreviewUrl={coverPreviewUrl}
          />
        </div>
      </div>
    </section>
  );
}

export type SurveyBrandingUploadState = {
  logoFile: File | null;
  coverFile: File | null;
  removeLogo: boolean;
  removeCover: boolean;
};

export async function uploadSurveyBranding(
  surveyId: string,
  state: SurveyBrandingUploadState
): Promise<{ ok: boolean; message?: string }> {
  if (!state.logoFile && !state.coverFile && !state.removeLogo && !state.removeCover) {
    return { ok: true };
  }

  const formData = new FormData();
  if (state.logoFile) formData.append("logo", state.logoFile);
  if (state.coverFile) formData.append("cover", state.coverFile);
  if (state.removeLogo) formData.append("removeLogo", "true");
  if (state.removeCover) formData.append("removeCover", "true");

  const res = await fetch(`/api/admin/survey-definitions/${encodeURIComponent(surveyId)}/branding`, {
    method: "POST",
    body: formData,
  });
  const data = (await res.json()) as { ok?: boolean; message?: string };
  if (!res.ok || !data.ok) {
    return { ok: false, message: data.message ?? "Could not upload branding assets." };
  }
  return { ok: true };
}

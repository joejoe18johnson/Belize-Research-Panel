import type { SurveyCategory } from "@/lib/panelist-surveys-types";
import {
  surveyBrandingAssetUrl,
  surveyHasCover,
  surveyHasLogo,
} from "@/lib/survey-branding-shared";
import { getSurveyCategoryStyle } from "@/lib/survey-category-styles";
import type { SurveyDefinition } from "@/lib/survey-types";
import { formatHeadingCase } from "@/lib/sentence-case";

export function SurveyBrandingHeader({
  title,
  description,
  companyIntro,
  category,
  surveyId,
  logoPreviewUrl,
  coverPreviewUrl,
  definition,
  variant = "full",
}: {
  title: string;
  description?: string;
  companyIntro?: string;
  category: SurveyCategory;
  surveyId?: string;
  logoPreviewUrl?: string | null;
  coverPreviewUrl?: string | null;
  definition?: Pick<SurveyDefinition, "companyLogoFile" | "coverImageFile">;
  variant?: "full" | "compact";
}) {
  const compact = variant === "compact";
  const style = getSurveyCategoryStyle(category);
  const hasLogo = Boolean(logoPreviewUrl) || (definition ? surveyHasLogo(definition) : false);
  const hasCover = Boolean(coverPreviewUrl) || (definition ? surveyHasCover(definition) : false);

  const resolvedLogoUrl =
    logoPreviewUrl ??
    (surveyId && definition && surveyHasLogo(definition) ? surveyBrandingAssetUrl(surveyId, "logo") : null);
  const resolvedCoverUrl =
    coverPreviewUrl ??
    (surveyId && definition && surveyHasCover(definition) ? surveyBrandingAssetUrl(surveyId, "cover") : null);

  return (
    <div
      className={`overflow-hidden border border-zinc-200 bg-white shadow-sm ${
        compact ? "rounded-xl" : "rounded-2xl"
      }`}
    >
      <div
        className={`relative w-full overflow-hidden ${
          compact ? "aspect-[3/1] max-h-24" : "aspect-[16/9]"
        }`}
      >
        {resolvedCoverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolvedCoverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className={`relative flex h-full items-end bg-gradient-to-br ${style.gradient} ${
              compact ? "p-2.5" : "p-5"
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_55%)]" />
            <span
              className={`relative inline-flex rounded-full bg-white/15 font-medium text-white backdrop-blur-sm ${
                compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
              }`}
            >
              {style.icon} {formatHeadingCase(style.label)}
            </span>
          </div>
        )}

        {hasLogo && resolvedLogoUrl ? (
          <div
            className={`absolute rounded-lg border border-white/40 bg-white/95 shadow-lg ${
              compact ? "bottom-2 left-2 p-1" : "bottom-4 left-4 rounded-xl p-2"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvedLogoUrl}
              alt="Company logo"
              className={`object-contain ${compact ? "max-h-7 max-w-[4.5rem]" : "max-h-12 max-w-[10rem]"}`}
            />
          </div>
        ) : null}
      </div>

      <div className={compact ? "space-y-1.5 p-3" : "space-y-3 p-5 sm:p-6"}>
        <div>
          <h1 className={`font-bold text-zinc-900 ${compact ? "text-sm leading-snug" : "text-2xl"}`}>{title}</h1>
          {companyIntro ? (
            <p
              className={`leading-relaxed text-zinc-700 ${
                compact ? "mt-1 line-clamp-2 text-[11px]" : "mt-2 text-sm"
              }`}
            >
              {companyIntro}
            </p>
          ) : null}
          {description ? (
            <p
              className={`leading-relaxed text-zinc-600 ${
                compact ? "mt-1 line-clamp-2 text-[11px]" : "mt-2 text-sm"
              }`}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

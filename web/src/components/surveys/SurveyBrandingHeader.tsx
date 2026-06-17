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
}: {
  title: string;
  description?: string;
  companyIntro?: string;
  category: SurveyCategory;
  surveyId?: string;
  logoPreviewUrl?: string | null;
  coverPreviewUrl?: string | null;
  definition?: Pick<SurveyDefinition, "companyLogoFile" | "coverImageFile">;
}) {
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
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {resolvedCoverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolvedCoverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className={`relative flex h-full items-end bg-gradient-to-br ${style.gradient} p-5`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_55%)]" />
            <span className="relative inline-flex rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {style.icon} {formatHeadingCase(style.label)}
            </span>
          </div>
        )}

        {hasLogo && resolvedLogoUrl ? (
          <div className="absolute bottom-4 left-4 rounded-xl border border-white/40 bg-white/95 p-2 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolvedLogoUrl} alt="Company logo" className="max-h-12 max-w-[10rem] object-contain" />
          </div>
        ) : null}
      </div>

      <div className="space-y-3 p-5 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
          {companyIntro ? (
            <p className="mt-2 text-sm leading-relaxed text-zinc-700">{companyIntro}</p>
          ) : null}
          {description ? (
            <p className={`text-sm leading-relaxed text-zinc-600 ${companyIntro ? "mt-2" : "mt-2"}`}>
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

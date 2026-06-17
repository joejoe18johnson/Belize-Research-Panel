import type { SurveyDefinition } from "./survey-types";

export function surveyBrandingAssetUrl(surveyId: string, kind: "logo" | "cover"): string {
  return `/api/surveys/${encodeURIComponent(surveyId)}/assets/${kind}`;
}

export function surveyHasLogo(definition: Pick<SurveyDefinition, "companyLogoFile">): boolean {
  return Boolean(definition.companyLogoFile);
}

export function surveyHasCover(definition: Pick<SurveyDefinition, "coverImageFile">): boolean {
  return Boolean(definition.coverImageFile);
}

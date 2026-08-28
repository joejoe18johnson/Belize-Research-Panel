import { cleanText } from "./validation";

export const DEFAULT_SURVEY_BY = "Belize Research Panel";

export function resolveSurveyBy(value?: string | null): string {
  return cleanText(value ?? "") || DEFAULT_SURVEY_BY;
}

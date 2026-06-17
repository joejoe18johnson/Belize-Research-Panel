import type { SurveyCategory } from "./panelist-surveys-types";

export const SURVEY_CATEGORY_STYLES: Record<
  SurveyCategory,
  { gradient: string; label: string; icon: string }
> = {
  political: {
    gradient: "from-teal-700 via-teal-800 to-teal-950",
    label: "Political poll",
    icon: "🗳️",
  },
  market: {
    gradient: "from-orange-600 via-orange-700 to-amber-800",
    label: "Market research",
    icon: "📊",
  },
  civic: {
    gradient: "from-emerald-600 via-teal-700 to-teal-900",
    label: "Civic study",
    icon: "🏛️",
  },
};

export function getSurveyCategoryStyle(category: SurveyCategory) {
  return SURVEY_CATEGORY_STYLES[category] ?? SURVEY_CATEGORY_STYLES.civic;
}

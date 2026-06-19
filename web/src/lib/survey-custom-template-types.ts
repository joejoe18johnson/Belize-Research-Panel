import type { SurveyCategory } from "./panelist-surveys-types";
import type { TemplateQuestionDraft } from "./survey-template-builders";

export interface SurveyCustomTemplate {
  id: string;
  title: string;
  description: string;
  companyIntro: string;
  category: SurveyCategory;
  questions: TemplateQuestionDraft[];
  createdAt: string;
  updatedAt: string;
}

import type { SurveyCategory } from "./panelist-surveys-types";
import { instantiateTemplateQuestions } from "./survey-template-builders";
import type { SurveyCustomTemplate } from "./survey-custom-template-types";
import type { SurveyQuestion } from "./survey-types";

export function applySurveyCustomTemplate(template: SurveyCustomTemplate): {
  title: string;
  description: string;
  companyIntro: string;
  category: SurveyCategory;
  questions: SurveyQuestion[];
} {
  return {
    title: template.title,
    description: template.description,
    companyIntro: template.companyIntro,
    category: template.category,
    questions: instantiateTemplateQuestions(template.questions),
  };
}

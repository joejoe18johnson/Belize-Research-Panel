import { findCampaignById } from "./campaigns";
import { loadSurveyRecordsForEmail, surveyAssignmentExistsForCampaign } from "./panelist-surveys-store";
import type { PanelistSurveyRecord } from "./panelist-surveys-types";
import { findSurveyDefinitionById } from "./survey-definitions";
import type { SurveyDefinition } from "./survey-types";
import { cleanText } from "./validation";

export function normalizeAssignmentId(raw: string): string {
  let value = cleanText(raw);
  try {
    value = decodeURIComponent(value);
  } catch {
    // already decoded
  }
  const composite = value.split("::")[0];
  return cleanText(composite || value);
}

export async function findAssignmentForAccount(
  assignmentId: string,
  email: string
): Promise<PanelistSurveyRecord | null> {
  const id = normalizeAssignmentId(assignmentId);
  const normalizedEmail = cleanText(email).toLowerCase();
  if (!id || !normalizedEmail) return null;

  const assignments = await loadSurveyRecordsForEmail(normalizedEmail);
  const record =
    assignments.find((item) => {
      const recordId = cleanText(item.id);
      return recordId === id || recordId === cleanText(assignmentId);
    }) ?? null;
  if (!record) return null;

  const campaign = await findCampaignById(record.id);
  if (!campaign) return record;
  return {
    ...record,
    coverImageFile: campaign.coverImageFile || record.coverImageFile || "",
    logoFile: campaign.logoFile || record.logoFile || "",
  };
}

export async function assignmentExistsForCampaign(campaignId: string): Promise<boolean> {
  const id = normalizeAssignmentId(campaignId);
  if (!id) return false;
  return surveyAssignmentExistsForCampaign(id);
}

export async function resolveSurveyDefinitionForAssignment(
  assignment: PanelistSurveyRecord
): Promise<SurveyDefinition | null> {
  const directId = cleanText(assignment.surveyDefinitionId ?? "");
  if (directId) {
    const definition = await findSurveyDefinitionById(directId);
    if (definition) return definition;
  }

  const campaign = await findCampaignById(assignment.id);
  const campaignDefinitionId = cleanText(campaign?.surveyDefinitionId ?? "");
  if (campaignDefinitionId && campaignDefinitionId !== directId) {
    return findSurveyDefinitionById(campaignDefinitionId);
  }

  return null;
}

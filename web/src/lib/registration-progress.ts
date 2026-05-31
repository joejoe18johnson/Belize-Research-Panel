import type { RegistrationFormData } from "./registration-types";
import {
  isEligibleCitizenship,
  isRegisteredVoter,
  validateRegistrationForm,
  type FieldErrors,
} from "./validation";

export const REGISTRATION_PHASES = [
  {
    id: "eligibility",
    label: "Eligibility",
    description: "Citizenship, age and voter status",
  },
  {
    id: "profile",
    label: "Your profile",
    description: "Name, background and residence",
  },
  {
    id: "interests",
    label: "Interests",
    description: "Research topic preferences",
  },
  {
    id: "contact",
    label: "Contact",
    description: "How we can reach you",
  },
  {
    id: "verification",
    label: "Verification",
    description: "Photo identification and proof of residence",
  },
  {
    id: "review",
    label: "Review",
    description: "Consent and submit",
  },
] as const;

export type RegistrationPhaseId = (typeof REGISTRATION_PHASES)[number]["id"];

export interface RegistrationProgressInput {
  form: RegistrationFormData;
  registeredVoter: boolean;
}

const PHASE_ERROR_KEYS: readonly (readonly string[])[] = [
  ["citizenshipStatus", "commonwealthCountry", "dob", "votingStatus"],
  [
    "firstName",
    "lastName",
    "sex",
    "education",
    "ethnicity",
    "placeOfResidence",
    "countryIfAbroad",
    "usDiasporaRegion",
    "cityTownVillage",
    "cityTownVillageOther",
    "constituency",
    "registeredCtvArea",
  ],
  ["politicalInterests", "marketInterests", "civicInterests"],
  [
    "email",
    "phoneCountryCode",
    "phoneLocalNumber",
    "otherContact",
    "otherContactPlatform",
    "contact",
    "streetAddress",
    "contactDetailsConfirmed",
  ],
  [
    "photoIdType",
    "photoIdFile",
    "authorisedVerificationCode",
    "proofOfBelizeResidenceType",
    "proofOfBelizeResidenceFile",
  ],
  ["consentResearch", "consentContact", "consentPrivacy", "finalReviewConfirmed"],
];

export function getPhaseIndexForField(fieldKey: string): number {
  const index = PHASE_ERROR_KEYS.findIndex((keys) => keys.includes(fieldKey));
  if (index >= 0) return index;
  if (fieldKey === "contact") return 3;
  if (fieldKey === "submit") return 5;
  return 0;
}

export function getFirstPhaseIndexForErrors(errors: FieldErrors): number {
  let minPhase = REGISTRATION_PHASES.length - 1;
  let found = false;
  for (const key of Object.keys(errors)) {
    if (key === "submit") continue;
    minPhase = Math.min(minPhase, getPhaseIndexForField(key));
    found = true;
  }
  return found ? minPhase : 0;
}

export function getPhaseFieldKeys(phaseIndex: number): readonly string[] {
  return PHASE_ERROR_KEYS[phaseIndex] ?? [];
}

function collectPhaseErrors(
  phaseIndex: number,
  input: RegistrationProgressInput,
  options: { usernameTaken?: boolean; accountBacked?: boolean; accountEmail?: string } = {}
): FieldErrors {
  const allErrors = validateRegistrationForm(input.form, options);
  const keys = new Set(getPhaseFieldKeys(phaseIndex));
  const { form } = input;

  if (phaseIndex === 0 && !isEligibleCitizenship(form.citizenshipStatus)) {
    delete allErrors.votingStatus;
    delete allErrors.commonwealthCountry;
  }
  if (phaseIndex === 0 && form.citizenshipStatus !== "Citizen of a Commonwealth country living in Belize") {
    delete allErrors.commonwealthCountry;
  }
  if (phaseIndex === 1 && !isRegisteredVoter(form.citizenshipStatus, form.votingStatus)) {
    delete allErrors.constituency;
    delete allErrors.registeredCtvArea;
  }
  if (phaseIndex === 1 && form.placeOfResidence === "Abroad") {
    delete allErrors.cityTownVillageOther;
  }
  if (phaseIndex === 1 && form.placeOfResidence && form.placeOfResidence !== "Abroad") {
    delete allErrors.countryIfAbroad;
    delete allErrors.usDiasporaRegion;
  }
  if (phaseIndex === 1 && form.placeOfResidence !== "Abroad") {
    delete allErrors.cityTownVillageOther;
  }
  if (phaseIndex === 1) {
    const isUsAbroad = ["United States", "USA", "United States of America"].includes(form.countryIfAbroad);
    if (form.placeOfResidence !== "Abroad" || !isUsAbroad) {
      delete allErrors.usDiasporaRegion;
    }
  }
  if (phaseIndex === 2) {
    if (!isRegisteredVoter(form.citizenshipStatus, form.votingStatus)) {
      delete allErrors.politicalInterests;
    }
    if (form.placeOfResidence === "Abroad") {
      delete allErrors.marketInterests;
    }
  }
  if (phaseIndex === 4 && form.citizenshipStatus !== "Citizen of a Commonwealth country living in Belize") {
    delete allErrors.proofOfBelizeResidenceType;
    delete allErrors.proofOfBelizeResidenceFile;
  }
  if (phaseIndex === 4 && form.registrationMode !== "Registration by authorised person") {
    delete allErrors.authorisedVerificationCode;
  }
  if (phaseIndex === 4 && form.registrationMode !== "Self-registration") {
    delete allErrors.photoIdFile;
  }

  const phaseErrors: FieldErrors = {};
  for (const key of keys) {
    if (allErrors[key]) phaseErrors[key] = allErrors[key];
  }
  if (phaseIndex === 3 && allErrors.contact) {
    phaseErrors.contact = allErrors.contact;
  }
  return phaseErrors;
}

export function validateRegistrationPhase(
  phaseIndex: number,
  input: RegistrationProgressInput,
  options: { usernameTaken?: boolean; accountBacked?: boolean; accountEmail?: string } = {}
): FieldErrors {
  return collectPhaseErrors(phaseIndex, input, options);
}

export function validatePhasesThrough(
  throughPhaseIndex: number,
  input: RegistrationProgressInput,
  options: { usernameTaken?: boolean; accountBacked?: boolean; accountEmail?: string; extraErrors?: FieldErrors } = {}
): { errors: FieldErrors; firstErrorPhase: number | null } {
  const merged: FieldErrors = { ...(options.extraErrors ?? {}) };
  let firstErrorPhase: number | null = null;

  for (let i = 0; i <= throughPhaseIndex; i++) {
    const phaseErrors = collectPhaseErrors(i, input, options);
    for (const [key, message] of Object.entries(phaseErrors)) {
      if (!merged[key]) merged[key] = message;
    }
    if (firstErrorPhase === null && Object.keys(phaseErrors).length > 0) {
      firstErrorPhase = i;
    }
  }

  if (firstErrorPhase === null && options.extraErrors && Object.keys(options.extraErrors).length > 0) {
    firstErrorPhase = getFirstPhaseIndexForErrors(options.extraErrors);
  }

  return { errors: merged, firstErrorPhase };
}

export function isPhaseComplete(phaseIndex: number, input: RegistrationProgressInput): boolean {
  return Object.keys(validateRegistrationPhase(phaseIndex, input)).length === 0;
}

export function getRegistrationProgress(
  input: RegistrationProgressInput,
  activePhaseIndex: number
) {
  const safeIndex = Math.min(Math.max(activePhaseIndex, 0), REGISTRATION_PHASES.length - 1);
  const completedCount = safeIndex;
  const percent = Math.round(((safeIndex + 1) / REGISTRATION_PHASES.length) * 100);

  return {
    phases: REGISTRATION_PHASES.map((phase, index) => ({
      ...phase,
      status:
        index < safeIndex
          ? ("complete" as const)
          : index === safeIndex
            ? ("current" as const)
            : ("upcoming" as const),
    })),
    currentIndex: safeIndex,
    currentPhase: REGISTRATION_PHASES[safeIndex],
    completedCount,
    totalPhases: REGISTRATION_PHASES.length,
    percent,
  };
}

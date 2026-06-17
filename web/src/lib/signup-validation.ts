import type { SignupFormData } from "./auth-types";
import {
  cleanText,
  isEligibleCitizenship,
  meetsMinimumAge,
  passwordStrength,
  validEmail,
  validateCitizenship,
  validateDateOfBirth,
  type FieldErrors,
} from "./validation";
import { COMMONWEALTH_COUNTRIES } from "./constants";
import { validateEmailForBotSignup } from "./suspicious-email";

export type { FieldErrors };

export function validateSignupEligibility(
  data: Pick<SignupFormData, "citizenshipStatus" | "commonwealthCountry" | "dob">
): FieldErrors {
  const errors: FieldErrors = {};

  const citizenshipError = validateCitizenship(data.citizenshipStatus);
  if (citizenshipError) errors.citizenshipStatus = citizenshipError;

  if (data.citizenshipStatus === "Citizen of a Commonwealth country living in Belize") {
    if (!cleanText(data.commonwealthCountry)) {
      errors.commonwealthCountry = "Please select your Commonwealth country of citizenship.";
    } else if (!COMMONWEALTH_COUNTRIES.includes(data.commonwealthCountry)) {
      errors.commonwealthCountry = "Please select a valid Commonwealth country of citizenship.";
    }
  }

  if (!data.dob) {
    errors.dob = "Please select your month, day, and year of birth.";
  } else {
    const dobError = validateDateOfBirth(data.dob);
    if (dobError) errors.dob = dobError;
  }

  return errors;
}

export function isSignupEligible(
  data: Pick<SignupFormData, "citizenshipStatus" | "commonwealthCountry" | "dob">
): boolean {
  return (
    Object.keys(validateSignupEligibility(data)).length === 0 &&
    isEligibleCitizenship(data.citizenshipStatus) &&
    meetsMinimumAge(data.dob)
  );
}

export function validateSignupForm(data: SignupFormData): FieldErrors {
  const errors = validateSignupEligibility(data);

  if (!cleanText(data.firstName)) errors.firstName = "First name is required.";
  if (!cleanText(data.lastName)) errors.lastName = "Last name(s) is required.";

  if (!cleanText(data.email)) {
    errors.email = "Email address is required.";
  } else if (!validEmail(data.email)) {
    errors.email = "Please enter a valid email address.";
  } else {
    const suspiciousEmailError = validateEmailForBotSignup(data.email, {
      firstName: data.firstName,
      lastName: data.lastName,
    });
    if (suspiciousEmailError) errors.email = suspiciousEmailError;
  }

  if (!data.password) {
    errors.password = "Password is required.";
  } else {
    const strength = passwordStrength(data.password, "", data.firstName, data.lastName);
    if (!strength.meetsRequirement) {
      errors.password = strength.message;
    }
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else {
    const matchError = validatePasswordMatch(data.password, data.confirmPassword);
    if (matchError) errors.confirmPassword = matchError;
  }

  return errors;
}

export function validatePasswordMatch(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) return null;
  if (password !== confirmPassword) return "Passwords do not match.";
  return null;
}

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return Boolean(confirmPassword) && password === confirmPassword;
}

import { validatePasswordMatch } from "./signup-validation";
import { cleanText, passwordStrength, type FieldErrors } from "./validation";

export function validatePasswordResetForm(input: {
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!cleanText(input.password)) {
    errors.password = "Password is required.";
  } else {
    const strength = passwordStrength(
      input.password,
      "",
      input.firstName ?? "",
      input.lastName ?? ""
    );
    if (!strength.meetsRequirement) {
      errors.password = strength.message;
    }
  }

  if (!cleanText(input.confirmPassword)) {
    errors.confirmPassword = "Please confirm your password.";
  } else {
    const matchError = validatePasswordMatch(input.password, input.confirmPassword);
    if (matchError) errors.confirmPassword = matchError;
  }

  return errors;
}

export function validateStaffPasswordResetForm(input: {
  password: string;
  confirmPassword: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const password = input.password.trim();

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!cleanText(input.confirmPassword)) {
    errors.confirmPassword = "Please confirm your password.";
  } else {
    const matchError = validatePasswordMatch(input.password, input.confirmPassword);
    if (matchError) errors.confirmPassword = matchError;
  }

  return errors;
}

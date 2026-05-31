import type { RegistrationFormData } from "./registration-types";
import type { ProfileUpdateFormData } from "./profile-update-types";
import { isValidPhoneCountryCode } from "./phone-codes";
import {
  COMMONWEALTH_COUNTRIES,
  EDUCATION_LEVELS,
  ELIGIBLE_CITIZENSHIP_STATUSES,
  hasRegisteredCtvQuestion,
} from "./constants";
import { isValidDobString, parseBirthDate } from "./dob";

export const MIN_REGISTRATION_AGE = 18;

export function cleanText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

export function titleCaseName(name: string): string {
  const cleaned = cleanText(name);
  if (!cleaned) return "";
  return cleaned.split(/\s+/).map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ");
}

export function calculateAge(dob: string): number {
  const birth = parseBirthDate(dob);
  if (!birth) return -1;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function meetsMinimumAge(dob: string, minimum = MIN_REGISTRATION_AGE): boolean {
  if (!isValidDobString(dob)) return false;
  return calculateAge(dob) >= minimum;
}

export function validateDateOfBirth(dob: string): string | null {
  if (!dob) return "Please select your month, day, and year of birth.";
  if (!isValidDobString(dob)) return "Please select a valid date of birth.";
  const age = calculateAge(dob);
  if (age < MIN_REGISTRATION_AGE) {
    return "You are not eligible to register. Participants must be 18 years or older.";
  }
  return null;
}

export function phoneLocalDigits(localNumber: string): string {
  return localNumber.replace(/\D/g, "");
}

export function composePhoneNumber(countryCode: string, localNumber: string): string {
  const codeDigits = countryCode.replace(/\D/g, "");
  const localDigits = phoneLocalDigits(localNumber);
  if (!localDigits) return "";
  return `+${codeDigits} ${localDigits}`;
}

export function formatPhoneNumber(phone: string): string {
  const value = cleanText(phone);
  if (!value) return "";
  if (value.startsWith("+")) return value.replace(/\s+/g, " ").trim();
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value;
}

export function normalizePhoneForComparison(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function getFullPhoneNumber(
  data: Pick<RegistrationFormData, "phoneCountryCode" | "phoneLocalNumber">
): string {
  return composePhoneNumber(data.phoneCountryCode, data.phoneLocalNumber);
}

export function parseStoredPhoneNumber(phone: string): {
  phoneCountryCode: string;
  phoneLocalNumber: string;
} {
  const value = cleanText(phone);
  if (!value) {
    return { phoneCountryCode: "+501", phoneLocalNumber: "" };
  }

  const international = value.match(/^\+(\d{1,4})\s*(.+)$/);
  if (international) {
    return {
      phoneCountryCode: `+${international[1]}`,
      phoneLocalNumber: phoneLocalDigits(international[2]),
    };
  }

  return { phoneCountryCode: "+501", phoneLocalNumber: phoneLocalDigits(value) };
}

export function validatePhoneFields(
  data: Pick<RegistrationFormData, "phoneCountryCode" | "phoneLocalNumber">
): string | null {
  const localDigits = phoneLocalDigits(data.phoneLocalNumber);
  if (!localDigits) return null;
  if (!isValidPhoneCountryCode(data.phoneCountryCode)) {
    return "Please select a valid country code.";
  }
  if (localDigits.length < 7) {
    return "Phone number is too short. Enter the number without the country code.";
  }
  if (localDigits.length > 15) {
    return "Phone number is too long. Check the number and country code.";
  }
  return null;
}

export function countContactMethods(data: Pick<RegistrationFormData, "email" | "phoneCountryCode" | "phoneLocalNumber" | "facebook" | "instagram" | "tiktok" | "otherContact">): number {
  return [
    cleanText(data.email),
    getFullPhoneNumber(data),
    cleanText(data.facebook),
    cleanText(data.instagram),
    cleanText(data.tiktok),
    cleanText(data.otherContact),
  ].filter(Boolean).length;
}

export function validEmail(email: string): boolean {
  const value = cleanText(email);
  if (!value) return true;
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value);
}

export function looksLikeEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanText(value));
}

export function validUsername(username: string): boolean {
  return /^[A-Za-z0-9_.-]{4,20}$/.test(cleanText(username));
}

export function deriveUsernameFromEmail(email: string): string | null {
  const value = cleanText(email);
  const local = value.split("@")[0]?.replace(/[^A-Za-z0-9_.-]/g, "") ?? "";
  if (!validUsername(local)) return null;
  return local;
}

export function deriveAccountUsername(email: string, accountId: string): string {
  const fromEmail = deriveUsernameFromEmail(email);
  if (fromEmail) return fromEmail;
  const compactId = accountId.replace(/-/g, "").slice(0, 12);
  const fallback = `brp_${compactId}`;
  return validUsername(fallback) ? fallback : `brp${compactId.slice(0, 16)}`;
}

export function getRegistrationEmailForLogin(data: Pick<RegistrationFormData, "email" | "loginEmail" | "useRegistrationEmailAsUsername">): string {
  if (data.useRegistrationEmailAsUsername) return cleanText(data.email);
  return cleanText(data.loginEmail);
}

export type PasswordStrength = "Weak" | "Moderate" | "Strong";

export interface PasswordStrengthResult {
  label: PasswordStrength;
  message: string;
  percent: number;
  meetsRequirement: boolean;
}

export function passwordStrength(
  password: string,
  username = "",
  firstName = "",
  lastName = ""
): PasswordStrengthResult {
  const pwd = cleanText(password);
  const lower = pwd.toLowerCase();
  const user = cleanText(username).toLowerCase();
  const first = cleanText(firstName).toLowerCase();
  const last = cleanText(lastName).toLowerCase();

  const veryCommon = new Set([
    "password", "password1", "password123", "123456", "12345678",
    "qwerty", "abc123", "admin123", "letmein", "welcome",
  ]);

  if (!pwd) {
    return {
      label: "Weak",
      message: "Enter a password to see strength.",
      percent: 0,
      meetsRequirement: false,
    };
  }

  if (pwd.length < 8) {
    return {
      label: "Weak",
      message: "Password must be at least 8 characters long.",
      percent: 15,
      meetsRequirement: false,
    };
  }
  if (veryCommon.has(lower)) {
    return {
      label: "Weak",
      message: "Password is too common. Please choose a less predictable password.",
      percent: 20,
      meetsRequirement: false,
    };
  }
  if (user && lower.includes(user)) {
    return {
      label: "Weak",
      message: "Password should not contain your username.",
      percent: 20,
      meetsRequirement: false,
    };
  }
  if (first && lower.includes(first)) {
    return {
      label: "Weak",
      message: "Password should not contain your first name.",
      percent: 20,
      meetsRequirement: false,
    };
  }
  if (last && lower.includes(last)) {
    return {
      label: "Weak",
      message: "Password should not contain your last name.",
      percent: 20,
      meetsRequirement: false,
    };
  }

  let score = 0;
  if (pwd.length >= 10) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[a-z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score >= 4) {
    return {
      label: "Strong",
      message: "Strong password — good to use.",
      percent: 100,
      meetsRequirement: true,
    };
  }
  if (score >= 3) {
    return {
      label: "Moderate",
      message: "Moderate strength. A longer passphrase or symbol would make it stronger.",
      percent: 68,
      meetsRequirement: true,
    };
  }
  return {
    label: "Weak",
    message: "Too weak. Use a mix of upper and lower case letters, numbers, and symbols.",
    percent: 38,
    meetsRequirement: false,
  };
}

export function isPasswordStrongEnough(
  password: string,
  username = "",
  firstName = "",
  lastName = ""
): boolean {
  return passwordStrength(password, username, firstName, lastName).meetsRequirement;
}

export function isEligibleCitizenship(citizenshipStatus: string): boolean {
  return ELIGIBLE_CITIZENSHIP_STATUSES.includes(
    citizenshipStatus as (typeof ELIGIBLE_CITIZENSHIP_STATUSES)[number]
  );
}

export function validateCitizenship(citizenshipStatus: string): string | null {
  if (!cleanText(citizenshipStatus)) {
    return "Please select your citizenship / residency status.";
  }
  if (!isEligibleCitizenship(citizenshipStatus)) {
    return "You are not eligible to register. Only citizens of Belize and Commonwealth citizens living in Belize may join the panel.";
  }
  return null;
}

export function isRegisteredVoter(citizenshipStatus: string, votingStatus: string): boolean {
  return (
    (citizenshipStatus === "Citizen of Belize" ||
      citizenshipStatus === "Citizen of a Commonwealth country living in Belize") &&
    votingStatus === "Yes"
  );
}

export function normalizeContactHandle(value: string): string {
  const v = cleanText(value);
  if (!v) return "";
  if (/^(https?:\/\/|www\.)/i.test(v)) return v.toLowerCase();
  return v.replace(/\s/g, "").toLowerCase();
}

export function normalizeContactPlatform(value: string): string {
  const v = cleanText(value);
  if (!v) return "";
  const common: Record<string, string> = {
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    signal: "Signal",
    linkedin: "LinkedIn",
    wechat: "WeChat",
    snapchat: "Snapchat",
    x: "X",
    twitter: "X / Twitter",
    "twitter/x": "X / Twitter",
    "x/twitter": "X / Twitter",
    messenger: "Messenger",
    "facebook messenger": "Messenger",
    viber: "Viber",
    email: "Email",
    sms: "SMS",
  };
  return common[v.toLowerCase()] ?? v.replace(/\b\w/g, (c) => c.toUpperCase());
}

export type FieldErrors = Record<string, string>;

export function validateRegistrationForm(
  data: RegistrationFormData,
  options: {
    usernameTaken?: boolean;
    hardDuplicate?: boolean;
    accountBacked?: boolean;
    accountEmail?: string;
  } = {}
): FieldErrors {
  const errors: FieldErrors = {};
  const registeredVoter = isRegisteredVoter(data.citizenshipStatus, data.votingStatus);
  const contactCount = countContactMethods(data);
  const cityFinal = data.cityTownVillage === "Other" ? data.cityTownVillageOther : data.cityTownVillage;
  const otherPlatform =
    data.otherContactPlatform === "Other" ? data.otherContactPlatformCustom : data.otherContactPlatform;

  if (!data.dob) {
    errors.dob = "Please select your month, day, and year of birth.";
  } else {
    const dobError = validateDateOfBirth(data.dob);
    if (dobError) errors.dob = dobError;
  }

  if (!data.citizenshipStatus) {
    errors.citizenshipStatus = "Please select your citizenship / residency status.";
  } else {
    const citizenshipError = validateCitizenship(data.citizenshipStatus);
    if (citizenshipError) errors.citizenshipStatus = citizenshipError;
  }

  if (isEligibleCitizenship(data.citizenshipStatus)) {
    if (!data.votingStatus) errors.votingStatus = "Please indicate your voter registration status.";
  }

  if (data.citizenshipStatus === "Citizen of a Commonwealth country living in Belize") {
    if (!cleanText(data.commonwealthCountry)) {
      errors.commonwealthCountry = "Please select your Commonwealth country of citizenship.";
    } else if (!COMMONWEALTH_COUNTRIES.includes(data.commonwealthCountry)) {
      errors.commonwealthCountry = "Please select a valid Commonwealth country of citizenship.";
    }
  }

  if (data.citizenshipStatus === "Citizen of a Commonwealth country living in Belize" && data.placeOfResidence === "Abroad") {
    errors.placeOfResidence = "Commonwealth citizens must be living in Belize to be eligible under this registration category.";
  }

  if (data.citizenshipStatus === "Citizen of a Commonwealth country living in Belize") {
    if (!cleanText(data.proofOfBelizeResidenceType)) {
      errors.proofOfBelizeResidenceType = "Please provide proof of residence in Belize for Commonwealth citizens.";
    }
    if (!data.proofOfBelizeResidenceFile) {
      errors.proofOfBelizeResidenceFile = "Please upload proof of Belize residence for Commonwealth citizens.";
    }
  }

  if (!cleanText(data.firstName)) errors.firstName = "First name is required.";
  if (!cleanText(data.lastName)) errors.lastName = "Last name is required.";
  if (!data.sex) errors.sex = "Sex is required.";
  if (!data.education) errors.education = "Education level is required.";
  if (!data.ethnicity) errors.ethnicity = "Ethnicity is required.";
  if (!data.placeOfResidence) errors.placeOfResidence = errors.placeOfResidence ?? "Residence selection is required.";

  if (data.placeOfResidence === "Abroad") {
    if (!data.countryIfAbroad) {
      errors.countryIfAbroad = "Country of residence is required.";
    }
    if (!cleanText(data.cityTownVillage)) {
      errors.cityTownVillage = "Current city / town / village is required.";
    }
    const isUsAbroad = ["United States", "USA", "United States of America"].includes(data.countryIfAbroad);
    if (isUsAbroad && !data.usDiasporaRegion) {
      errors.usDiasporaRegion = "US region is required.";
    }
  } else if (data.placeOfResidence && !data.cityTownVillage) {
    errors.cityTownVillage = "City / Town / Village is required.";
  }
  if (data.placeOfResidence !== "Abroad" && data.cityTownVillage === "Other" && !cleanText(data.cityTownVillageOther)) {
    errors.cityTownVillageOther = "Please specify city / town / village.";
  }

  if (registeredVoter && !data.constituency) {
    errors.constituency = "Constituency is required for registered voters.";
  }
  if (registeredVoter && hasRegisteredCtvQuestion(data.constituency) && !cleanText(data.registeredCtvArea)) {
    errors.registeredCtvArea = "Village / town / city area of voter registration is required for registered voters.";
  }
  if (registeredVoter && data.politicalInterests.length === 0) {
    errors.politicalInterests = "Please select at least one political / election poll interest.";
  }
  if (data.placeOfResidence !== "Abroad" && data.placeOfResidence && data.marketInterests.length === 0) {
    errors.marketInterests = "Please select at least one market research interest.";
  }
  if (data.civicInterests.length === 0) {
    errors.civicInterests = "Please select at least one civic / public / social issue.";
  }

  if (contactCount < 2 && !cleanText(data.streetAddress)) {
    errors.contact = "Please provide at least two contact methods, or a street address if no electronic contact is available.";
  }

  if (data.email && !validEmail(data.email)) errors.email = "Please enter a valid email address.";
  const phoneError = validatePhoneFields(data);
  if (phoneError) errors.phoneLocalNumber = phoneError;
  if (options.accountBacked && options.accountEmail) {
    if (cleanText(data.email).toLowerCase() !== cleanText(options.accountEmail).toLowerCase()) {
      errors.email = "Contact email must match your account email.";
    }
  }
  if (otherPlatform === "Second email address" && cleanText(data.otherContact) && !validEmail(data.otherContact)) {
    errors.otherContact = "Second email address is selected, but the value entered is not a valid email address.";
  }
  if (!options.accountBacked && data.loginEmail && !validEmail(data.loginEmail)) {
    errors.loginEmail = "Please enter a valid login email address.";
  }

  if (!options.accountBacked && data.useRegistrationEmailAsUsername) {
    if (!cleanText(data.email) || !validEmail(data.email)) {
      errors.loginEmail = "Add a valid registration email in the Contact section to use it as your username.";
    } else {
      const derived = deriveUsernameFromEmail(data.email);
      if (!derived) {
        errors.username =
          "Your registration email cannot be used as a username. The part before @ must be 4–20 letters, numbers, underscores, hyphens, or periods.";
      }
    }
  }

  if (!data.contactDetailsConfirmed) {
    errors.contactDetailsConfirmed = "Please confirm that your contact information is correct.";
  }

  if (!data.photoIdType) errors.photoIdType = "Photo ID type is required.";
  if (data.registrationMode === "Self-registration" && !data.photoIdFile) {
    errors.photoIdFile = "Photo ID upload is required for self-registration.";
  }
  if (data.registrationMode === "Registration by authorised person" && !cleanText(data.authorisedVerificationCode)) {
    errors.authorisedVerificationCode = "Please enter the authorised verification code.";
  }

  if (!options.accountBacked) {
    if (!validUsername(data.username)) {
      errors.username = "Valid username is required. Use 4–20 letters, numbers, underscores, hyphens, or periods.";
    } else if (options.usernameTaken) {
      errors.username = "Username already exists.";
    }

    if (!data.password) {
      errors.password = "Password is required.";
    } else {
      const strength = passwordStrength(data.password, data.username, data.firstName, data.lastName);
      if (!strength.meetsRequirement) {
        errors.password = strength.message;
      }
    }

    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = "Password and confirm password do not match.";
    }
  }

  if (!data.consentResearch) errors.consentResearch = "Research participation consent is required.";
  if (!data.consentContact) errors.consentContact = "Contact consent is required.";
  if (!data.consentPrivacy) errors.consentPrivacy = "Privacy acknowledgement is required.";
  if (!data.finalReviewConfirmed) {
    errors.finalReviewConfirmed = "Please review and confirm the full registration form before submitting.";
  }

  if (options.hardDuplicate) {
    errors.submit = "A duplicate registration appears to exist based on email, phone, name + date of birth, or photo ID details.";
  }

  void cityFinal;

  return errors;
}

export function validateProfileUpdateForm(
  data: ProfileUpdateFormData,
  options: { accountEmail: string; currentPhone: string }
): FieldErrors {
  const errors: FieldErrors = {};
  const registeredVoter = isRegisteredVoter(data.citizenshipStatus, data.votingStatus);
  const { phoneCountryCode, phoneLocalNumber } = parseStoredPhoneNumber(options.currentPhone);
  const contactCount = countContactMethods({
    email: options.accountEmail,
    phoneCountryCode,
    phoneLocalNumber,
    facebook: data.facebook,
    instagram: data.instagram,
    tiktok: data.tiktok,
    otherContact: data.otherContact,
  });
  const otherPlatform =
    data.otherContactPlatform === "Other" ? data.otherContactPlatformCustom : data.otherContactPlatform;

  if (!data.education) {
    errors.education = "Education level is required.";
  } else if (!EDUCATION_LEVELS.includes(data.education)) {
    errors.education = "Please select a valid education level.";
  }

  if (!data.citizenshipStatus) {
    errors.citizenshipStatus = "Please select your citizenship / residency status.";
  } else {
    const citizenshipError = validateCitizenship(data.citizenshipStatus);
    if (citizenshipError) errors.citizenshipStatus = citizenshipError;
  }

  if (isEligibleCitizenship(data.citizenshipStatus) && !data.votingStatus) {
    errors.votingStatus = "Please indicate your voter registration status.";
  }

  if (data.citizenshipStatus === "Citizen of a Commonwealth country living in Belize") {
    if (!cleanText(data.commonwealthCountry)) {
      errors.commonwealthCountry = "Please select your Commonwealth country of citizenship.";
    } else if (!COMMONWEALTH_COUNTRIES.includes(data.commonwealthCountry)) {
      errors.commonwealthCountry = "Please select a valid Commonwealth country of citizenship.";
    }
  }

  if (
    data.citizenshipStatus === "Citizen of a Commonwealth country living in Belize" &&
    data.placeOfResidence === "Abroad"
  ) {
    errors.placeOfResidence =
      "Commonwealth citizens must be living in Belize to be eligible under this registration category.";
  }

  if (!data.placeOfResidence) {
    errors.placeOfResidence = "Residence selection is required.";
  }

  if (data.placeOfResidence === "Abroad") {
    if (!data.countryIfAbroad) {
      errors.countryIfAbroad = "Country of residence is required.";
    }
    if (!cleanText(data.cityTownVillage)) {
      errors.cityTownVillage = "Current city / town / village is required.";
    }
  } else if (data.placeOfResidence && !data.cityTownVillage) {
    errors.cityTownVillage = "City / town / village is required.";
  }

  if (
    data.placeOfResidence !== "Abroad" &&
    data.cityTownVillage === "Other" &&
    !cleanText(data.cityTownVillageOther)
  ) {
    errors.cityTownVillageOther = "Please specify city / town / village.";
  }

  if (registeredVoter && !data.constituency) {
    errors.constituency = "Constituency is required for registered voters.";
  }
  if (registeredVoter && hasRegisteredCtvQuestion(data.constituency) && !cleanText(data.registeredCtvArea)) {
    errors.registeredCtvArea = "Village / town / city area of voter registration is required for registered voters.";
  }

  if (registeredVoter && data.politicalInterests.length === 0) {
    errors.politicalInterests = "Please select at least one political / election poll interest.";
  }
  if (data.placeOfResidence !== "Abroad" && data.placeOfResidence && data.marketInterests.length === 0) {
    errors.marketInterests = "Please select at least one market research interest.";
  }
  if (data.civicInterests.length === 0) {
    errors.civicInterests = "Please select at least one civic / public / social issue.";
  }

  if (contactCount < 2 && !cleanText(data.streetAddress)) {
    errors.contact =
      "Please provide at least two contact methods, or a street address if no electronic contact is available.";
  }

  if (otherPlatform === "Second email address" && cleanText(data.otherContact) && !validEmail(data.otherContact)) {
    errors.otherContact = "Second email address is selected, but the value entered is not a valid email address.";
  }

  return errors;
}

import type { RegistrationMode } from "./constants";
import { DEFAULT_PHONE_COUNTRY_CODE } from "./phone-codes";

export interface RegistrationFormData {
  registrationMode: RegistrationMode;
  authorisedVerificationCode: string;
  dob: string;
  citizenshipStatus: string;
  commonwealthCountry: string;
  votingStatus: string;
  firstName: string;
  lastName: string;
  sex: string;
  education: string;
  ethnicity: string;
  placeOfResidence: string;
  cityTownVillage: string;
  cityTownVillageOther: string;
  countryIfAbroad: string;
  usDiasporaRegion: string;
  constituency: string;
  registeredCtvArea: string;
  politicalInterests: string[];
  marketInterests: string[];
  civicInterests: string[];
  email: string;
  phoneCountryCode: string;
  phoneLocalNumber: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  otherContactPlatform: string;
  otherContactPlatformCustom: string;
  otherContact: string;
  streetAddress: string;
  contactDetailsConfirmed: boolean;
  photoIdType: string;
  photoIdFile: File | null;
  proofOfBelizeResidenceType: string;
  proofOfBelizeResidenceFile: File | null;
  username: string;
  useRegistrationEmailAsUsername: boolean;
  loginEmail: string;
  password: string;
  confirmPassword: string;
  consentResearch: boolean;
  consentContact: boolean;
  consentPrivacy: boolean;
  finalReviewConfirmed: boolean;
}

export const initialRegistrationForm: RegistrationFormData = {
  registrationMode: "Self-registration",
  authorisedVerificationCode: "",
  dob: "",
  citizenshipStatus: "",
  commonwealthCountry: "",
  votingStatus: "",
  firstName: "",
  lastName: "",
  sex: "",
  education: "",
  ethnicity: "",
  placeOfResidence: "",
  cityTownVillage: "",
  cityTownVillageOther: "",
  countryIfAbroad: "",
  usDiasporaRegion: "",
  constituency: "",
  registeredCtvArea: "",
  politicalInterests: [],
  marketInterests: [],
  civicInterests: [],
  email: "",
  phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
  phoneLocalNumber: "",
  facebook: "",
  instagram: "",
  tiktok: "",
  otherContactPlatform: "",
  otherContactPlatformCustom: "",
  otherContact: "",
  streetAddress: "",
  contactDetailsConfirmed: false,
  photoIdType: "",
  photoIdFile: null,
  proofOfBelizeResidenceType: "",
  proofOfBelizeResidenceFile: null,
  username: "",
  useRegistrationEmailAsUsername: false,
  loginEmail: "",
  password: "",
  confirmPassword: "",
  consentResearch: false,
  consentContact: false,
  consentPrivacy: false,
  finalReviewConfirmed: false,
};

export interface RegistrationSuccess {
  verificationStatus: string;
}

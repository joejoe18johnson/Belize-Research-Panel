import type { RegistrationMode } from "./constants";
import { emptyOrganisationEntry, type OrganisationEntry } from "./organisations";
import { DEFAULT_PHONE_COUNTRY_CODE } from "./phone-codes";

export type { OrganisationEntry };

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
  householdHeadRelationship: string;
  householdSize: string;
  placeOfResidence: string;
  cityTownVillage: string;
  cityTownVillageOther: string;
  countryIfAbroad: string;
  countryIfAbroadOther: string;
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
  addressCityVillage: string;
  addressDistrict: string;
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
  ownsBusinessOrNgo: string;
  organisations: OrganisationEntry[];
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
  householdHeadRelationship: "",
  householdSize: "",
  placeOfResidence: "",
  cityTownVillage: "",
  cityTownVillageOther: "",
  countryIfAbroad: "",
  countryIfAbroadOther: "",
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
  addressCityVillage: "",
  addressDistrict: "",
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
  ownsBusinessOrNgo: "",
  organisations: [],
  finalReviewConfirmed: false,
};

export { emptyOrganisationEntry };

export interface RegistrationSuccess {
  verificationStatus: string;
}

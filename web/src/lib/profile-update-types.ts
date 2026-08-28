import { DEFAULT_PHONE_COUNTRY_CODE } from "./phone-codes";

export interface ProfileUpdateFormData {
  education: string;
  citizenshipStatus: string;
  commonwealthCountry: string;
  votingStatus: string;
  constituency: string;
  registeredCtvArea: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  otherContactPlatform: string;
  otherContactPlatformCustom: string;
  otherContact: string;
  streetAddress: string;
  placeOfResidence: string;
  cityTownVillage: string;
  cityTownVillageOther: string;
  countryIfAbroad: string;
  usDiasporaRegion: string;
  politicalInterests: string[];
  marketInterests: string[];
  civicInterests: string[];
}

export const initialProfileUpdateForm: ProfileUpdateFormData = {
  education: "",
  citizenshipStatus: "",
  commonwealthCountry: "",
  votingStatus: "",
  constituency: "",
  registeredCtvArea: "",
  facebook: "",
  instagram: "",
  tiktok: "",
  otherContactPlatform: "",
  otherContactPlatformCustom: "",
  otherContact: "",
  streetAddress: "",
  placeOfResidence: "",
  cityTownVillage: "",
  cityTownVillageOther: "",
  countryIfAbroad: "",
  usDiasporaRegion: "",
  politicalInterests: [],
  marketInterests: [],
  civicInterests: [],
};

export interface ProfileContactDisplay {
  email: string;
  phone: string;
  phoneCountryCode: string;
  phoneLocalNumber: string;
}

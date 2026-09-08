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
  addressCityVillage: string;
  addressDistrict: string;
  placeOfResidence: string;
  cityTownVillage: string;
  cityTownVillageOther: string;
  countryIfAbroad: string;
  countryIfAbroadOther: string;
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
  addressCityVillage: "",
  addressDistrict: "",
  placeOfResidence: "",
  cityTownVillage: "",
  cityTownVillageOther: "",
  countryIfAbroad: "",
  countryIfAbroadOther: "",
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

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  CheckboxField,
  choiceBoxLabelClass,
  Field,
  FieldGroup,
  FileInput,
  FormSection,
  MultiSelect,
  SelectInput,
  siteRadioClass,
  TextInput,
} from "./form-ui";
import { DateOfBirthPicker } from "./DateOfBirthPicker";
import { RegistrationProgress } from "./RegistrationProgress";
import { RegistrationPhaseNav } from "./RegistrationPhaseNav";
import { PhoneNumberField } from "./PhoneNumberField";
import { SocialContactField } from "./SocialContactField";
import { StreetAddressFields } from "./StreetAddressFields";
import { useRegistrationCopy } from "@/components/locale/LocaleProvider";
import {
  BELIZE_DISTRICTS,
  CITIZENSHIP_STATUS,
  CITY_TOWN_VILLAGE,
  COMMONWEALTH_RESIDENCE_PROOF_TYPES,
  COUNTRIES,
  EDUCATION_LEVELS,
  ETHNICITY_OPTIONS,
  HOUSEHOLD_DEFINITION,
  HEAD_OF_HOUSEHOLD_DEFINITION,
  HOUSEHOLD_HEAD_OPTIONS,
  MAX_HOUSEHOLD_SIZE,
  MARKET_INTERESTS,
  MAX_MARKET_INTERESTS,
  OTHER_CONTACT_PLATFORM_OPTIONS,
  OTHER_RESIDENCE_COUNTRIES,
  PHOTO_ID_TYPES,
  SEX_OPTIONS,
  US_DIASPORA_REGIONS,
  VOTING_STATUS,
  getConstituencyOptions,
  getRegisteredCtvOptions,
  getResidenceOptions,
  hasRegisteredCtvQuestion,
  isCommonwealthCitizenInBelize,
  isHeadOfHousehold,
  isUnitedStatesCountry,
  mustLiveAbroad,
  needsVoterRegistrationQuestion,
} from "@/lib/constants";
import {
  initialRegistrationForm,
  type RegistrationFormData,
} from "@/lib/registration-types";
import { getPhoneNumberRule, phoneCountryCodeForCountry } from "@/lib/phone-codes";
import {
  countAllContactMeans,
  countContactMethods,
  cleanText,
  getFullPhoneNumber,
  hasCompletePhysicalAddressContact,
  livesInBelizeResidence,
  phoneLocalDigits,
  streetAddressRequiredForContacts,
  isEligibleCitizenship,
  isRegisteredVoter,
  validateRegistrationForm,
  type FieldErrors,
} from "@/lib/validation";
import { formatStreetAddressDisplay } from "@/lib/street-address";
import { formatDobDisplay } from "@/lib/dob";
import { observeStickyChrome, scrollElementToTop, scrollViewportToTop, syncStickyChromeOffsets } from "@/lib/scroll-viewport";
import {
  getPhaseFieldKeys,
  getFirstPhaseIndexForErrors,
  getNextRegistrationPhaseIndex,
  getOrderedErrorKeys,
  getPreviousRegistrationPhaseIndex,
  REGISTRATION_PHASES,
  resolveSelectablePhaseIndex,
  skipsInterestsPhase,
  validatePhasesThrough,
  validateRegistrationPhase,
} from "@/lib/registration-progress";
import {
  clearRegistrationDraft,
  draftRestoredFileHint,
  loadRegistrationDraft,
  loadRegistrationDraftFiles,
  mergeDraftIntoForm,
  saveRegistrationDraft,
  saveRegistrationDraftFiles,
} from "@/lib/registration-draft-storage";

function clearFieldError(errors: FieldErrors, key: string): FieldErrors {
  if (!errors[key]) return errors;
  const next = { ...errors };
  delete next[key];
  return next;
}

function findRegistrationErrorTarget(key: string): HTMLElement | null {
  const candidates = [key, `${key}-section`];
  if (key.startsWith("consent")) candidates.push("consent-section");
  if (key === "contact") candidates.push("contact-section");
  if (key === "photoIdFile" || key === "photoIdType") candidates.push("photo-id-section");
  for (const id of candidates) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  const byName = document.querySelector(`[name="${CSS.escape(key)}"]`);
  if (byName instanceof HTMLElement) return byName;
  return null;
}

function scrollElementIntoView(el: HTMLElement) {
  scrollElementToTop(el);
}

export interface RegistrationAccountContext {
  firstName: string;
  lastName: string;
  email: string;
  citizenshipStatus?: string;
  commonwealthCountry?: string;
  dob?: string;
}

function buildInitialForm(account: RegistrationAccountContext): RegistrationFormData {
  const citizenshipStatus = account.citizenshipStatus ?? "";
  return {
    ...initialRegistrationForm,
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
    citizenshipStatus,
    commonwealthCountry: account.commonwealthCountry ?? "",
    dob: account.dob ?? "",
    placeOfResidence: mustLiveAbroad(citizenshipStatus) ? "Abroad" : "",
  };
}

export function RegistrationForm({ account }: { account: RegistrationAccountContext }) {
  const router = useRouter();
  const [form, setForm] = useState<RegistrationFormData>(() => {
    const base = buildInitialForm(account);
    const draft = loadRegistrationDraft(account.email);
    return draft ? mergeDraftIntoForm(base, draft) : base;
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [activePhaseIndex, setActivePhaseIndex] = useState(() => {
    const draft = loadRegistrationDraft(account.email);
    return draft?.activePhaseIndex ?? 0;
  });
  const [furthestPhaseIndex, setFurthestPhaseIndex] = useState(() => {
    const draft = loadRegistrationDraft(account.email);
    const current = draft?.activePhaseIndex ?? 0;
    return Math.max(current, draft?.furthestPhaseIndex ?? current);
  });
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const [draftFilesReady, setDraftFilesReady] = useState(false);
  const [phaseAttempted, setPhaseAttempted] = useState(false);
  const scrollToTopAfterPhaseChange = useRef(false);
  const pendingErrorScrollKeys = useRef<string[] | null>(null);
  const copy = useRegistrationCopy();

  useEffect(() => {
    let cancelled = false;
    void loadRegistrationDraftFiles(account.email).then((files) => {
      if (cancelled) return;
      setForm((prev) => ({
        ...prev,
        photoIdFile: files.photoIdFile ?? prev.photoIdFile,
        proofOfBelizeResidenceFile: files.proofOfBelizeResidenceFile ?? prev.proofOfBelizeResidenceFile,
      }));
      const draft = loadRegistrationDraft(account.email);
      if (draft) {
        const hint = draftRestoredFileHint(draft, files);
        if (hint) setDraftNotice(hint);
      }
      setDraftFilesReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [account.email]);

  useEffect(() => observeStickyChrome(), []);

  // Diaspora citizenship hides the district picker; ensure placeOfResidence is Abroad
  // so the country-of-residence fields always render (drafts/account prefill can miss this).
  useEffect(() => {
    if (!mustLiveAbroad(form.citizenshipStatus)) return;
    if (form.placeOfResidence === "Abroad") return;
    setForm((prev) => ({
      ...prev,
      placeOfResidence: "Abroad",
      cityTownVillage: "",
      cityTownVillageOther: "",
    }));
  }, [form.citizenshipStatus, form.placeOfResidence]);

  // Only collect street/house when address is required as a last-resort contact method.
  // District and CTV stay synced from residence details (step 6).
  useEffect(() => {
    const digitalCount = countContactMethods({
      ...form,
      email: cleanText(form.email) || cleanText(account.email),
    });
    const required = streetAddressRequiredForContacts(form.placeOfResidence, digitalCount);
    if (required) return;
    if (!form.streetAddress && !form.addressHouseNumber) return;
    setForm((prev) => ({
      ...prev,
      streetAddress: "",
      addressHouseNumber: "",
    }));
  }, [
    account.email,
    form.placeOfResidence,
    form.email,
    form.phoneCountryCode,
    form.phoneLocalNumber,
    form.facebook,
    form.instagram,
    form.tiktok,
    form.otherContact,
    form.streetAddress,
    form.addressHouseNumber,
  ]);

  useEffect(() => {
    saveRegistrationDraft({
      accountEmail: account.email,
      form,
      activePhaseIndex,
      furthestPhaseIndex,
    });
  }, [account.email, form, activePhaseIndex, furthestPhaseIndex]);

  useEffect(() => {
    if (!draftFilesReady) return;
    void saveRegistrationDraftFiles(account.email, {
      photoIdFile: form.photoIdFile,
      proofOfBelizeResidenceFile: form.proofOfBelizeResidenceFile,
    });
  }, [account.email, draftFilesReady, form.photoIdFile, form.proofOfBelizeResidenceFile]);

  // Keep contact-address district / CTV aligned with residence details (step 6).
  useEffect(() => {
    if (!livesInBelizeResidence(form.placeOfResidence)) return;
    const nextDistrict = form.placeOfResidence;
    const nextCity = form.cityTownVillage;
    const nextCityOther = form.cityTownVillage === "Other" ? form.cityTownVillageOther : "";
    if (
      form.addressDistrict === nextDistrict &&
      form.addressCityVillage === nextCity &&
      form.addressCityVillageOther === nextCityOther
    ) {
      return;
    }
    setForm((prev) => ({
      ...prev,
      addressDistrict: nextDistrict,
      addressCityVillage: nextCity,
      addressCityVillageOther: nextCityOther,
    }));
  }, [
    form.placeOfResidence,
    form.cityTownVillage,
    form.cityTownVillageOther,
    form.addressDistrict,
    form.addressCityVillage,
    form.addressCityVillageOther,
  ]);

  useEffect(() => {
    if (!skipsInterestsPhase(form.placeOfResidence)) return;
    if (activePhaseIndex !== 3) return;
    setActivePhaseIndex(4);
    setFurthestPhaseIndex((furthest) => Math.max(furthest, 4));
  }, [activePhaseIndex, form.placeOfResidence]);

  const validationOptions = useMemo(
    () => ({ accountBacked: true as const, accountEmail: account.email }),
    [account.email]
  );

  const jumpToResidenceDetails = useCallback(() => {
    scrollToTopAfterPhaseChange.current = false;
    setPhaseAttempted(false);
    setActivePhaseIndex(2);
    setFurthestPhaseIndex((furthest) => Math.max(furthest, 2));
    window.setTimeout(() => {
      const el = document.getElementById("residence-section");
      if (el) scrollElementToTop(el);
    }, 50);
  }, []);

  const update = useCallback(<K extends keyof RegistrationFormData>(key: K, value: RegistrationFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "householdHeadRelationship" && !isHeadOfHousehold(String(value))) {
        next.householdSize = "";
      }
      if (key === "placeOfResidence") {
        next.cityTownVillage = "";
        next.cityTownVillageOther = "";
        next.countryIfAbroad = "";
        next.countryIfAbroadOther = "";
        next.usDiasporaRegion = "";
        if (typeof value === "string" && BELIZE_DISTRICTS.includes(value)) {
          next.addressDistrict = value;
          next.addressCityVillage = "";
          next.addressCityVillageOther = "";
        } else {
          next.addressDistrict = "";
          next.addressCityVillage = "";
          next.addressCityVillageOther = "";
        }
      }
      if (key === "constituency") {
        next.registeredCtvArea = "";
      }
      if (key === "cityTownVillage") {
        next.addressCityVillage = String(value ?? "");
        if (value !== "Other") {
          next.cityTownVillageOther = "";
          next.addressCityVillageOther = "";
        }
      }
      if (key === "cityTownVillageOther") {
        next.addressCityVillageOther = String(value ?? "");
      }
      if (key === "otherContactPlatform" && value !== "Other") {
        next.otherContactPlatformCustom = "";
      }
      if (key === "countryIfAbroad" && typeof value === "string") {
        next.usDiasporaRegion = "";
        if (value !== "Other") next.countryIfAbroadOther = "";
        const suggestedCode = phoneCountryCodeForCountry(value);
        if (suggestedCode && !next.phoneLocalNumber.trim()) {
          next.phoneCountryCode = suggestedCode;
        }
      }
      return next;
    });
    setErrors((prev) => clearFieldError(prev, String(key)));
  }, []);

  const touch = (key: string) => setTouched((prev) => ({ ...prev, [key]: true }));

  const updateDob = (dob: string) => {
    update("dob", dob);
  };

  const updateCitizenship = (citizenshipStatus: string) => {
    setForm((prev) => ({
      ...prev,
      citizenshipStatus,
      commonwealthCountry: "",
      votingStatus: "",
      placeOfResidence: mustLiveAbroad(citizenshipStatus) ? "Abroad" : "",
      cityTownVillage: "",
      cityTownVillageOther: "",
      countryIfAbroad: "",
      countryIfAbroadOther: "",
      usDiasporaRegion: "",
      constituency: "",
      registeredCtvArea: "",
      proofOfBelizeResidenceType: "",
      proofOfBelizeResidenceFile: null,
    }));
    setErrors((prev) =>
      clearFieldError(clearFieldError(prev, "citizenshipStatus"), "votingStatus")
    );
  };

  const eligibleCitizenship = isEligibleCitizenship(form.citizenshipStatus);
  const citizenshipIneligible =
    activePhaseIndex === 1 && Boolean(form.citizenshipStatus) && !eligibleCitizenship;
  const needsCommonwealthCountry = isCommonwealthCitizenInBelize(form.citizenshipStatus);
  const needsVoterQuestion = needsVoterRegistrationQuestion(form.citizenshipStatus);
  const registeredVoter = isRegisteredVoter(form.citizenshipStatus, form.votingStatus);
  const progressInput = { form, registeredVoter };
  const isLastPhase = activePhaseIndex === REGISTRATION_PHASES.length - 1;
  const residenceOptions = getResidenceOptions(form.citizenshipStatus);
  const cityOptions =
    form.placeOfResidence && form.placeOfResidence !== "Abroad"
      ? CITY_TOWN_VILLAGE[form.placeOfResidence] ?? []
      : [];
  const ctvOptions = getRegisteredCtvOptions(form.constituency);
  const contactCount = countContactMethods({
    ...form,
    email: cleanText(form.email) || cleanText(account.email),
  });
  const totalContactMeans = countAllContactMeans({
    ...form,
    email: cleanText(form.email) || cleanText(account.email),
  });
  const physicalAddressComplete = hasCompletePhysicalAddressContact(form);
  const meetsContactMinimum = totalContactMeans >= 2;
  /** Show physical address as a contact method when Belize resident has fewer than 2 digital means. */
  const showPhysicalAddressContact = streetAddressRequiredForContacts(
    form.placeOfResidence,
    contactCount
  );
  const streetAddressRequired = showPhysicalAddressContact;
  const phoneDisplay = getFullPhoneNumber(form);
  const otherPlatform =
    form.otherContactPlatform === "Other"
      ? form.otherContactPlatformCustom
      : form.otherContactPlatform;
  const otherContactDisplay =
    [otherPlatform, form.otherContact].filter(Boolean).join(": ") || "";
  const countryAbroadDisplay =
    form.countryIfAbroad === "Other"
      ? form.countryIfAbroadOther || form.countryIfAbroad
      : form.countryIfAbroad;

  const reviewRows = useMemo(() => {
    const asked = (value: string) => (cleanText(value) ? value : copy.notProvided);
    const na = copy.notApplicable;
    const livingAbroad = form.placeOfResidence === "Abroad";
    const livingInBelize = livesInBelizeResidence(form.placeOfResidence);
    const headOfHousehold = isHeadOfHousehold(form.householdHeadRelationship);
    const voterAsked = needsVoterRegistrationQuestion(form.citizenshipStatus);
    const ctvAsked = registeredVoter && hasRegisteredCtvQuestion(form.constituency);
    const interestsAsked = !skipsInterestsPhase(form.placeOfResidence);
    const usRegionAsked = livingAbroad && isUnitedStatesCountry(form.countryIfAbroad);
    const proofAsked = isCommonwealthCitizenInBelize(form.citizenshipStatus);
    const addressAsked = streetAddressRequired || physicalAddressComplete;
    const rl = copy.reviewLabels;

    const cityValue =
      form.cityTownVillage === "Other" ? form.cityTownVillageOther : form.cityTownVillage;

    const rows: [string, string][] = [
      [rl.citizenship, asked(form.citizenshipStatus)],
      [
        rl.registeredVoter,
        voterAsked ? asked(form.votingStatus) : na,
      ],
      [rl.firstName, asked(form.firstName)],
      [rl.lastName, asked(form.lastName)],
      [rl.dob, form.dob ? formatDobDisplay(form.dob) : copy.notProvided],
      [rl.sex, asked(form.sex)],
      [rl.education, asked(form.education)],
      [rl.ethnicity, asked(form.ethnicity)],
      [rl.householdHead, asked(form.householdHeadRelationship)],
      [rl.householdSize, headOfHousehold ? asked(form.householdSize) : na],
      [
        rl.currentResidence,
        asked(form.placeOfResidence === "Abroad" ? rl.livingAbroad : form.placeOfResidence),
      ],
      [rl.districtLive, livingInBelize ? asked(form.placeOfResidence) : na],
      [rl.cityTownVillage, livingInBelize ? asked(cityValue) : na],
      [rl.countryAbroad, livingAbroad ? asked(countryAbroadDisplay) : na],
      [rl.usRegion, usRegionAsked ? asked(form.usDiasporaRegion) : na],
      [rl.constituency, registeredVoter ? asked(form.constituency) : na],
      [rl.registeredCtv, ctvAsked ? asked(form.registeredCtvArea) : na],
      [
        rl.marketInterests,
        interestsAsked ? asked(form.marketInterests.join(", ")) : na,
      ],
      [rl.accountEmail, asked(account.email)],
      [rl.phone, asked(getFullPhoneNumber(form))],
      [rl.facebook, asked(form.facebook)],
      [rl.instagram, asked(form.instagram)],
      [rl.tiktok, asked(form.tiktok)],
      [rl.otherPlatform, asked(otherPlatform)],
      [rl.otherContact, asked(form.otherContact)],
      [rl.streetAddress, addressAsked ? asked([form.addressHouseNumber, form.streetAddress].filter(Boolean).join(" ")) : na],
      [rl.cityOrVillage, addressAsked ? asked(form.addressCityVillage === "Other" ? form.addressCityVillageOther : form.addressCityVillage) : na],
      [rl.addressDistrict, addressAsked ? asked(form.addressDistrict) : na],
      [rl.photoIdType, asked(form.photoIdType)],
      [
        rl.proofResidence,
        proofAsked ? asked(form.proofOfBelizeResidenceType) : na,
      ],
    ];

    return rows;
  }, [
    form,
    otherPlatform,
    countryAbroadDisplay,
    physicalAddressComplete,
    account.email,
    registeredVoter,
    streetAddressRequired,
    copy,
  ]);

  const validateField = <K extends keyof RegistrationFormData>(
    key: K,
    nextValue?: RegistrationFormData[K]
  ) => {
    const data = nextValue === undefined ? form : { ...form, [key]: nextValue };
    const fieldErrors = validateRegistrationForm(data, validationOptions);
    const message = fieldErrors[key as string];
    setErrors((prev) => (message ? { ...prev, [key]: message } : clearFieldError(prev, String(key))));
  };

  const touchAndValidate = (key: keyof RegistrationFormData) => {
    touch(String(key));
    validateField(key);
  };

  const scrollToRegistrationTop = useCallback(() => {
    scrollViewportToTop();
  }, []);

  const scrollToFirstError = useCallback((errorKeys: string[]) => {
    for (const key of errorKeys) {
      const el = findRegistrationErrorTarget(key);
      if (el) {
        scrollElementIntoView(el);
        return;
      }
    }
    const firstAlert = document.querySelector("#registration-phase-content [role='alert']");
    if (firstAlert instanceof HTMLElement) {
      scrollElementIntoView(firstAlert);
      return;
    }
    scrollToRegistrationTop();
  }, [scrollToRegistrationTop]);

  const scheduleErrorScroll = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const keys = pendingErrorScrollKeys.current;
        pendingErrorScrollKeys.current = null;
        if (keys?.length) scrollToFirstError(keys);
        else scrollToRegistrationTop();
      });
    });
  }, [scrollToFirstError, scrollToRegistrationTop]);

  const revealFirstError = (validationErrors: FieldErrors) => {
    const keys = getOrderedErrorKeys(validationErrors);
    pendingErrorScrollKeys.current = keys;
    const nextPhase = getFirstPhaseIndexForErrors(validationErrors);
    if (nextPhase !== activePhaseIndex) {
      scrollToTopAfterPhaseChange.current = false;
      setActivePhaseIndex(nextPhase);
      return;
    }
    scheduleErrorScroll();
  };

  useEffect(() => {
    if (pendingErrorScrollKeys.current?.length) {
      scheduleErrorScroll();
      return;
    }
    if (!scrollToTopAfterPhaseChange.current) return;

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      syncStickyChromeOffsets();
      scrollToRegistrationTop();
    };

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });
    const timeout = window.setTimeout(run, 50);
    const late = window.setTimeout(() => {
      run();
      if (!cancelled) scrollToTopAfterPhaseChange.current = false;
    }, 200);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      window.clearTimeout(late);
    };
  }, [activePhaseIndex, scheduleErrorScroll, scrollToRegistrationTop]);

  const currentPhaseErrors = validateRegistrationPhase(activePhaseIndex, progressInput, validationOptions);
  const showPhaseValidationAlert =
    phaseAttempted && (Object.keys(currentPhaseErrors).length > 0 || Boolean(errors.contact && activePhaseIndex === 4));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhaseAttempted(true);

    const validationErrors = validateRegistrationForm(form, validationOptions);
    setErrors(validationErrors);
    setTouched(Object.fromEntries(Object.keys(form).map((k) => [k, true])));

    if (Object.keys(validationErrors).length > 0) {
      setPhaseAttempted(true);
      revealFirstError(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value instanceof File) {
          if (value) body.append(key, value);
        } else if (Array.isArray(value)) {
          body.append(key, JSON.stringify(value));
        } else if (typeof value === "boolean") {
          body.append(key, String(value));
        } else if (value != null) {
          body.append(key, String(value));
        }
      });

      const res = await fetch("/api/register", { method: "POST", body });
      const data = (await res.json()) as { ok?: boolean; verificationStatus?: string; errors?: FieldErrors; message?: string };

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
          setPhaseAttempted(true);
          revealFirstError(data.errors);
        } else {
          setErrors({ submit: data.message ?? "Registration failed. Please try again." });
          scrollToTopAfterPhaseChange.current = true;
          setActivePhaseIndex(REGISTRATION_PHASES.length - 1);
        }
        return;
      }

      router.push("/dashboard?welcome=1");
      clearRegistrationDraft(account.email);
    } catch {
      setErrors({ submit: "Network error. Please check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (key: string) =>
    touched[key] || phaseAttempted || Object.keys(errors).length > 0 ? errors[key] : undefined;

  const handleNextPhase = async () => {
    setPhaseAttempted(true);

    const { errors: phaseErrors } = validatePhasesThrough(
      activePhaseIndex,
      progressInput,
      validationOptions
    );

    const keysToTouch = new Set<string>();
    for (let i = 0; i <= activePhaseIndex; i++) {
      for (const key of getPhaseFieldKeys(i)) keysToTouch.add(key);
    }
    if (phaseErrors.contact) keysToTouch.add("contact");
    setTouched((prev) => ({ ...prev, ...Object.fromEntries([...keysToTouch].map((key) => [key, true])) }));

    if (Object.keys(phaseErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...phaseErrors }));
      revealFirstError(phaseErrors);
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      for (const key of keysToTouch) delete next[key];
      delete next.contact;
      return next;
    });
    setPhaseAttempted(false);
    scrollToTopAfterPhaseChange.current = true;
    scrollViewportToTop();
    setActivePhaseIndex((prev) => {
      const next = getNextRegistrationPhaseIndex(prev, form.placeOfResidence);
      setFurthestPhaseIndex((furthest) => Math.max(furthest, next));
      return next;
    });
  };

  const handleSelectPhase = (index: number) => {
    const resolved = resolveSelectablePhaseIndex(index, form.placeOfResidence);
    if (resolved < 0 || resolved > furthestPhaseIndex || resolved === activePhaseIndex) return;
    setPhaseAttempted(false);
    scrollToTopAfterPhaseChange.current = true;
    scrollViewportToTop();
    setActivePhaseIndex(resolved);
  };

  const handleBackPhase = () => {
    setPhaseAttempted(false);
    scrollToTopAfterPhaseChange.current = true;
    scrollViewportToTop();
    setActivePhaseIndex((prev) => getPreviousRegistrationPhaseIndex(prev, form.placeOfResidence));
  };

  return (
    <form id="registration-form-top" onSubmit={handleSubmit} className="w-full scroll-mt-6 space-y-6" noValidate>
      <div className="rounded-2xl border border-teal-200 bg-teal-50 px-6 py-5 dark:border-teal-700 dark:bg-teal-950 dark:text-teal-50">
        <p className="text-sm font-semibold text-teal-950 dark:text-teal-50">{copy.exclusiveTitle}</p>
        <p className="mt-1 text-sm leading-relaxed text-teal-800 dark:text-teal-100">
          {copy.exclusiveBody}
        </p>
      </div>

      <RegistrationProgress
        activePhaseIndex={activePhaseIndex}
        furthestPhaseIndex={furthestPhaseIndex}
        onSelectPhase={handleSelectPhase}
        form={form}
        registeredVoter={registeredVoter}
      />

      {draftNotice ? (
        <Alert variant="info">
          {draftNotice}
          <button
            type="button"
            className="ml-2 font-medium underline"
            onClick={() => setDraftNotice(null)}
          >
            {copy.dismiss}
          </button>
        </Alert>
      ) : null}

      <div id="registration-phase-content" className="space-y-6" key={activePhaseIndex} tabIndex={-1}>
      {showPhaseValidationAlert ? (
        <Alert variant="error">
          {copy.phaseFixAlert}
        </Alert>
      ) : null}
      {activePhaseIndex === 0 ? (
        <FormSection step={1} title={copy.sections.verifyHow} id="photo-id-section">
          <Alert variant="info" formatBody={false}>
            {copy.photoIdAlert}
          </Alert>
          <FieldGroup columns={2}>
            <Field label={copy.photoIdType} required error={fieldError("photoIdType")} id="photoIdType">
              <SelectInput
                id="photoIdType"
                value={form.photoIdType}
                onChange={(e) => update("photoIdType", e.target.value)}
                onBlur={() => touchAndValidate("photoIdType")}
                error={fieldError("photoIdType")}
              >
                <option value="">{copy.selectPhotoId}</option>
                {PHOTO_ID_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label={copy.photoIdUpload} required error={fieldError("photoIdFile")}>
              <FileInput
                id="photoIdFile"
                accept=".png,.jpg,.jpeg,.pdf"
                file={form.photoIdFile}
                onChange={(file) => {
                  update("photoIdFile", file);
                  touch("photoIdFile");
                  validateField("photoIdFile", file);
                }}
                error={fieldError("photoIdFile")}
              />
            </Field>
          </FieldGroup>
        </FormSection>
      ) : null}

      {activePhaseIndex === 1 ? (
        <>
      <div id="citizenship-section">
        <FormSection step={1} title={copy.sections.citizenship}>
          <div className="flex flex-col gap-3">
            {CITIZENSHIP_STATUS.map((status) => (
              <label key={status} className={choiceBoxLabelClass}>
                <input
                  type="radio"
                  name="citizenshipStatus"
                  checked={form.citizenshipStatus === status}
                  onChange={() => updateCitizenship(status)}
                  className={siteRadioClass}
                />
                <span>{status}</span>
              </label>
            ))}
          </div>
          {citizenshipIneligible ? (
            <Alert variant="error">
              {copy.citizenshipIneligible}
            </Alert>
          ) : null}
          {fieldError("citizenshipStatus") ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {fieldError("citizenshipStatus")}
            </p>
          ) : null}
        </FormSection>
      </div>

      {!citizenshipIneligible ? (
      <FormSection step={2} title={copy.sections.dob}>
        <div id="dob-section">
          <DateOfBirthPicker
            value={form.dob}
            onChange={updateDob}
            onBlur={() => touchAndValidate("dob")}
            error={fieldError("dob")}
          />
        </div>
        </FormSection>
      ) : null}

      {needsVoterQuestion && !citizenshipIneligible ? (
        <div id="voter-section">
        <FormSection step={3} title={copy.sections.voter}>
          <Field label={copy.voterQuestion} required error={fieldError("votingStatus")} id="votingStatus">
            <SelectInput id="votingStatus" value={form.votingStatus} onChange={(e) => update("votingStatus", e.target.value)} onBlur={() => touchAndValidate("votingStatus")} error={fieldError("votingStatus")}>
              <option value="">{copy.selectVoterStatus}</option>
              {VOTING_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </SelectInput>
          </Field>
        </FormSection>
        </div>
      ) : null}

      {needsCommonwealthCountry && !citizenshipIneligible ? (
        <FormSection step={4} title={copy.sections.proofResidence}>
          <Alert variant="warning">{copy.proofAlert}</Alert>
          <Field label={copy.proofType} required error={fieldError("proofOfBelizeResidenceType")} id="proofOfBelizeResidenceType">
            <SelectInput id="proofOfBelizeResidenceType" value={form.proofOfBelizeResidenceType} onChange={(e) => update("proofOfBelizeResidenceType", e.target.value)} onBlur={() => touchAndValidate("proofOfBelizeResidenceType")} error={fieldError("proofOfBelizeResidenceType")}>
              <option value="">{copy.selectProof}</option>
              {COMMONWEALTH_RESIDENCE_PROOF_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </SelectInput>
          </Field>
          <Field label={copy.proofUpload} required error={fieldError("proofOfBelizeResidenceFile")}>
            <FileInput id="proofOfBelizeResidenceFile" accept=".png,.jpg,.jpeg,.pdf" file={form.proofOfBelizeResidenceFile} onChange={(file) => { update("proofOfBelizeResidenceFile", file); touch("proofOfBelizeResidenceFile"); validateField("proofOfBelizeResidenceFile", file); }} error={fieldError("proofOfBelizeResidenceFile")} />
          </Field>
        </FormSection>
      ) : null}
        </>
      ) : null}

      {activePhaseIndex === 2 ? (
        <>
          <FormSection step={4} title={copy.sections.name}>
            <Alert variant="info" formatBody={false}>
              {copy.nameAlert}
            </Alert>
            <FieldGroup columns={2}>
              <Field label={copy.firstName} required error={fieldError("firstName")} id="firstName">
                <TextInput id="firstName" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} onBlur={() => { touch("firstName"); validateField("firstName"); }} error={fieldError("firstName")} />
              </Field>
              <Field label={copy.lastName} required error={fieldError("lastName")} id="lastName">
                <TextInput id="lastName" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} onBlur={() => { touch("lastName"); validateField("lastName"); }} error={fieldError("lastName")} />
              </Field>
            </FieldGroup>
          </FormSection>

          <FormSection step={5} title={copy.sections.demographics}>
            <FieldGroup columns={2}>
              <Field label={copy.sex} required error={fieldError("sex")} id="sex">
                <SelectInput id="sex" value={form.sex} onChange={(e) => update("sex", e.target.value)} onBlur={() => touchAndValidate("sex")} error={fieldError("sex")}>
                  <option value="">{copy.selectSex}</option>
                  {SEX_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </SelectInput>
              </Field>
              <Field label={copy.education} required error={fieldError("education")} id="education">
                <SelectInput id="education" value={form.education} onChange={(e) => update("education", e.target.value)} onBlur={() => touchAndValidate("education")} error={fieldError("education")}>
                  <option value="">{copy.selectEducationShort}</option>
                  {EDUCATION_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
                </SelectInput>
              </Field>
            </FieldGroup>
            <Field label={copy.ethnicity} required error={fieldError("ethnicity")} id="ethnicity">
              <SelectInput id="ethnicity" value={form.ethnicity} onChange={(e) => update("ethnicity", e.target.value)} onBlur={() => touchAndValidate("ethnicity")} error={fieldError("ethnicity")}>
                <option value="">{copy.selectEthnicity}</option>
                {ETHNICITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </SelectInput>
            </Field>
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {HOUSEHOLD_DEFINITION}
            </p>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {HEAD_OF_HOUSEHOLD_DEFINITION}
            </p>
            <Field
              label={copy.householdHead}
              required
              error={fieldError("householdHeadRelationship")}
              id="householdHeadRelationship"
            >
              <div id="householdHeadRelationship" className="flex flex-col gap-3" role="radiogroup">
                {HOUSEHOLD_HEAD_OPTIONS.map((option) => (
                  <label key={option} className={choiceBoxLabelClass}>
                    <input
                      type="radio"
                      name="householdHeadRelationship"
                      checked={form.householdHeadRelationship === option}
                      onChange={() => {
                        update("householdHeadRelationship", option);
                        touch("householdHeadRelationship");
                      }}
                      onBlur={() => touchAndValidate("householdHeadRelationship")}
                      className={siteRadioClass}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </Field>
            {isHeadOfHousehold(form.householdHeadRelationship) ? (
              <Field
                label={copy.householdSize}
                required
                error={fieldError("householdSize")}
                id="householdSize"
              >
                <p className="mb-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                  {copy.householdCountNote}
                </p>
                <TextInput
                  id="householdSize"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_HOUSEHOLD_SIZE}
                  step={1}
                  value={form.householdSize}
                  onChange={(e) => update("householdSize", e.target.value)}
                  onBlur={() => touchAndValidate("householdSize")}
                  error={fieldError("householdSize")}
                />
              </Field>
            ) : null}
          </FormSection>

          <FormSection step={6} title={copy.sections.residence} id="residence-section">
            {mustLiveAbroad(form.citizenshipStatus) ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
                {copy.abroadIntro}
              </p>
            ) : null}
            {mustLiveAbroad(form.citizenshipStatus) ? null : (
            <Field label={copy.districtLive} required error={fieldError("placeOfResidence")} id="placeOfResidence">
              <SelectInput id="placeOfResidence" value={form.placeOfResidence} onChange={(e) => update("placeOfResidence", e.target.value)} onBlur={() => touchAndValidate("placeOfResidence")} error={fieldError("placeOfResidence")}>
                <option value="">{copy.selectLocation}</option>
                {residenceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </SelectInput>
            </Field>
            )}
            {mustLiveAbroad(form.citizenshipStatus) || form.placeOfResidence === "Abroad" ? (
              <div className="space-y-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{copy.livingOutsideBelize}</p>
                <Field label={copy.countryOfResidence} required error={fieldError("countryIfAbroad")} id="countryIfAbroad">
                  <SelectInput id="countryIfAbroad" value={form.countryIfAbroad} onChange={(e) => update("countryIfAbroad", e.target.value)} onBlur={() => touchAndValidate("countryIfAbroad")} error={fieldError("countryIfAbroad")}>
                    <option value="">{copy.selectCountry}</option>
                    {COUNTRIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </SelectInput>
                </Field>
                {form.countryIfAbroad === "Other" ? (
                  <Field
                    label={copy.countryOtherLabel}
                    required
                    error={fieldError("countryIfAbroadOther")}
                    id="countryIfAbroadOther"
                  >
                    <SelectInput
                      id="countryIfAbroadOther"
                      value={form.countryIfAbroadOther}
                      onChange={(e) => update("countryIfAbroadOther", e.target.value)}
                      onBlur={() => touchAndValidate("countryIfAbroadOther")}
                      error={fieldError("countryIfAbroadOther")}
                    >
                      <option value="">{copy.selectCountry}</option>
                      {OTHER_RESIDENCE_COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                ) : null}
                {isUnitedStatesCountry(form.countryIfAbroad) ? (
                  <Field label={copy.usRegion} required hint={copy.usRegionHint} error={fieldError("usDiasporaRegion")} id="usDiasporaRegion">
                    <SelectInput id="usDiasporaRegion" value={form.usDiasporaRegion} onChange={(e) => update("usDiasporaRegion", e.target.value)} onBlur={() => touchAndValidate("usDiasporaRegion")} error={fieldError("usDiasporaRegion")}>
                      <option value="">{copy.selectUsRegion}</option>
                      {US_DIASPORA_REGIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </SelectInput>
                  </Field>
                ) : null}
              </div>
            ) : null}
            {form.placeOfResidence && form.placeOfResidence !== "Abroad" ? (
              <>
                <Field label={copy.cityTownVillage(form.placeOfResidence)} required error={fieldError("cityTownVillage")} id="cityTownVillage">
                  <SelectInput id="cityTownVillage" value={form.cityTownVillage} onChange={(e) => update("cityTownVillage", e.target.value)} onBlur={() => touchAndValidate("cityTownVillage")} error={fieldError("cityTownVillage")}>
                    <option value="">{copy.selectCtv}</option>
                    {cityOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </SelectInput>
                </Field>
                {form.cityTownVillage === "Other" ? (
                  <Field label={copy.cityTownVillage(form.placeOfResidence)} required error={fieldError("cityTownVillageOther")} id="cityTownVillageOther">
                    <TextInput id="cityTownVillageOther" value={form.cityTownVillageOther} onChange={(e) => update("cityTownVillageOther", e.target.value)} onBlur={() => touchAndValidate("cityTownVillageOther")} error={fieldError("cityTownVillageOther")} />
                  </Field>
                ) : null}
              </>
            ) : null}
          </FormSection>

          {registeredVoter ? (
            <FormSection step={7} title={copy.sections.constituency}>
              <Field label={copy.constituencyQuestion} required error={fieldError("constituency")} id="constituency">
                <SelectInput id="constituency" value={form.constituency} onChange={(e) => update("constituency", e.target.value)} onBlur={() => touchAndValidate("constituency")} error={fieldError("constituency")}>
                  <option value="">{copy.selectConstituency}</option>
                  {getConstituencyOptions().map((s) => <option key={s} value={s}>{s}</option>)}
                </SelectInput>
              </Field>
              {hasRegisteredCtvQuestion(form.constituency) ? (
                <Field label={copy.registeredCtvQuestion(form.constituency)} required error={fieldError("registeredCtvArea")} id="registeredCtvArea">
                  <SelectInput id="registeredCtvArea" value={form.registeredCtvArea} onChange={(e) => update("registeredCtvArea", e.target.value)} onBlur={() => touchAndValidate("registeredCtvArea")} error={fieldError("registeredCtvArea")}>
                    <option value="">{copy.selectCtv}</option>
                    {ctvOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </SelectInput>
                </Field>
              ) : null}
            </FormSection>
          ) : null}
        </>
      ) : null}

      {activePhaseIndex === 3 ? (
        <>
          {skipsInterestsPhase(form.placeOfResidence) ? null : (
            <FormSection step={8} title={copy.sections.marketInterests}>
              <Field
                label={copy.marketInterestsLabel}
                hint={copy.optional}
                error={fieldError("marketInterests")}
              >
                <MultiSelect id="marketInterests" options={MARKET_INTERESTS} values={form.marketInterests} maxSelections={MAX_MARKET_INTERESTS} onChange={(values) => { update("marketInterests", values); touch("marketInterests"); validateField("marketInterests", values); }} error={fieldError("marketInterests")} />
              </Field>
            </FormSection>
          )}
        </>
      ) : null}

      {activePhaseIndex === 4 ? (
        <>
          <FormSection step={9} title={copy.sections.contact} id="contact-section">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {copy.contactIntro}
            </p>
            <FieldGroup columns={2}>
              <Field label={copy.email} error={fieldError("email")} id="email">
                <div className="relative">
                  <TextInput
                    id="email"
                    type="email"
                    value={form.email}
                    readOnly
                    className="bg-zinc-50 pr-[6.75rem] dark:bg-zinc-950"
                    error={fieldError("email")}
                    aria-describedby="email-verified-badge"
                  />
                  <span
                    id="email-verified-badge"
                    className="pointer-events-none absolute inset-y-0 right-2 flex items-center"
                  >
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-teal-800 ring-1 ring-teal-200/80 dark:bg-teal-950 dark:text-teal-200 dark:ring-teal-800">
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
                      </svg>
                      {copy.emailVerifiedBadge}
                    </span>
                  </span>
                </div>
              </Field>
              <SocialContactField
                platform="facebook"
                label={copy.facebook}
                id="facebook"
                value={form.facebook}
                onChange={(value) => update("facebook", value)}
                placeholder={copy.facebookPlaceholder}
              />
              <Field
                label={copy.phone}
                hint={copy.optional}
                id="phoneLocalNumber"
                error={fieldError("phoneLocalNumber")}
              >
                <PhoneNumberField
                  countryCode={form.phoneCountryCode}
                  localNumber={form.phoneLocalNumber}
                  onCountryCodeChange={(code) => {
                    const rule = getPhoneNumberRule(code);
                    const trimmed = phoneLocalDigits(form.phoneLocalNumber).slice(0, rule.maxLength);
                    setForm((prev) => ({
                      ...prev,
                      phoneCountryCode: code,
                      phoneLocalNumber: trimmed,
                    }));
                    touch("phoneLocalNumber");
                    const fieldErrors = validateRegistrationForm(
                      { ...form, phoneCountryCode: code, phoneLocalNumber: trimmed },
                      validationOptions
                    );
                    setErrors((prev) =>
                      fieldErrors.phoneLocalNumber
                        ? { ...prev, phoneLocalNumber: fieldErrors.phoneLocalNumber }
                        : clearFieldError(prev, "phoneLocalNumber")
                    );
                  }}
                  onLocalNumberChange={(number) => {
                    update("phoneLocalNumber", number);
                    touch("phoneLocalNumber");
                    validateField("phoneLocalNumber", number);
                  }}
                  onBlur={() => touchAndValidate("phoneLocalNumber")}
                  error={fieldError("phoneLocalNumber")}
                />
              </Field>
              <SocialContactField
                platform="instagram"
                label={copy.instagram}
                id="instagram"
                value={form.instagram}
                onChange={(value) => update("instagram", value)}
                placeholder={copy.instagramPlaceholder}
              />
              <SocialContactField
                platform="tiktok"
                label={copy.tiktok}
                id="tiktok"
                value={form.tiktok}
                onChange={(value) => update("tiktok", value)}
                placeholder={copy.tiktokPlaceholder}
              />
              <div className="space-y-4">
                <Field label={copy.otherPlatform} hint={copy.optional} id="otherContactPlatform">
                  <SelectInput id="otherContactPlatform" value={form.otherContactPlatform} onChange={(e) => update("otherContactPlatform", e.target.value)} error={fieldError("otherContactPlatform")}>
                    <option value="">{copy.selectOtherContact}</option>
                    {OTHER_CONTACT_PLATFORM_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </SelectInput>
                </Field>
                {form.otherContactPlatform === "Other" ? (
                  <Field label={copy.otherPlatformCustom} hint={copy.optional} id="otherContactPlatformCustom">
                    <TextInput id="otherContactPlatformCustom" value={form.otherContactPlatformCustom} onChange={(e) => update("otherContactPlatformCustom", e.target.value)} placeholder={copy.otherPlatformPlaceholder} />
                  </Field>
                ) : null}
                <Field label={otherPlatform === "Second email address" ? copy.secondEmail : copy.otherContact} hint={copy.optional} error={fieldError("otherContact")} id="otherContact">
                  <TextInput id="otherContact" value={form.otherContact} onChange={(e) => update("otherContact", e.target.value)} onBlur={() => touchAndValidate("otherContact")} placeholder={otherPlatform === "Second email address" ? copy.secondEmailPlaceholder : copy.otherContactPlaceholder} error={fieldError("otherContact")} />
                </Field>
              </div>
            </FieldGroup>
            {errors.contact ? <Alert variant="error">{errors.contact}</Alert> : null}
            {showPhysicalAddressContact ? (
              <StreetAddressFields
                addressHouseNumber={form.addressHouseNumber}
                streetAddress={form.streetAddress}
                addressCityVillage={form.addressCityVillage}
                addressCityVillageOther={form.addressCityVillageOther}
                addressDistrict={form.addressDistrict}
                required
                hint={copy.streetRequiredHint}
                lockDistrictAndCtv
                lockedNote={copy.streetLockedFromResidence}
                onEditLockedSource={jumpToResidenceDetails}
                editLockedSourceLabel={copy.streetEditResidence}
                errors={{
                  addressHouseNumber: fieldError("addressHouseNumber"),
                  streetAddress: fieldError("streetAddress"),
                  addressCityVillage: fieldError("addressCityVillage"),
                  addressCityVillageOther: fieldError("addressCityVillageOther"),
                  addressDistrict: fieldError("addressDistrict"),
                }}
                onChange={(field, value) => {
                  if (
                    field === "addressDistrict" ||
                    field === "addressCityVillage" ||
                    field === "addressCityVillageOther"
                  ) {
                    return;
                  }
                  update(field, value);
                }}
                onBlurField={(field) => {
                  if (
                    field === "addressDistrict" ||
                    field === "addressCityVillage" ||
                    field === "addressCityVillageOther"
                  ) {
                    return;
                  }
                  touch(field);
                  validateField(field);
                }}
              />
            ) : null}
          </FormSection>

          <FormSection step={10} title={copy.sections.confirmContact}>
            {meetsContactMinimum ? (
              <Alert variant="success" formatBody={false}>
                {copy.contactSuccess(totalContactMeans)}
              </Alert>
            ) : null}

            <div className="space-y-1 rounded-lg border border-teal-200/70 bg-gradient-to-br from-teal-50/90 to-sky-50/50 px-4 py-3 text-sm text-teal-950 dark:border-teal-800 dark:from-teal-950/40 dark:to-sky-950/20 dark:text-teal-100">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-teal-200/60 pb-2 dark:border-teal-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-200">
                  {copy.contactSummary}
                </p>
                <p
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    meetsContactMinimum
                      ? "bg-teal-700 text-white dark:bg-teal-600"
                      : "bg-amber-100 text-amber-950 ring-1 ring-amber-300/80 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-700"
                  }`}
                >
                  {copy.contactMeansOf(totalContactMeans)}
                </p>
              </div>
              {(cleanText(form.email) || cleanText(account.email)) ? (
                <p>
                  <strong>{copy.reviewLabels.accountEmail}:</strong>{" "}
                  {form.email || account.email}
                </p>
              ) : null}
              {phoneDisplay ? (
                <p>
                  <strong>{copy.reviewLabels.phone}:</strong> {phoneDisplay}
                </p>
              ) : null}
              {cleanText(form.facebook) ? (
                <p>
                  <strong>{copy.reviewLabels.facebook}:</strong> {form.facebook}
                </p>
              ) : null}
              {cleanText(form.instagram) ? (
                <p>
                  <strong>{copy.reviewLabels.instagram}:</strong> {form.instagram}
                </p>
              ) : null}
              {cleanText(form.tiktok) ? (
                <p>
                  <strong>{copy.reviewLabels.tiktok}:</strong> {form.tiktok}
                </p>
              ) : null}
              {otherContactDisplay ? (
                <p>
                  <strong>{copy.reviewLabels.otherContact}:</strong> {otherContactDisplay}
                </p>
              ) : null}
              {showPhysicalAddressContact ? (
                <p>
                  <strong>{copy.physicalAddress}:</strong>{" "}
                  {physicalAddressComplete
                    ? formatStreetAddressDisplay({
                        addressHouseNumber: form.addressHouseNumber,
                        streetAddress: form.streetAddress,
                        addressCityVillage: form.addressCityVillage,
                        addressCityVillageOther: form.addressCityVillageOther,
                        addressDistrict: form.addressDistrict,
                      })
                    : copy.notProvided}
                </p>
              ) : null}
            </div>

            <CheckboxField
              id="contactDetailsConfirmed"
              label={copy.contactConfirm}
              checked={form.contactDetailsConfirmed}
              onChange={(checked) => {
                update("contactDetailsConfirmed", checked);
                touch("contactDetailsConfirmed");
                validateField("contactDetailsConfirmed", checked);
              }}
              error={fieldError("contactDetailsConfirmed")}
            />
          </FormSection>        </>
      ) : null}

      {activePhaseIndex === 5 ? (
        <>
          <FormSection step={11} title={copy.sections.consent} id="consent-section">
            <div className="space-y-4">
              <CheckboxField id="consentResearch" label={copy.consentResearch} checked={form.consentResearch} onChange={(c) => { update("consentResearch", c); touch("consentResearch"); validateField("consentResearch", c); }} error={fieldError("consentResearch")} />
              <CheckboxField id="consentContact" label={copy.consentContact} checked={form.consentContact} onChange={(c) => { update("consentContact", c); touch("consentContact"); validateField("consentContact", c); }} error={fieldError("consentContact")} />
              <CheckboxField id="consentPrivacy" label={copy.consentPrivacy} checked={form.consentPrivacy} onChange={(c) => { update("consentPrivacy", c); touch("consentPrivacy"); validateField("consentPrivacy", c); }} error={fieldError("consentPrivacy")} />
            </div>
          </FormSection>

          <FormSection step={12} title={copy.sections.review}>
            <div className="space-y-3 rounded-lg border border-zinc-200 dark:border-zinc-800 lg:hidden">
              {reviewRows.map(([label, value]) => (
                <div key={label} className="border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 last:border-0">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{label}</p>
                  <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100 break-words">{String(value || copy.notProvided)}</p>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 lg:block">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-950">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">{copy.reviewQuestion}</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">{copy.reviewResponse}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white dark:bg-zinc-900">
                  {reviewRows.map(([label, value]) => (
                    <tr key={label}>
                      <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{label}</td>
                      <td className="px-4 py-2.5 text-zinc-900 dark:text-zinc-100">{String(value || copy.notProvided)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CheckboxField id="finalReviewConfirmed" label={copy.finalReviewConfirm} checked={form.finalReviewConfirmed} onChange={(c) => { update("finalReviewConfirmed", c); touch("finalReviewConfirmed"); validateField("finalReviewConfirmed", c); }} error={fieldError("finalReviewConfirmed")} />
          </FormSection>
        </>
      ) : null}

      {errors.submit ? <Alert variant="error">{errors.submit}</Alert> : null}

      <RegistrationPhaseNav
        activePhaseIndex={activePhaseIndex}
        isLastPhase={isLastPhase}
        submitting={submitting}
        showReturnHome={citizenshipIneligible}
        onBack={handleBackPhase}
        onNext={handleNextPhase}
      />
      </div>
    </form>
  );
}

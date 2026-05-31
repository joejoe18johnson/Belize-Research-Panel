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
  TextArea,
  TextInput,
} from "./form-ui";
import { DateOfBirthPicker } from "./DateOfBirthPicker";
import { RegistrationProgress } from "./RegistrationProgress";
import { RegistrationPhaseNav } from "./RegistrationPhaseNav";
import { PhoneNumberField } from "./PhoneNumberField";
import { SocialContactField } from "./SocialContactField";
import {
  ELIGIBLE_CITIZENSHIP_STATUSES,
  CITY_TOWN_VILLAGE,
  CIVIC_INTERESTS,
  COMMONWEALTH_RESIDENCE_PROOF_TYPES,
  COMMONWEALTH_COUNTRIES,
  COUNTRIES,
  EDUCATION_LEVELS,
  ETHNICITY_OPTIONS,
  MARKET_INTERESTS,
  OTHER_CONTACT_PLATFORM_OPTIONS,
  PHOTO_ID_TYPES,
  POLITICAL_INTERESTS,
  SEX_OPTIONS,
  US_DIASPORA_REGIONS,
  VOTING_STATUS,
  getConstituencyOptions,
  getRegisteredCtvOptions,
  getResidenceOptions,
  hasRegisteredCtvQuestion,
} from "@/lib/constants";
import {
  initialRegistrationForm,
  type RegistrationFormData,
} from "@/lib/registration-types";
import { phoneCountryCodeForCountry } from "@/lib/phone-codes";
import {
  countContactMethods,
  getFullPhoneNumber,
  isEligibleCitizenship,
  isRegisteredVoter,
  validateRegistrationForm,
  type FieldErrors,
} from "@/lib/validation";
import { formatDobDisplay } from "@/lib/dob";
import {
  getPhaseFieldKeys,
  getFirstPhaseIndexForErrors,
  REGISTRATION_PHASES,
  validatePhasesThrough,
  validateRegistrationPhase,
} from "@/lib/registration-progress";

function clearFieldError(errors: FieldErrors, key: string): FieldErrors {
  if (!errors[key]) return errors;
  const next = { ...errors };
  delete next[key];
  return next;
}

export interface RegistrationAccountContext {
  firstName: string;
  lastName: string;
  email: string;
  citizenshipStatus?: string;
  commonwealthCountry?: string;
  dob?: string;
}

export function RegistrationForm({ account }: { account: RegistrationAccountContext }) {
  const router = useRouter();
  const [form, setForm] = useState<RegistrationFormData>(() => ({
    ...initialRegistrationForm,
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
    citizenshipStatus: account.citizenshipStatus ?? "",
    commonwealthCountry: account.commonwealthCountry ?? "",
    dob: account.dob ?? "",
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [phaseAttempted, setPhaseAttempted] = useState(false);
  const scrollToTopAfterPhaseChange = useRef(false);

  const validationOptions = useMemo(
    () => ({ accountBacked: true as const, accountEmail: account.email }),
    [account.email]
  );

  const update = useCallback(<K extends keyof RegistrationFormData>(key: K, value: RegistrationFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "placeOfResidence") {
        next.cityTownVillage = "";
        next.cityTownVillageOther = "";
        next.countryIfAbroad = "";
        next.usDiasporaRegion = "";
      }
      if (key === "constituency") {
        next.registeredCtvArea = "";
      }
      if (key === "cityTownVillage" && value !== "Other") {
        next.cityTownVillageOther = "";
      }
      if (key === "otherContactPlatform" && value !== "Other") {
        next.otherContactPlatformCustom = "";
      }
      if (key === "countryIfAbroad" && typeof value === "string") {
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
      placeOfResidence: "",
      cityTownVillage: "",
      cityTownVillageOther: "",
      countryIfAbroad: "",
      usDiasporaRegion: "",
      constituency: "",
      registeredCtvArea: "",
      proofOfBelizeResidenceType: "",
      proofOfBelizeResidenceFile: null,
    }));
    setActivePhaseIndex(0);
    setErrors((prev) =>
      clearFieldError(
        clearFieldError(clearFieldError(prev, "citizenshipStatus"), "votingStatus"),
        "commonwealthCountry"
      )
    );
  };

  const eligibleCitizenship = isEligibleCitizenship(form.citizenshipStatus);
  const citizenshipIneligible =
    activePhaseIndex === 0 && Boolean(form.citizenshipStatus) && !eligibleCitizenship;
  const needsCommonwealthCountry =
    form.citizenshipStatus === "Citizen of a Commonwealth country living in Belize";
  const needsVoterQuestion = eligibleCitizenship;
  const registeredVoter = isRegisteredVoter(form.citizenshipStatus, form.votingStatus);
  const progressInput = { form, registeredVoter };
  const isLastPhase = activePhaseIndex === REGISTRATION_PHASES.length - 1;
  const residenceOptions = getResidenceOptions(form.citizenshipStatus);
  const cityOptions =
    form.placeOfResidence && form.placeOfResidence !== "Abroad"
      ? CITY_TOWN_VILLAGE[form.placeOfResidence] ?? []
      : [];
  const ctvOptions = getRegisteredCtvOptions(form.constituency);
  const contactCount = countContactMethods(form);
  const otherPlatform =
    form.otherContactPlatform === "Other"
      ? form.otherContactPlatformCustom
      : form.otherContactPlatform;
  const reviewRows = useMemo(
    () => [
      ["Registration mode", form.registrationMode],
      ["Authorised verification code", form.authorisedVerificationCode || "Not provided"],
      ["Citizenship / residency status", form.citizenshipStatus],
      ["Commonwealth country of citizenship", form.commonwealthCountry],
      ["Registered to vote in Belize", form.votingStatus || "Not applicable"],
      ["First name", form.firstName],
      ["Last name(s)", form.lastName],
      ["Date of birth", form.dob ? formatDobDisplay(form.dob) : ""],
      ["Sex", form.sex],
      ["Highest education", form.education],
      ["Ethnicity", form.ethnicity],
      ["Current residence", form.placeOfResidence === "Abroad" ? "Living abroad" : form.placeOfResidence],
      ["District", form.placeOfResidence === "Abroad" ? "" : form.placeOfResidence],
      ["City / town / village", form.placeOfResidence === "Abroad" ? form.cityTownVillage : form.cityTownVillage === "Other" ? form.cityTownVillageOther : form.cityTownVillage],
      ["Country if abroad", form.countryIfAbroad],
      ["Constituency registered to vote", form.constituency],
      ["Registered CTV area", form.registeredCtvArea],
      ["Political interests", form.politicalInterests.join(", ")],
      ["Market research interests", form.marketInterests.join(", ")],
      ["Civic interests", form.civicInterests.join(", ")],
      ["Account email", account.email],
      ["Phone / WhatsApp", getFullPhoneNumber(form)],
      ["Facebook", form.facebook],
      ["Instagram", form.instagram],
      ["TikTok", form.tiktok],
      ["Other contact platform", otherPlatform],
      ["Other contact detail", form.otherContact],
      ["Street address", form.streetAddress],
      ["Photo ID type", form.photoIdType],
      ["Proof of Belize residence", form.proofOfBelizeResidenceType],
    ],
    [form, otherPlatform, account.email]
  );

  const validateField = (key: keyof RegistrationFormData) => {
    const fieldErrors = validateRegistrationForm(form, validationOptions);
    const message = fieldErrors[key as string];
    setErrors((prev) => (message ? { ...prev, [key]: message } : clearFieldError(prev, String(key))));
  };

  const touchAndValidate = (key: keyof RegistrationFormData) => {
    touch(String(key));
    validateField(key);
  };

  const scrollToRegistrationTop = useCallback(() => {
    const anchor = document.getElementById("registration-form-top");
    if (anchor) {
      const y = anchor.getBoundingClientRect().top + window.scrollY - 24;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToFirstError = (errorKeys: string[]) => {
    for (const key of errorKeys) {
      const el = document.getElementById(key);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus({ preventScroll: true });
        return;
      }
    }
    scrollToRegistrationTop();
  };

  useEffect(() => {
    if (!scrollToTopAfterPhaseChange.current) return;
    scrollToTopAfterPhaseChange.current = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToRegistrationTop();
      });
    });
  }, [activePhaseIndex, scrollToRegistrationTop]);

  const currentPhaseErrors = validateRegistrationPhase(activePhaseIndex, progressInput, validationOptions);
  const showPhaseValidationAlert =
    phaseAttempted && (Object.keys(currentPhaseErrors).length > 0 || Boolean(errors.contact && activePhaseIndex === 3));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhaseAttempted(true);

    const validationErrors = validateRegistrationForm(form, validationOptions);
    setErrors(validationErrors);
    setTouched(Object.fromEntries(Object.keys(form).map((k) => [k, true])));

    if (Object.keys(validationErrors).length > 0) {
      setPhaseAttempted(true);
      scrollToTopAfterPhaseChange.current = true;
      setActivePhaseIndex(getFirstPhaseIndexForErrors(validationErrors));
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
          scrollToTopAfterPhaseChange.current = true;
          setActivePhaseIndex(getFirstPhaseIndexForErrors(data.errors));
        } else setErrors({ submit: data.message ?? "Registration failed. Please try again." });
        return;
      }

      router.push("/dashboard?welcome=1");
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

    const { errors: phaseErrors, firstErrorPhase } = validatePhasesThrough(
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
      if (firstErrorPhase !== null && firstErrorPhase < activePhaseIndex) {
        scrollToTopAfterPhaseChange.current = true;
        setActivePhaseIndex(firstErrorPhase);
      } else {
        scrollToFirstError(Object.keys(phaseErrors));
      }
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
    setActivePhaseIndex((prev) => Math.min(prev + 1, REGISTRATION_PHASES.length - 1));
  };

  const handleBackPhase = () => {
    setPhaseAttempted(false);
    scrollToTopAfterPhaseChange.current = true;
    setActivePhaseIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <form id="registration-form-top" onSubmit={handleSubmit} className="w-full scroll-mt-6 space-y-6" noValidate>
      <div className="rounded-2xl border border-teal-100 bg-teal-50 px-6 py-5">
        <p className="text-sm font-medium text-teal-900">Exclusive Belize Research Panel</p>
        <p className="mt-1 text-sm text-teal-800">
          Complete registration to join the panel. Your information is kept confidential and used only for legitimate research.
        </p>
      </div>

      <RegistrationProgress
        activePhaseIndex={activePhaseIndex}
        form={form}
        registeredVoter={registeredVoter}
      />

      <div id="registration-phase-content" className="space-y-6">
      {showPhaseValidationAlert ? (
        <Alert variant="error">
          Please fix the highlighted fields in this section before continuing.
        </Alert>
      ) : null}
      {activePhaseIndex === 0 ? (
        <>
      <div id="citizenship-section">
        <FormSection step={1} title="Citizenship / residency">
          <p className="text-sm text-zinc-600">
            Registration is open to citizens of Belize and Commonwealth citizens currently living in Belize.
          </p>
          <div className="flex flex-col gap-3">
            {ELIGIBLE_CITIZENSHIP_STATUSES.map((status) => (
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
          {fieldError("citizenshipStatus") ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {fieldError("citizenshipStatus")}
            </p>
          ) : null}
          {needsCommonwealthCountry ? (
            <Field
              label="Commonwealth country of citizenship"
              required
              error={fieldError("commonwealthCountry")}
              id="commonwealthCountry"
            >
              <SelectInput
                id="commonwealthCountry"
                value={form.commonwealthCountry}
                onChange={(e) => update("commonwealthCountry", e.target.value)}
                onBlur={() => touchAndValidate("commonwealthCountry")}
                error={fieldError("commonwealthCountry")}
              >
                <option value="">Select commonwealth country</option>
                {COMMONWEALTH_COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </SelectInput>
            </Field>
          ) : null}
        </FormSection>
      </div>

      {!citizenshipIneligible ? (
      <FormSection step={2} title="Date of birth">
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
        <FormSection step={3} title="Voter registration">
          <Field label="Are you registered to vote in Belize?" required error={fieldError("votingStatus")} id="votingStatus">
            <SelectInput id="votingStatus" value={form.votingStatus} onChange={(e) => update("votingStatus", e.target.value)} onBlur={() => touchAndValidate("votingStatus")} error={fieldError("votingStatus")}>
              <option value="">Select voter status</option>
              {VOTING_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </SelectInput>
          </Field>
        </FormSection>
        </div>
      ) : null}
        </>
      ) : null}

      {activePhaseIndex === 1 ? (
        <>
          <FormSection step={4} title="Name">
            <FieldGroup columns={2}>
              <Field label="First name" required error={fieldError("firstName")} id="firstName">
                <TextInput id="firstName" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} onBlur={() => { touch("firstName"); validateField("firstName"); }} error={fieldError("firstName")} />
              </Field>
              <Field label="Last name(s)" required error={fieldError("lastName")} id="lastName">
                <TextInput id="lastName" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} onBlur={() => { touch("lastName"); validateField("lastName"); }} error={fieldError("lastName")} />
              </Field>
            </FieldGroup>
          </FormSection>

          <FormSection step={5} title="Demographic information">
            <FieldGroup columns={2}>
              <Field label="Sex" required error={fieldError("sex")} id="sex">
                <SelectInput id="sex" value={form.sex} onChange={(e) => update("sex", e.target.value)} onBlur={() => touchAndValidate("sex")} error={fieldError("sex")}>
                  <option value="">Select sex</option>
                  {SEX_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </SelectInput>
              </Field>
              <Field label="Highest level of education" required error={fieldError("education")} id="education">
                <SelectInput id="education" value={form.education} onChange={(e) => update("education", e.target.value)} onBlur={() => touchAndValidate("education")} error={fieldError("education")}>
                  <option value="">Select education</option>
                  {EDUCATION_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
                </SelectInput>
              </Field>
            </FieldGroup>
            <Field label="Ethnicity" required error={fieldError("ethnicity")} id="ethnicity">
              <SelectInput id="ethnicity" value={form.ethnicity} onChange={(e) => update("ethnicity", e.target.value)} onBlur={() => touchAndValidate("ethnicity")} error={fieldError("ethnicity")}>
                <option value="">Select ethnicity</option>
                {ETHNICITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </SelectInput>
            </Field>
          </FormSection>

          <FormSection step={6} title="Residence details">
            <p className="text-sm text-zinc-600">
              Select your current district if you live in Belize, or choose Abroad if you live in another country.
            </p>
            <Field label="Where do you currently live?" required error={fieldError("placeOfResidence")} id="placeOfResidence">
              <SelectInput id="placeOfResidence" value={form.placeOfResidence} onChange={(e) => update("placeOfResidence", e.target.value)} onBlur={() => touchAndValidate("placeOfResidence")} error={fieldError("placeOfResidence")}>
                <option value="">Select location</option>
                {residenceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </SelectInput>
            </Field>
            {form.placeOfResidence === "Abroad" ? (
              <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-medium text-zinc-800">Living outside Belize</p>
                <Field label="Country of residence" required error={fieldError("countryIfAbroad")} id="countryIfAbroad">
                  <SelectInput id="countryIfAbroad" value={form.countryIfAbroad} onChange={(e) => update("countryIfAbroad", e.target.value)} onBlur={() => touchAndValidate("countryIfAbroad")} error={fieldError("countryIfAbroad")}>
                    <option value="">Select country</option>
                    {COUNTRIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Current city / town / village" required error={fieldError("cityTownVillage")} id="cityTownVillage">
                  <TextInput
                    id="cityTownVillage"
                    value={form.cityTownVillage}
                    onChange={(e) => update("cityTownVillage", e.target.value)}
                    onBlur={() => touchAndValidate("cityTownVillage")}
                    error={fieldError("cityTownVillage")}
                    autoComplete="address-level2"
                  />
                </Field>
                {["United States", "USA", "United States of America"].includes(form.countryIfAbroad) ? (
                  <Field label="US region" required error={fieldError("usDiasporaRegion")} id="usDiasporaRegion">
                    <SelectInput id="usDiasporaRegion" value={form.usDiasporaRegion} onChange={(e) => update("usDiasporaRegion", e.target.value)} onBlur={() => touchAndValidate("usDiasporaRegion")} error={fieldError("usDiasporaRegion")}>
                      <option value="">Select US region</option>
                      {US_DIASPORA_REGIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </SelectInput>
                  </Field>
                ) : null}
              </div>
            ) : null}
            {form.placeOfResidence && form.placeOfResidence !== "Abroad" ? (
              <>
                <Field label={`Current city / town / village in ${form.placeOfResidence}`} required error={fieldError("cityTownVillage")} id="cityTownVillage">
                  <SelectInput id="cityTownVillage" value={form.cityTownVillage} onChange={(e) => update("cityTownVillage", e.target.value)} onBlur={() => touchAndValidate("cityTownVillage")} error={fieldError("cityTownVillage")}>
                    <option value="">Select city, town, or village</option>
                    {cityOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </SelectInput>
                </Field>
                {form.cityTownVillage === "Other" ? (
                  <Field label={`Specify city / town / village in ${form.placeOfResidence}`} required error={fieldError("cityTownVillageOther")} id="cityTownVillageOther">
                    <TextInput id="cityTownVillageOther" value={form.cityTownVillageOther} onChange={(e) => update("cityTownVillageOther", e.target.value)} onBlur={() => touchAndValidate("cityTownVillageOther")} error={fieldError("cityTownVillageOther")} />
                  </Field>
                ) : null}
              </>
            ) : null}
          </FormSection>

          {registeredVoter ? (
            <FormSection step={7} title="Constituency registration">
              <Field label="In which constituency are you registered to vote?" required error={fieldError("constituency")} id="constituency">
                <SelectInput id="constituency" value={form.constituency} onChange={(e) => update("constituency", e.target.value)} onBlur={() => touchAndValidate("constituency")} error={fieldError("constituency")}>
                  <option value="">Select constituency</option>
                  {getConstituencyOptions().map((s) => <option key={s} value={s}>{s}</option>)}
                </SelectInput>
              </Field>
              {hasRegisteredCtvQuestion(form.constituency) ? (
                <Field label={`Where in the "${form.constituency}" constituency were you living at the time you registered to vote there?`} required error={fieldError("registeredCtvArea")} id="registeredCtvArea">
                  <SelectInput id="registeredCtvArea" value={form.registeredCtvArea} onChange={(e) => update("registeredCtvArea", e.target.value)} onBlur={() => touchAndValidate("registeredCtvArea")} error={fieldError("registeredCtvArea")}>
                    <option value="">Select city, town, or village</option>
                    {ctvOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </SelectInput>
                </Field>
              ) : null}
            </FormSection>
          ) : null}
        </>
      ) : null}

      {activePhaseIndex === 2 ? (
        <>
          {registeredVoter ? (
            <FormSection step={8} title="Political / election poll interests">
              <Field label="Select all that apply" required error={fieldError("politicalInterests")}>
                <MultiSelect options={POLITICAL_INTERESTS} values={form.politicalInterests} onChange={(values) => { update("politicalInterests", values); touch("politicalInterests"); validateField("politicalInterests"); }} error={fieldError("politicalInterests")} />
              </Field>
            </FormSection>
          ) : null}

          {form.placeOfResidence !== "Abroad" ? (
            <FormSection step={9} title="Market research interests">
              <Field label="Select all that apply" required error={fieldError("marketInterests")}>
                <MultiSelect options={MARKET_INTERESTS} values={form.marketInterests} onChange={(values) => { update("marketInterests", values); touch("marketInterests"); validateField("marketInterests"); }} error={fieldError("marketInterests")} />
              </Field>
            </FormSection>
          ) : (
            <Alert variant="info">Persons living abroad are eligible for political/election polls and diaspora-focused research where applicable.</Alert>
          )}

          <FormSection step={10} title="Civic / public / social issues">
            <Field label="Select all that apply" required error={fieldError("civicInterests")}>
              <MultiSelect options={CIVIC_INTERESTS} values={form.civicInterests} onChange={(values) => { update("civicInterests", values); touch("civicInterests"); validateField("civicInterests"); }} error={fieldError("civicInterests")} />
            </Field>
          </FormSection>
        </>
      ) : null}

      {activePhaseIndex === 3 ? (
        <>
          <FormSection step={11} title="Preferred ways to contact you">
            <p className="text-sm text-zinc-600">Please enter contact details carefully. At least two contact methods are encouraged so we can still reach you if one channel changes, is inactive, or fails during fieldwork.</p>
            <FieldGroup columns={2}>
              <Field label="Email address" hint="This is your verified account email." error={fieldError("email")} id="email">
                <TextInput id="email" type="email" value={form.email} readOnly className="bg-zinc-50" error={fieldError("email")} />
              </Field>
              <SocialContactField
                platform="facebook"
                label="Facebook name or profile link"
                id="facebook"
                value={form.facebook}
                onChange={(value) => update("facebook", value)}
                placeholder="username or https://facebook.com/username"
              />
              <Field
                label="Phone / WhatsApp number"
                hint="Select your country code, then enter your number without the country code. It will need to be verified before we can use it to contact you."
                id="phoneLocalNumber"
                error={fieldError("phoneLocalNumber")}
              >
                <PhoneNumberField
                  countryCode={form.phoneCountryCode}
                  localNumber={form.phoneLocalNumber}
                  onCountryCodeChange={(code) => update("phoneCountryCode", code)}
                  onLocalNumberChange={(number) => update("phoneLocalNumber", number)}
                  onBlur={() => touchAndValidate("phoneLocalNumber")}
                  error={fieldError("phoneLocalNumber")}
                />
              </Field>
              <SocialContactField
                platform="instagram"
                label="Instagram handle"
                id="instagram"
                value={form.instagram}
                onChange={(value) => update("instagram", value)}
                placeholder="@username or profile link"
              />
              <SocialContactField
                platform="tiktok"
                label="TikTok handle"
                id="tiktok"
                value={form.tiktok}
                onChange={(value) => update("tiktok", value)}
                placeholder="@username or profile link"
              />
              <div className="space-y-4">
                <Field label="Other contact platform / application" hint="Optional" id="otherContactPlatform">
                  <SelectInput id="otherContactPlatform" value={form.otherContactPlatform} onChange={(e) => update("otherContactPlatform", e.target.value)} error={fieldError("otherContactPlatform")}>
                    <option value="">Select other contact type (optional)</option>
                    {OTHER_CONTACT_PLATFORM_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </SelectInput>
                </Field>
                {form.otherContactPlatform === "Other" ? (
                  <Field label="Specify other contact platform / application" hint="Optional" id="otherContactPlatformCustom">
                    <TextInput id="otherContactPlatformCustom" value={form.otherContactPlatformCustom} onChange={(e) => update("otherContactPlatformCustom", e.target.value)} placeholder="Telegram, Signal, LinkedIn..." />
                  </Field>
                ) : null}
                <Field label={otherPlatform === "Second email address" ? "Second email address" : "Other contact detail"} hint="Optional" error={fieldError("otherContact")} id="otherContact">
                  <TextInput id="otherContact" value={form.otherContact} onChange={(e) => update("otherContact", e.target.value)} onBlur={() => touchAndValidate("otherContact")} placeholder={otherPlatform === "Second email address" ? "Enter second email address" : "Username, handle, phone, link, or ID"} error={fieldError("otherContact")} />
                </Field>
              </div>
            </FieldGroup>
            {errors.contact ? <Alert variant="error">{errors.contact}</Alert> : null}
            {contactCount < 2 ? (
              <Field label="Street address / physical contact address" required={contactCount === 0} error={fieldError("streetAddress")} id="streetAddress">
                <TextArea id="streetAddress" value={form.streetAddress} onChange={(e) => update("streetAddress", e.target.value)} onBlur={() => touchAndValidate("streetAddress")} error={fieldError("streetAddress")} />
              </Field>
            ) : null}
          </FormSection>

          <FormSection step={12} title="Confirm contact details">
            <div className="space-y-1 rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-900">
              <p><strong>Email:</strong> {form.email || "Not provided"}</p>
              <p><strong>Phone / WhatsApp:</strong> {getFullPhoneNumber(form) || "Not provided"}</p>
              <p><strong>Facebook:</strong> {form.facebook || "Not provided"}</p>
              <p><strong>Instagram:</strong> {form.instagram || "Not provided"}</p>
              <p><strong>TikTok:</strong> {form.tiktok || "Not provided"}</p>
              <p><strong>Other contact platform:</strong> {otherPlatform || "Not provided"}</p>
              <p><strong>Other contact detail:</strong> {form.otherContact || "Not provided"}</p>
              <p><strong>Street address:</strong> {form.streetAddress || "Not provided"}</p>
            </div>
            <CheckboxField id="contactDetailsConfirmed" label="I confirm that the contact information shown above is correct. *" checked={form.contactDetailsConfirmed} onChange={(checked) => { update("contactDetailsConfirmed", checked); touch("contactDetailsConfirmed"); validateField("contactDetailsConfirmed"); }} error={fieldError("contactDetailsConfirmed")} />
          </FormSection>
        </>
      ) : null}

      {activePhaseIndex === 4 ? (
        <>
          <FormSection step={13} title="Photo identification">
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-800">Registration mode</p>
              <div className="flex flex-wrap gap-4">
                {(["Self-registration", "Registration by authorised person"] as const).map((mode) => (
                  <label key={mode} className={choiceBoxLabelClass}>
                    <input
                      type="radio"
                      name="registrationMode"
                      checked={form.registrationMode === mode}
                      onChange={() => update("registrationMode", mode)}
                      className={siteRadioClass}
                    />
                    {mode}
                  </label>
                ))}
              </div>
            </div>
            <FieldGroup columns={2}>
              <Field label="Photo ID type" required error={fieldError("photoIdType")} id="photoIdType">
                <SelectInput id="photoIdType" value={form.photoIdType} onChange={(e) => update("photoIdType", e.target.value)} onBlur={() => touchAndValidate("photoIdType")} error={fieldError("photoIdType")}>
                  <option value="">Select photo ID type</option>
                  {PHOTO_ID_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </SelectInput>
              </Field>
              <Field label={form.registrationMode === "Self-registration" ? "Upload photo ID image or PDF" : "Upload photo ID image or PDF — optional for authorised registration"} required={form.registrationMode === "Self-registration"} error={fieldError("photoIdFile")}>
                <FileInput accept=".png,.jpg,.jpeg,.pdf" onChange={(file) => { update("photoIdFile", file); touch("photoIdFile"); validateField("photoIdFile"); }} error={fieldError("photoIdFile")} optional={form.registrationMode === "Registration by authorised person"} />
              </Field>
            </FieldGroup>
            <Alert variant="info">Photo identification is used only to verify your identity and eligibility. We do not keep or store ID images or copies in our files. ID numbers may be blurred or covered before upload, as long as your name, photograph, and eligibility details remain visible.</Alert>
            {form.registrationMode === "Registration by authorised person" ? (
              <>
                <p className="text-sm text-zinc-600">Authorised registration mode allows photo upload to be bypassed when an authorised verification or QR process has been used.</p>
                <Field label="Authorised verification code" required error={fieldError("authorisedVerificationCode")} id="authorisedVerificationCode">
                  <TextInput id="authorisedVerificationCode" value={form.authorisedVerificationCode} onChange={(e) => update("authorisedVerificationCode", e.target.value)} onBlur={() => touchAndValidate("authorisedVerificationCode")} placeholder="Enter authorised verification / QR code" error={fieldError("authorisedVerificationCode")} />
                </Field>
              </>
            ) : null}
            {form.citizenshipStatus === "Citizen of a Commonwealth country living in Belize" ? (
              <>
                <Alert variant="warning">Commonwealth citizens must provide proof that they are currently resident in Belize. This protects the integrity of the panel.</Alert>
                <Field label="Proof of residence in Belize" required error={fieldError("proofOfBelizeResidenceType")} id="proofOfBelizeResidenceType">
                  <SelectInput id="proofOfBelizeResidenceType" value={form.proofOfBelizeResidenceType} onChange={(e) => update("proofOfBelizeResidenceType", e.target.value)} onBlur={() => touchAndValidate("proofOfBelizeResidenceType")} error={fieldError("proofOfBelizeResidenceType")}>
                    <option value="">Select proof type</option>
                    {COMMONWEALTH_RESIDENCE_PROOF_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Upload proof of Belize residence" required error={fieldError("proofOfBelizeResidenceFile")}>
                  <FileInput accept=".png,.jpg,.jpeg,.pdf" onChange={(file) => { update("proofOfBelizeResidenceFile", file); touch("proofOfBelizeResidenceFile"); validateField("proofOfBelizeResidenceFile"); }} error={fieldError("proofOfBelizeResidenceFile")} />
                </Field>
              </>
            ) : null}
          </FormSection>
        </>
      ) : null}

      {activePhaseIndex === 5 ? (
        <>
          <FormSection step={14} title="Consent">
            <div className="space-y-4">
              <CheckboxField id="consentResearch" label="I agree to be considered for surveys, polls, interviews, or research activities. *" checked={form.consentResearch} onChange={(c) => { update("consentResearch", c); touch("consentResearch"); validateField("consentResearch"); }} error={fieldError("consentResearch")} />
              <CheckboxField id="consentContact" label="I agree to be contacted using the contact details I provided. *" checked={form.consentContact} onChange={(c) => { update("consentContact", c); touch("consentContact"); validateField("consentContact"); }} error={fieldError("consentContact")} />
              <CheckboxField id="consentPrivacy" label="I understand that my information should be kept confidential and used only for legitimate research-related purposes. *" checked={form.consentPrivacy} onChange={(c) => { update("consentPrivacy", c); touch("consentPrivacy"); validateField("consentPrivacy"); }} error={fieldError("consentPrivacy")} />
            </div>
          </FormSection>

          <FormSection step={15} title="Review full registration before submitting">
            <div className="space-y-3 rounded-lg border border-zinc-200 md:hidden">
              {reviewRows.map(([label, value]) => (
                <div key={label} className="border-b border-zinc-100 px-4 py-3 last:border-0">
                  <p className="text-xs font-medium text-zinc-500">{label}</p>
                  <p className="mt-1 text-sm text-zinc-900 break-words">{String(value || "Not provided")}</p>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 md:block">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-700">Question / field</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-700">Response</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {reviewRows.map(([label, value]) => (
                    <tr key={label}>
                      <td className="px-4 py-2.5 text-zinc-600">{label}</td>
                      <td className="px-4 py-2.5 text-zinc-900">{String(value || "Not provided")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CheckboxField id="finalReviewConfirmed" label="I have reviewed the full form and confirm that the information is correct. *" checked={form.finalReviewConfirmed} onChange={(c) => { update("finalReviewConfirmed", c); touch("finalReviewConfirmed"); validateField("finalReviewConfirmed"); }} error={fieldError("finalReviewConfirmed")} />
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

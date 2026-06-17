"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SocialContactField } from "@/components/registration/SocialContactField";
import {
  Field,
  MultiSelect,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/registration/form-ui";
import {
  CIVIC_INTERESTS,
  COMMONWEALTH_COUNTRIES,
  COUNTRIES,
  EDUCATION_LEVELS,
  ELIGIBLE_CITIZENSHIP_STATUSES,
  getConstituencyOptions,
  getRegisteredCtvOptions,
  getResidenceOptions,
  hasRegisteredCtvQuestion,
  needsVoterRegistrationQuestion,
  MARKET_INTERESTS,
  OTHER_CONTACT_PLATFORM_OPTIONS,
  POLITICAL_INTERESTS,
  VOTING_STATUS,
  CITY_TOWN_VILLAGE,
} from "@/lib/constants";
import type { SessionAccount } from "@/lib/auth-types";
import type { PanelistDashboardProfile } from "@/lib/panelist-dashboard";
import type { ProfileContactDisplay, ProfileUpdateFormData } from "@/lib/profile-update-types";
import { isRegisteredVoter, type FieldErrors } from "@/lib/validation";
import { ProfileContactChangePanel } from "./ProfileContactChangePanel";
import { SectionHeading } from "./DashboardShell";

export type ProfileEditSection = "personal" | "citizenship" | "contact" | "interests";

export function ProfileEditForm({
  profile,
  account,
  contact,
  initialForm,
  onCancel,
  onSaved,
  focusSection,
}: {
  profile: PanelistDashboardProfile;
  account: SessionAccount;
  contact: ProfileContactDisplay;
  initialForm: ProfileUpdateFormData;
  onCancel: () => void;
  onSaved: () => void;
  focusSection?: ProfileEditSection;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProfileUpdateFormData>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!focusSection) return;
    const target = document.getElementById(`profile-section-${focusSection}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusSection]);

  const needsVoterQuestion = needsVoterRegistrationQuestion(form.citizenshipStatus);
  const registeredVoter = isRegisteredVoter(form.citizenshipStatus, form.votingStatus);
  const needsCommonwealthCountry =
    form.citizenshipStatus === "Citizen of a Commonwealth country living in Belize";

  const residenceOptions = useMemo(() => getResidenceOptions(form.citizenshipStatus), [form.citizenshipStatus]);
  const cityOptions =
    form.placeOfResidence && form.placeOfResidence !== "Abroad"
      ? CITY_TOWN_VILLAGE[form.placeOfResidence] ?? []
      : [];
  const ctvOptions = useMemo(
    () => getRegisteredCtvOptions(form.constituency),
    [form.constituency]
  );

  const update = <K extends keyof ProfileUpdateFormData>(key: K, value: ProfileUpdateFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "citizenshipStatus") {
        next.commonwealthCountry = "";
        next.votingStatus = "";
        next.constituency = "";
        next.registeredCtvArea = "";
      }
      if (key === "votingStatus") {
        next.constituency = "";
        next.registeredCtvArea = "";
      }
      if (key === "constituency") {
        next.registeredCtvArea = "";
      }
      if (key === "placeOfResidence") {
        next.cityTownVillage = "";
        next.cityTownVillageOther = "";
        next.countryIfAbroad = "";
      }
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      delete next.contact;
      delete next.submit;
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (account.accountStatus === "on_hold") {
      setErrors({
        submit:
          "Your account is on hold. Complete email or phone verification before saving other profile changes.",
      });
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { ok?: boolean; errors?: FieldErrors; message?: string };

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setErrors({ submit: data.message ?? "Could not save profile." });
        return;
      }

      router.refresh();
      onSaved();
    } catch {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div
        id="profile-section-personal"
        className="scroll-mt-24 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-5 sm:p-6"
      >
        <SectionHeading as="h3">Biographical details</SectionHeading>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
          Name, date of birth, sex, and ethnicity cannot be changed online. You may update your education level if it
          changes.
        </p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-zinc-800 dark:text-zinc-200">First name</dt>
            <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{profile.firstName}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Last name(s)</dt>
            <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{profile.lastName}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Date of birth</dt>
            <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{profile.dob}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Age</dt>
            <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{profile.age}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Sex</dt>
            <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{profile.sex}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Ethnicity</dt>
            <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{profile.ethnicity}</dd>
          </div>
        </dl>
        <div className="mt-5">
          <Field label="Highest level of education" required error={errors.education} id="education">
            <SelectInput
              id="education"
              value={form.education}
              onChange={(e) => update("education", e.target.value)}
              error={errors.education}
            >
              <option value="">Select education</option>
              {EDUCATION_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </div>

      <div
        id="profile-section-citizenship"
        className="scroll-mt-24 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6"
      >
        <SectionHeading as="h3" className="border-b border-zinc-100 dark:border-zinc-800 pb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Citizenship and voter registration
        </SectionHeading>
        <div className="mt-4 space-y-5">
          <Field
            label="Citizenship / residency status"
            required
            error={errors.citizenshipStatus}
            id="citizenshipStatus"
          >
            <SelectInput
              id="citizenshipStatus"
              value={form.citizenshipStatus}
              onChange={(e) => update("citizenshipStatus", e.target.value)}
              error={errors.citizenshipStatus}
            >
              <option value="">Select…</option>
              {ELIGIBLE_CITIZENSHIP_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </SelectInput>
          </Field>

          {needsCommonwealthCountry ? (
            <Field
              label="Commonwealth country of citizenship"
              required
              error={errors.commonwealthCountry}
              id="commonwealthCountry"
            >
              <SelectInput
                id="commonwealthCountry"
                value={form.commonwealthCountry}
                onChange={(e) => update("commonwealthCountry", e.target.value)}
                error={errors.commonwealthCountry}
              >
                <option value="">Select country…</option>
                {COMMONWEALTH_COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </SelectInput>
            </Field>
          ) : null}

          {needsVoterQuestion ? (
            <Field
              label="Are you registered to vote in Belize?"
              required
              error={errors.votingStatus}
              id="votingStatus"
            >
              <SelectInput
                id="votingStatus"
                value={form.votingStatus}
                onChange={(e) => update("votingStatus", e.target.value)}
                error={errors.votingStatus}
              >
                <option value="">Select voter status</option>
                {VOTING_STATUS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </SelectInput>
            </Field>
          ) : null}

          {registeredVoter ? (
            <>
              <Field label="Constituency registered to vote" required error={errors.constituency} id="constituency">
                <SelectInput
                  id="constituency"
                  value={form.constituency}
                  onChange={(e) => update("constituency", e.target.value)}
                  error={errors.constituency}
                >
                  <option value="">Select constituency…</option>
                  {getConstituencyOptions().map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              {hasRegisteredCtvQuestion(form.constituency) ? (
                <Field
                  label="Registered CTV area"
                  required
                  error={errors.registeredCtvArea}
                  id="registeredCtvArea"
                >
                  <SelectInput
                    id="registeredCtvArea"
                    value={form.registeredCtvArea}
                    onChange={(e) => update("registeredCtvArea", e.target.value)}
                    error={errors.registeredCtvArea}
                  >
                    <option value="">Select area…</option>
                    {ctvOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="scroll-mt-24 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
        <SectionHeading as="h3" className="border-b border-zinc-100 dark:border-zinc-800 pb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Residence
        </SectionHeading>
        <div className="mt-4 space-y-5">
          <Field label="Where do you currently live?" required error={errors.placeOfResidence} id="placeOfResidence">
            <SelectInput
              id="placeOfResidence"
              value={form.placeOfResidence}
              onChange={(e) => update("placeOfResidence", e.target.value)}
              error={errors.placeOfResidence}
            >
              <option value="">Select…</option>
              {residenceOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "Abroad" ? "Living abroad" : option}
                </option>
              ))}
            </SelectInput>
          </Field>

          {form.placeOfResidence === "Abroad" ? (
            <>
              <Field label="Country of residence" required error={errors.countryIfAbroad} id="countryIfAbroad">
                <SelectInput
                  id="countryIfAbroad"
                  value={form.countryIfAbroad}
                  onChange={(e) => update("countryIfAbroad", e.target.value)}
                  error={errors.countryIfAbroad}
                >
                  <option value="">Select country…</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field
                label="Current city / town / village"
                required
                error={errors.cityTownVillage}
                id="cityTownVillage"
              >
                <TextInput
                  id="cityTownVillage"
                  value={form.cityTownVillage}
                  onChange={(e) => update("cityTownVillage", e.target.value)}
                  error={errors.cityTownVillage}
                />
              </Field>
            </>
          ) : null}

          {form.placeOfResidence && form.placeOfResidence !== "Abroad" ? (
            <>
              <Field
                label={`Current city / town / village in ${form.placeOfResidence}`}
                required
                error={errors.cityTownVillage}
                id="cityTownVillage"
              >
                <SelectInput
                  id="cityTownVillage"
                  value={form.cityTownVillage}
                  onChange={(e) => update("cityTownVillage", e.target.value)}
                  error={errors.cityTownVillage}
                >
                  <option value="">Select…</option>
                  {cityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              {form.cityTownVillage === "Other" ? (
                <Field
                  label={`Specify city / town / village in ${form.placeOfResidence}`}
                  required
                  error={errors.cityTownVillageOther}
                  id="cityTownVillageOther"
                >
                  <TextInput
                    id="cityTownVillageOther"
                    value={form.cityTownVillageOther}
                    onChange={(e) => update("cityTownVillageOther", e.target.value)}
                    error={errors.cityTownVillageOther}
                  />
                </Field>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div id="profile-section-contact" className="scroll-mt-24 space-y-6">
        <ProfileContactChangePanel contact={contact} account={account} />

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
          <SectionHeading as="h3" className="border-b border-zinc-100 dark:border-zinc-800 pb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Other contact details
          </SectionHeading>
        <div className="mt-4 space-y-5">
          <SocialContactField
            platform="facebook"
            label="Facebook"
            id="facebook"
            value={form.facebook}
            onChange={(value) => update("facebook", value)}
          />
          <SocialContactField
            platform="instagram"
            label="Instagram"
            id="instagram"
            value={form.instagram}
            onChange={(value) => update("instagram", value)}
          />
          <SocialContactField
            platform="tiktok"
            label="TikTok"
            id="tiktok"
            value={form.tiktok}
            onChange={(value) => update("tiktok", value)}
          />

          <Field label="Other contact platform" id="otherContactPlatform">
            <SelectInput
              id="otherContactPlatform"
              value={form.otherContactPlatform}
              onChange={(e) => update("otherContactPlatform", e.target.value)}
            >
              <option value="">Select…</option>
              {OTHER_CONTACT_PLATFORM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectInput>
          </Field>

          {form.otherContactPlatform === "Other" ? (
            <Field label="Specify platform" id="otherContactPlatformCustom">
              <TextInput
                id="otherContactPlatformCustom"
                value={form.otherContactPlatformCustom}
                onChange={(e) => update("otherContactPlatformCustom", e.target.value)}
              />
            </Field>
          ) : null}

          <Field label="Other contact handle / number" id="otherContact">
            <TextInput
              id="otherContact"
              value={form.otherContact}
              onChange={(e) => update("otherContact", e.target.value)}
              error={errors.otherContact}
            />
          </Field>

          <Field
            label="Street address / physical contact address"
            error={errors.streetAddress ?? errors.contact}
            id="streetAddress"
            hint="Required if you provide fewer than two electronic contact methods."
          >
            <TextArea
              id="streetAddress"
              value={form.streetAddress}
              onChange={(e) => update("streetAddress", e.target.value)}
              error={errors.streetAddress ?? errors.contact}
            />
          </Field>
        </div>
      </div>
      </div>

      <div
        id="profile-section-interests"
        className="scroll-mt-24 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6"
      >
        <SectionHeading as="h3" className="border-b border-zinc-100 dark:border-zinc-800 pb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Research interests
        </SectionHeading>
        <div className="mt-4 space-y-5">
          {form.placeOfResidence !== "Abroad" || registeredVoter ? (
            <Field label="Political / election polls" required={registeredVoter} error={errors.politicalInterests}>
              <MultiSelect
                options={POLITICAL_INTERESTS}
                values={form.politicalInterests}
                onChange={(values) => update("politicalInterests", values)}
                error={errors.politicalInterests}
              />
            </Field>
          ) : null}
          {form.placeOfResidence !== "Abroad" ? (
            <Field label="Market research" required error={errors.marketInterests}>
              <MultiSelect
                options={MARKET_INTERESTS}
                values={form.marketInterests}
                onChange={(values) => update("marketInterests", values)}
                error={errors.marketInterests}
              />
            </Field>
          ) : null}
          <Field label="Civic / public / social issues" required error={errors.civicInterests}>
            <MultiSelect
              options={CIVIC_INTERESTS}
              values={form.civicInterests}
              onChange={(values) => update("civicInterests", values)}
              error={errors.civicInterests}
            />
          </Field>
        </div>
      </div>

      {errors.submit ? (
        <p className="text-sm text-red-600" role="alert">
          {errors.submit}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="submit"
          disabled={submitting}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 sm:w-auto"
        >
          {submitting ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="flex min-h-12 w-full items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:bg-zinc-950 disabled:opacity-60 sm:w-auto"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

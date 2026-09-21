"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DateOfBirthPicker } from "@/components/registration/DateOfBirthPicker";
import { CitizenshipEligibilityBanner } from "@/components/registration/CitizenshipEligibilityBanner";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import {
  choiceBoxLabelClass,
  Field,
  FieldGroup,
  siteRadioClass,
  TextInput,
} from "@/components/registration/form-ui";
import { PasswordStrengthBar } from "@/components/registration/PasswordStrengthBar";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthMethodDivider, FacebookAuthButton } from "@/components/auth/FacebookAuthButton";
import { PasswordMatchStatus } from "@/components/auth/PasswordMatchStatus";
import { useLocale, useSignupCopy } from "@/components/locale/LocaleProvider";
import type { SignupFormData } from "@/lib/auth-types";
import { CITIZENSHIP_STATUS } from "@/lib/constants";
import { isValidDobString } from "@/lib/dob";
import { citizenshipLabelFor } from "@/lib/signup-locale";
import {
  isSignupEligible,
  validateSignupEligibility,
  validateSignupForm,
  validatePasswordMatch,
  type FieldErrors,
} from "@/lib/signup-validation";
import { scrollToFirstElementById, scrollViewportToTop } from "@/lib/scroll-viewport";
import { isEligibleCitizenship, meetsMinimumAge, passwordStrength } from "@/lib/validation";
import { localizeValidationMessage } from "@/lib/validation-i18n";

const initialForm: SignupFormData = {
  citizenshipStatus: "",
  commonwealthCountry: "",
  dob: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function SignupForm({ nextPath = "/register" }: { nextPath?: string }) {
  const router = useRouter();
  const copy = useSignupCopy();
  const locale = useLocale();
  const [step, setStep] = useState<"eligibility" | "account">("eligibility");
  const [form, setForm] = useState<SignupFormData>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  useEffect(() => {
    scrollViewportToTop();
  }, [step]);

  const tError = (message?: string) =>
    message ? localizeValidationMessage(message, locale) : undefined;

  const ageIneligible = isValidDobString(form.dob) && !meetsMinimumAge(form.dob);
  const citizenshipIneligible =
    Boolean(form.citizenshipStatus) && !isEligibleCitizenship(form.citizenshipStatus);
  const eligibilityBlocked = ageIneligible || citizenshipIneligible;

  const pwdStrength = useMemo(
    () => passwordStrength(form.password, "", form.firstName, form.lastName),
    [form.password, form.firstName, form.lastName]
  );

  const update = <K extends keyof SignupFormData>(key: K, value: SignupFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string] && key !== "password" && key !== "confirmPassword") return prev;
      const next = { ...prev };
      delete next[key as string];
      if (key === "password" || key === "confirmPassword") {
        delete next.confirmPassword;
      }
      return next;
    });
  };

  const confirmPasswordError =
    errors.confirmPassword ??
    (confirmPasswordTouched || form.confirmPassword
      ? validatePasswordMatch(form.password, form.confirmPassword) ?? undefined
      : undefined);
  const showPasswordMatchStatus = Boolean(form.confirmPassword);

  const handleContinueEligibility = () => {
    const validationErrors = validateSignupEligibility(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      scrollToFirstElementById(Object.keys(validationErrors));
      return;
    }
    if (!isSignupEligible(form)) return;
    setStep("account");
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmPasswordTouched(true);
    const validationErrors = validateSignupForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      scrollToFirstElementById([
        "firstName",
        "lastName",
        "email",
        "password",
        "confirmPassword",
        ...Object.keys(validationErrors),
      ]);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        email?: string;
        accountEmail?: string;
        emailSent?: boolean;
        emailError?: string;
        verifyUrl?: string;
        errors?: FieldErrors;
        message?: string;
      };

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setErrors({ submit: data.message ?? "Could not create account." });
        return;
      }

      const params = new URLSearchParams({
        email: data.email ?? form.email,
        next: nextPath,
        emailSent: data.emailSent ? "1" : "0",
      });
      if (data.verifyUrl && !data.emailSent) params.set("verifyUrl", data.verifyUrl);
      if (data.emailError && !data.emailSent) params.set("emailError", data.emailError);
      router.push(`/signup/check-email?${params.toString()}`);
    } catch {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "eligibility") {
    return (
      <div className="space-y-5">
        <div>
          <p className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {copy.citizenshipLabel} <span className="text-red-600">*</span>
          </p>
          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">{copy.citizenshipIntro}</p>
          <p className="mb-3 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900 dark:border-teal-700 dark:bg-teal-950/80 dark:text-teal-100">
            {copy.citizenshipProofNote}
          </p>
          <div className="flex flex-col gap-3">
            {CITIZENSHIP_STATUS.map((status) => (
              <label key={status} className={choiceBoxLabelClass}>
                <input
                  type="radio"
                  name="citizenshipStatus"
                  checked={form.citizenshipStatus === status}
                  onChange={() => update("citizenshipStatus", status)}
                  className={siteRadioClass}
                />
                <span>{citizenshipLabelFor(locale, status)}</span>
              </label>
            ))}
          </div>
          {errors.citizenshipStatus ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {tError(errors.citizenshipStatus)}
            </p>
          ) : null}
          {citizenshipIneligible ? (
            <CitizenshipEligibilityBanner
              citizenshipStatus={form.citizenshipStatus}
              eligible={false}
              compact
            />
          ) : null}
        </div>

        {!citizenshipIneligible ? (
          <Field label={copy.dobLabel} required error={tError(errors.dob)} id="dob">
            <DateOfBirthPicker
              value={form.dob}
              onChange={(dob) => update("dob", dob)}
              error={tError(errors.dob)}
              compact
            />
          </Field>
        ) : null}

        {eligibilityBlocked ? (
          <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <Link
              href="/"
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 sm:ml-auto sm:w-auto"
            >
              {copy.returnHome}
            </Link>
          </div>
        ) : (
          <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleContinueEligibility}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 sm:ml-auto sm:w-auto"
            >
              {copy.continueAccount}
            </button>
          </div>
        )}

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          {copy.alreadyHaveAccount}{" "}
          <Link
            href={`/login?next=${encodeURIComponent(nextPath)}`}
            className="font-medium text-teal-700 hover:text-teal-900 dark:text-teal-100"
          >
            {copy.logIn}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BrandedAlert tone="success" title={copy.eligibilityConfirmedTitle} showIcon formatBody={false}>
        <p>{citizenshipLabelFor(locale, form.citizenshipStatus)}</p>
        <p className="mt-2">{copy.eligibilityConfirmedBody}</p>
        <button
          type="button"
          onClick={() => setStep("eligibility")}
          className="mt-2 text-sm font-medium text-teal-700 hover:text-teal-900 dark:text-teal-100"
        >
          {copy.changeEligibility}
        </button>
      </BrandedAlert>

      <FacebookAuthButton
        nextPath={nextPath}
        mode="signup"
        label={copy.facebookSignup}
        connectingLabel={copy.facebookConnecting}
        eligibility={{
          citizenshipStatus: form.citizenshipStatus,
          commonwealthCountry: "",
          dob: form.dob,
        }}
      />
      <AuthMethodDivider label={copy.orCreateWithEmail} />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FieldGroup columns={2}>
          <Field label={copy.firstName} required error={tError(errors.firstName)} id="firstName">
            <TextInput
              id="firstName"
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              error={tError(errors.firstName)}
              autoComplete="given-name"
            />
          </Field>
          <Field label={copy.lastName} required error={tError(errors.lastName)} id="lastName">
            <TextInput
              id="lastName"
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              error={tError(errors.lastName)}
              autoComplete="family-name"
            />
          </Field>
        </FieldGroup>

        <Field label={copy.email} required error={tError(errors.email)} id="email">
          <TextInput
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            error={tError(errors.email)}
            autoComplete="email"
          />
        </Field>

        <Field label={copy.password} required error={tError(errors.password)} id="password">
          <PasswordInput
            id="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            error={tError(errors.password)}
            autoComplete="new-password"
          />
          <PasswordStrengthBar strength={pwdStrength} />
        </Field>

        <Field
          label={copy.confirmPassword}
          required
          error={tError(confirmPasswordError)}
          id="confirmPassword"
        >
          <PasswordInput
            id="confirmPassword"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            onBlur={() => setConfirmPasswordTouched(true)}
            error={tError(confirmPasswordError)}
            autoComplete="new-password"
          />
          <PasswordMatchStatus
            password={form.password}
            confirmPassword={form.confirmPassword}
            show={showPasswordMatchStatus}
            matchLabel={copy.passwordsMatch}
          />
        </Field>

        {errors.submit ? (
          <p className="text-sm text-red-600" role="alert">
            {tError(errors.submit)}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            onClick={() => setStep("eligibility")}
            className="flex min-h-12 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:w-auto"
          >
            {copy.back}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 sm:w-auto"
          >
            {submitting ? copy.creatingAccount : copy.createAccount}
          </button>
        </div>

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          {copy.alreadyHaveAccount}{" "}
          <Link
            href={`/login?next=${encodeURIComponent(nextPath)}`}
            className="font-medium text-teal-700 hover:text-teal-900 dark:text-teal-100"
          >
            {copy.logIn}
          </Link>
        </p>
      </form>
    </div>
  );
}

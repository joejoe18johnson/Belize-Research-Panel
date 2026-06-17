"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DateOfBirthPicker } from "@/components/registration/DateOfBirthPicker";
import {
  choiceBoxLabelClass,
  Field,
  FieldGroup,
  SelectInput,
  siteRadioClass,
  TextInput,
} from "@/components/registration/form-ui";
import { PasswordStrengthBar } from "@/components/registration/PasswordStrengthBar";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordMatchStatus } from "@/components/auth/PasswordMatchStatus";
import type { SignupFormData } from "@/lib/auth-types";
import { CITIZENSHIP_STATUS, COMMONWEALTH_COUNTRIES } from "@/lib/constants";
import { isValidDobString } from "@/lib/dob";
import {
  isSignupEligible,
  validateSignupEligibility,
  validateSignupForm,
  validatePasswordMatch,
  type FieldErrors,
} from "@/lib/signup-validation";
import { meetsMinimumAge, passwordStrength } from "@/lib/validation";

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
  const [step, setStep] = useState<"eligibility" | "account">("eligibility");
  const [form, setForm] = useState<SignupFormData>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  const ageIneligible = isValidDobString(form.dob) && !meetsMinimumAge(form.dob);
  const needsCommonwealthCountry =
    form.citizenshipStatus === "Citizen of a Commonwealth country living in Belize";

  const pwdStrength = useMemo(
    () => passwordStrength(form.password, "", form.firstName, form.lastName),
    [form.password, form.firstName, form.lastName]
  );

  const update = <K extends keyof SignupFormData>(key: K, value: SignupFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "citizenshipStatus") {
        next.commonwealthCountry = "";
      }
      return next;
    });
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
    if (Object.keys(validationErrors).length > 0) return;
    if (!isSignupEligible(form)) return;
    setStep("account");
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmPasswordTouched(true);
    const validationErrors = validateSignupForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

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
      });
      if (data.verifyUrl) params.set("verifyUrl", data.verifyUrl);
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
          <p className="mb-1.5 block text-sm font-medium text-zinc-800">
            Citizenship / residency status <span className="text-red-600">*</span>
          </p>
          <p className="mb-3 text-sm text-zinc-600">
            The panel is open to citizens of Belize, Commonwealth citizens living in Belize, and other residents of
            Belize who qualify under our eligibility rules. Foreign nationals living outside Belize cannot register.
          </p>
          <p className="mb-3 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
            You will be required to provide proof of your citizenship or residency during panelist registration.
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
                <span>{status}</span>
              </label>
            ))}
          </div>
          {errors.citizenshipStatus ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {errors.citizenshipStatus}
            </p>
          ) : null}
        </div>

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
              <option value="">Select commonwealth country</option>
              {COMMONWEALTH_COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </SelectInput>
          </Field>
        ) : null}

        <Field label="Date of birth" required error={errors.dob} id="dob">
          <DateOfBirthPicker
            value={form.dob}
            onChange={(dob) => update("dob", dob)}
            error={errors.dob}
            compact
          />
        </Field>

        {ageIneligible ? (
          <div className="border-t border-zinc-100 pt-4">
            <Link
              href="/"
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 sm:ml-auto sm:w-auto"
            >
              Return home
            </Link>
          </div>
        ) : (
          <div className="border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={handleContinueEligibility}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 sm:ml-auto sm:w-auto"
            >
              Continue to account setup
            </button>
          </div>
        )}

        <p className="text-center text-sm text-zinc-600">
          Already have an account?{" "}
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-medium text-teal-700 hover:text-teal-900">
            Log in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <p className="font-medium">Eligibility confirmed</p>
        <p className="mt-1">{form.citizenshipStatus}</p>
        <p className="mt-2 text-emerald-800">
          Proof of citizenship or residency will be required when you complete panelist registration.
        </p>
        <button
          type="button"
          onClick={() => setStep("eligibility")}
          className="mt-2 text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          Change eligibility answers
        </button>
      </div>

      <FieldGroup columns={2}>
        <Field label="First name" required error={errors.firstName} id="firstName">
          <TextInput
            id="firstName"
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            error={errors.firstName}
            autoComplete="given-name"
          />
        </Field>
        <Field label="Last name(s)" required error={errors.lastName} id="lastName">
          <TextInput
            id="lastName"
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            error={errors.lastName}
            autoComplete="family-name"
          />
        </Field>
      </FieldGroup>

      <Field label="Email address" required error={errors.email} id="email">
        <TextInput
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          error={errors.email}
          autoComplete="email"
        />
      </Field>

      <Field label="Password" required error={errors.password} id="password">
        <PasswordInput
          id="password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />
        <PasswordStrengthBar strength={pwdStrength} />
      </Field>

      <Field label="Confirm password" required error={confirmPasswordError} id="confirmPassword">
        <PasswordInput
          id="confirmPassword"
          value={form.confirmPassword}
          onChange={(e) => update("confirmPassword", e.target.value)}
          onBlur={() => setConfirmPasswordTouched(true)}
          error={confirmPasswordError}
          autoComplete="new-password"
        />
        <PasswordMatchStatus
          password={form.password}
          confirmPassword={form.confirmPassword}
          show={showPasswordMatchStatus}
        />
      </Field>

      {errors.submit ? <p className="text-sm text-red-600" role="alert">{errors.submit}</p> : null}

      <div className="flex flex-col-reverse gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setStep("eligibility")}
          className="flex min-h-12 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:w-auto"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 sm:w-auto"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </div>

      <p className="text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-medium text-teal-700 hover:text-teal-900">
          Log in
        </Link>
      </p>
    </form>
  );
}

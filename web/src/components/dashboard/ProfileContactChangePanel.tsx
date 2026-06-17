"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatHeadingCase } from "@/lib/sentence-case";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { PhoneNumberField } from "@/components/registration/PhoneNumberField";
import { Field, TextInput } from "@/components/registration/form-ui";
import type { SessionAccount } from "@/lib/auth-types";
import type { ProfileContactDisplay } from "@/lib/profile-update-types";
import type { FieldErrors } from "@/lib/validation";

export function ProfileContactChangePanel({
  contact,
  account,
}: {
  contact: ProfileContactDisplay;
  account: Pick<
    SessionAccount,
    "accountStatus" | "holdReason" | "pendingEmail" | "pendingPhone" | "email"
  >;
}) {
  const router = useRouter();
  const [newEmail, setNewEmail] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState(contact.phoneCountryCode);
  const [phoneLocalNumber, setPhoneLocalNumber] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [phoneMessage, setPhoneMessage] = useState("");

  const onHold = account.accountStatus === "on_hold";

  const requestEmailChange = async () => {
    setEmailSubmitting(true);
    setErrors({});
    setEmailMessage("");

    try {
      const res = await fetch("/api/profile/request-email-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        errors?: FieldErrors;
        message?: string;
      };

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setErrors({ emailChange: data.message ?? "Could not request email change." });
        return;
      }

      setEmailMessage(data.message ?? "Email change submitted for admin review.");
      router.push("/dashboard/account-on-hold?emailRequested=1");
    } catch {
      setErrors({ emailChange: "Network error. Please try again." });
    } finally {
      setEmailSubmitting(false);
    }
  };

  const requestPhoneChange = async () => {
    setPhoneSubmitting(true);
    setErrors({});
    setPhoneMessage("");

    try {
      const res = await fetch("/api/profile/request-phone-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneCountryCode, phoneLocalNumber }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        errors?: FieldErrors;
      };

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        else setErrors({ phoneChange: data.message ?? "Could not request phone change." });
        return;
      }

      setPhoneMessage(data.message ?? "Phone change submitted for admin review.");
      router.push("/dashboard/account-on-hold?phoneRequested=1");
    } catch {
      setErrors({ phoneChange: "Network error. Please try again." });
    } finally {
      setPhoneSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
      <h3 className="border-b border-zinc-100 dark:border-zinc-800 pb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {formatHeadingCase("Email and phone")}
      </h3>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
        Changing your email or phone puts your account on hold until an administrator approves the update.
      </p>

      {onHold ? (
        <div className="mt-4">
          <BrandedAlert tone="warning" title="Account on hold" compact showIcon>
            {account.pendingEmail ? (
              <>
                Pending email approval: <span className="font-medium">{account.pendingEmail}</span>.{" "}
              </>
            ) : null}
            {account.pendingPhone ? (
              <>
                Pending phone approval: <span className="font-medium">{account.pendingPhone}</span>.{" "}
              </>
            ) : null}
            <Link href="/dashboard/account-on-hold" className="font-semibold text-teal-800 dark:text-teal-200 underline">
              View hold status
            </Link>
          </BrandedAlert>
        </div>
      ) : null}

      <div className="mt-5 space-y-6">
        <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 p-4">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Current email</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{account.email}</p>
          {!onHold ? (
            <div className="mt-4 space-y-3">
              <Field label="New email address" error={errors.newEmail ?? errors.emailChange} id="newEmail">
                <TextInput
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  error={errors.newEmail ?? errors.emailChange}
                  autoComplete="email"
                />
              </Field>
              <button
                type="button"
                onClick={requestEmailChange}
                disabled={emailSubmitting || !newEmail.trim()}
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 sm:w-auto"
              >
                {emailSubmitting ? "Submitting…" : "Request email change (admin approval)"}
              </button>
              {emailMessage ? <p className="text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{emailMessage}</p> : null}
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 p-4">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Current phone / WhatsApp</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{contact.phone || "Not provided"}</p>
          {!onHold ? (
            <div className="mt-4 space-y-3">
              <Field
                label="New phone / WhatsApp"
                error={errors.phoneLocalNumber ?? errors.phoneChange}
                id="newPhoneLocalNumber"
              >
                <PhoneNumberField
                  countryCode={phoneCountryCode}
                  localNumber={phoneLocalNumber}
                  onCountryCodeChange={setPhoneCountryCode}
                  onLocalNumberChange={setPhoneLocalNumber}
                  error={errors.phoneLocalNumber ?? errors.phoneChange}
                  id="newPhoneLocalNumber"
                />
              </Field>
              <button
                type="button"
                onClick={requestPhoneChange}
                disabled={phoneSubmitting || !phoneLocalNumber.trim()}
                className="flex min-h-12 w-full items-center justify-center rounded-xl border border-teal-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-semibold text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40 disabled:opacity-60 sm:w-auto"
              >
                {phoneSubmitting ? "Submitting…" : "Request phone change (admin approval)"}
              </button>
              {phoneMessage ? <p className="text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{phoneMessage}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

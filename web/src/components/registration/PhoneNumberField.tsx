"use client";

import { useAuthCopy, useLocale } from "@/components/locale/LocaleProvider";
import { getPhoneNumberRule, PHONE_COUNTRY_CODES } from "@/lib/phone-codes";
import { phoneLocalDigits } from "@/lib/validation";
import { localizeValidationMessage } from "@/lib/validation-i18n";
import { SelectInput, TextInput } from "./form-ui";

export function PhoneNumberField({
  countryCode,
  localNumber,
  onCountryCodeChange,
  onLocalNumberChange,
  onBlur,
  error,
  id = "phoneLocalNumber",
}: {
  countryCode: string;
  localNumber: string;
  onCountryCodeChange: (code: string) => void;
  onLocalNumberChange: (number: string) => void;
  onBlur?: () => void;
  error?: string;
  id?: string;
}) {
  const copy = useAuthCopy();
  const locale = useLocale();
  const rule = getPhoneNumberRule(countryCode);

  const handleLocalChange = (value: string) => {
    const digits = phoneLocalDigits(value).slice(0, rule.maxLength);
    onLocalNumberChange(digits);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start">
        <div className="sm:w-52 sm:shrink-0">
          <label htmlFor="phoneCountryCode" className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200 sm:sr-only">
            {copy.phoneCountryCode}
          </label>
          <SelectInput
            id="phoneCountryCode"
            value={countryCode}
            onChange={(e) => onCountryCodeChange(e.target.value)}
            onBlur={onBlur}
            aria-label={copy.phoneCountryCode}
          >
            {PHONE_COUNTRY_CODES.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.label}
              </option>
            ))}
          </SelectInput>
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200 sm:sr-only">
            {copy.phoneNumber}
          </label>
          <TextInput
            id={id}
            type="tel"
            inputMode="numeric"
            value={localNumber}
            onChange={(e) => handleLocalChange(e.target.value)}
            onBlur={onBlur}
            placeholder={rule.example}
            error={error}
            autoComplete="tel-national"
            maxLength={rule.maxLength}
          />
        </div>
      </div>
      {!error ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {localizeValidationMessage(rule.hint, locale)}
        </p>
      ) : null}
    </div>
  );
}

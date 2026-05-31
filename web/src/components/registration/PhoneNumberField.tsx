"use client";

import { PHONE_COUNTRY_CODES } from "@/lib/phone-codes";
import { phoneLocalDigits } from "@/lib/validation";
import { Field, SelectInput, TextInput } from "./form-ui";

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
  const handleLocalChange = (value: string) => {
    onLocalNumberChange(phoneLocalDigits(value));
  };

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start">
      <div className="sm:w-52 sm:shrink-0">
        <label htmlFor="phoneCountryCode" className="mb-1.5 block text-sm font-medium text-zinc-800 sm:sr-only">
          Country code
        </label>
        <SelectInput
          id="phoneCountryCode"
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          onBlur={onBlur}
          aria-label="Country code"
        >
          {PHONE_COUNTRY_CODES.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.label}
            </option>
          ))}
        </SelectInput>
      </div>
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-800 sm:sr-only">
          Phone number
        </label>
        <TextInput
          id={id}
          type="tel"
          inputMode="numeric"
          value={localNumber}
          onChange={(e) => handleLocalChange(e.target.value)}
          onBlur={onBlur}
          placeholder="Phone number without country code"
          error={error}
          autoComplete="tel-national"
        />
      </div>
    </div>
  );
}

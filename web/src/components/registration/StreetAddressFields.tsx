"use client";

import { Field, SelectInput, TextInput } from "./form-ui";
import { CtvAutocomplete } from "./CtvAutocomplete";
import { useRegistrationCopy } from "@/components/locale/LocaleProvider";
import { BELIZE_DISTRICTS } from "@/lib/constants";
import { titleCaseStreetAddress } from "@/lib/validation";

export function StreetAddressFields({
  streetAddress,
  addressCityVillage,
  addressDistrict,
  required,
  hint,
  errors,
  onChange,
  onBlurField,
}: {
  streetAddress: string;
  addressCityVillage: string;
  addressDistrict: string;
  required?: boolean;
  hint?: string;
  errors?: {
    streetAddress?: string;
    addressCityVillage?: string;
    addressDistrict?: string;
  };
  onChange: (field: "streetAddress" | "addressCityVillage" | "addressDistrict", value: string) => void;
  onBlurField?: (field: "streetAddress" | "addressCityVillage" | "addressDistrict") => void;
}) {
  const copy = useRegistrationCopy();

  return (
    <div className="space-y-4 rounded-xl border border-teal-800/10 bg-gradient-to-br from-teal-50/80 via-white to-sky-50/40 p-4 dark:border-teal-400/10 dark:from-teal-950/30 dark:via-zinc-900 dark:to-sky-950/20 sm:p-5">
      <div>
        <p className="text-sm font-semibold text-teal-900 dark:text-teal-100">{copy.streetTitle}</p>
        {hint ? (
          <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{hint}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="sm:col-span-2 lg:col-span-1">
          <Field label={copy.streetAddress} required={required} error={errors?.streetAddress} id="streetAddress">
            <TextInput
              id="streetAddress"
              value={streetAddress}
              onChange={(e) => onChange("streetAddress", e.target.value)}
              onBlur={(e) => {
                const formatted = titleCaseStreetAddress(e.target.value);
                if (formatted !== streetAddress) onChange("streetAddress", formatted);
                onBlurField?.("streetAddress");
              }}
              error={errors?.streetAddress}
              placeholder={copy.streetAddressPlaceholder}
              autoComplete="street-address"
            />
          </Field>
        </div>

        <Field
          label={copy.cityOrVillage}
          required={required}
          error={errors?.addressCityVillage}
          id="addressCityVillage"
        >
          <CtvAutocomplete
            id="addressCityVillage"
            value={addressCityVillage}
            error={errors?.addressCityVillage}
            placeholder={copy.ctvPlaceholder}
            onChange={(value) => onChange("addressCityVillage", value)}
            onBlur={() => onBlurField?.("addressCityVillage")}
            onSelectDistrict={(district) => {
              if (!addressDistrict) onChange("addressDistrict", district);
            }}
          />
        </Field>

        <Field label={copy.district} required={required} error={errors?.addressDistrict} id="addressDistrict">
          <SelectInput
            id="addressDistrict"
            value={addressDistrict}
            onChange={(e) => onChange("addressDistrict", e.target.value)}
            onBlur={() => onBlurField?.("addressDistrict")}
            error={errors?.addressDistrict}
          >
            <option value="">{copy.selectDistrict}</option>
            {BELIZE_DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
    </div>
  );
}

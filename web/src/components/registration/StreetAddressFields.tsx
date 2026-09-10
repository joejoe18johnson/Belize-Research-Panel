"use client";

import { Field, SelectInput, TextInput } from "./form-ui";
import { useRegistrationCopy } from "@/components/locale/LocaleProvider";
import { BELIZE_DISTRICTS, getCtvOptionsForDistrict } from "@/lib/constants";
import { titleCaseStreetAddress } from "@/lib/validation";

type AddressFieldKey =
  | "addressHouseNumber"
  | "streetAddress"
  | "addressCityVillage"
  | "addressCityVillageOther"
  | "addressDistrict";

const DEFAULT_FIELD_IDS: Record<AddressFieldKey, string> = {
  addressHouseNumber: "addressHouseNumber",
  streetAddress: "streetAddress",
  addressCityVillage: "addressCityVillage",
  addressCityVillageOther: "addressCityVillageOther",
  addressDistrict: "addressDistrict",
};

export function StreetAddressFields({
  addressHouseNumber = "",
  streetAddress,
  addressCityVillage,
  addressCityVillageOther = "",
  addressDistrict,
  required,
  hint,
  title,
  fieldIds,
  errors,
  onChange,
  onBlurField,
}: {
  addressHouseNumber?: string;
  streetAddress: string;
  addressCityVillage: string;
  addressCityVillageOther?: string;
  addressDistrict: string;
  required?: boolean;
  hint?: string;
  /** Override the section title; pass `null` to hide the title. */
  title?: string | null;
  fieldIds?: Partial<Record<AddressFieldKey, string>>;
  errors?: Partial<Record<AddressFieldKey, string>>;
  onChange: (field: AddressFieldKey, value: string) => void;
  onBlurField?: (field: AddressFieldKey) => void;
}) {
  const copy = useRegistrationCopy();
  const ids = { ...DEFAULT_FIELD_IDS, ...fieldIds };
  const sectionTitle = title === undefined ? copy.streetTitle : title;
  const ctvOptions = addressDistrict ? getCtvOptionsForDistrict(addressDistrict) : [];
  const showOtherCtv = addressCityVillage === "Other";

  return (
    <div className="space-y-4 rounded-xl border border-teal-800/10 bg-gradient-to-br from-teal-50/80 via-white to-sky-50/40 p-4 dark:border-teal-400/10 dark:from-teal-950/30 dark:via-zinc-900 dark:to-sky-950/20 sm:p-5">
      {sectionTitle || hint ? (
        <div>
          {sectionTitle ? (
            <p className="text-sm font-semibold text-teal-900 dark:text-teal-100">{sectionTitle}</p>
          ) : null}
          {hint ? (
            <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{hint}</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={copy.district} required={required} error={errors?.addressDistrict} id={ids.addressDistrict}>
          <SelectInput
            id={ids.addressDistrict}
            value={addressDistrict}
            onChange={(e) => {
              const nextDistrict = e.target.value;
              onChange("addressDistrict", nextDistrict);
              if (addressCityVillage) {
                const nextOptions = nextDistrict ? getCtvOptionsForDistrict(nextDistrict) : [];
                if (!nextOptions.includes(addressCityVillage)) {
                  onChange("addressCityVillage", "");
                  onChange("addressCityVillageOther", "");
                }
              }
            }}
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

        <Field
          label={copy.cityOrVillage}
          required={required}
          error={errors?.addressCityVillage}
          id={ids.addressCityVillage}
        >
          <SelectInput
            id={ids.addressCityVillage}
            value={addressCityVillage}
            disabled={!addressDistrict}
            onChange={(e) => {
              const next = e.target.value;
              onChange("addressCityVillage", next);
              if (next !== "Other") onChange("addressCityVillageOther", "");
            }}
            onBlur={() => onBlurField?.("addressCityVillage")}
            error={errors?.addressCityVillage}
          >
            <option value="">{addressDistrict ? copy.selectCtv : copy.selectDistrictFirst}</option>
            {ctvOptions.map((ctv) => (
              <option key={ctv} value={ctv}>
                {ctv}
              </option>
            ))}
          </SelectInput>
        </Field>

        {showOtherCtv ? (
          <div className="sm:col-span-2">
            <Field
              label={copy.cityOrVillageOther}
              required={required}
              error={errors?.addressCityVillageOther}
              id={ids.addressCityVillageOther}
            >
              <TextInput
                id={ids.addressCityVillageOther}
                value={addressCityVillageOther}
                onChange={(e) => onChange("addressCityVillageOther", e.target.value)}
                onBlur={() => onBlurField?.("addressCityVillageOther")}
                error={errors?.addressCityVillageOther}
                placeholder={copy.cityOrVillageOtherPlaceholder}
              />
            </Field>
          </div>
        ) : null}

        <Field
          label={copy.houseNumber}
          required={false}
          hint={copy.optional}
          error={errors?.addressHouseNumber}
          id={ids.addressHouseNumber}
        >
          <TextInput
            id={ids.addressHouseNumber}
            value={addressHouseNumber}
            onChange={(e) => onChange("addressHouseNumber", e.target.value)}
            onBlur={() => onBlurField?.("addressHouseNumber")}
            error={errors?.addressHouseNumber}
            placeholder={copy.houseNumberPlaceholder}
            autoComplete="address-line2"
          />
        </Field>

        <Field label={copy.streetAddress} required={required} error={errors?.streetAddress} id={ids.streetAddress}>
          <TextInput
            id={ids.streetAddress}
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
    </div>
  );
}

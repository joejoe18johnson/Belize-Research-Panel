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
  lockDistrictAndCtv = false,
  lockedNote,
  onEditLockedSource,
  editLockedSourceLabel,
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
  /** When true, district / CTV come from residence and cannot be edited here. */
  lockDistrictAndCtv?: boolean;
  lockedNote?: string;
  onEditLockedSource?: () => void;
  editLockedSourceLabel?: string;
}) {
  const copy = useRegistrationCopy();
  const ids = { ...DEFAULT_FIELD_IDS, ...fieldIds };
  const sectionTitle = title === undefined ? copy.streetTitle : title;
  const ctvOptions = addressDistrict ? getCtvOptionsForDistrict(addressDistrict) : [];
  const showOtherCtv = addressCityVillage === "Other";
  const lockedSelectClass = lockDistrictAndCtv
    ? "bg-zinc-100 text-zinc-500 opacity-70 dark:bg-zinc-950 dark:text-zinc-400"
    : "";

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

      {lockDistrictAndCtv && lockedNote ? (
        <div className="rounded-lg border border-red-200/80 bg-red-50/90 px-3 py-2.5 dark:border-red-800 dark:bg-red-950/40">
          <p className="text-xs font-semibold leading-relaxed text-red-700 dark:text-red-300">{lockedNote}</p>
          {onEditLockedSource && editLockedSourceLabel ? (
            <button
              type="button"
              onClick={onEditLockedSource}
              className="mt-2 inline-flex min-h-9 items-center rounded-lg border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-800 transition hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-950 dark:text-teal-100 dark:hover:bg-teal-900/60"
            >
              {editLockedSourceLabel}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={copy.district} required={required} error={errors?.addressDistrict} id={ids.addressDistrict}>
          <SelectInput
            id={ids.addressDistrict}
            value={addressDistrict}
            disabled={lockDistrictAndCtv}
            className={lockedSelectClass}
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
            disabled={lockDistrictAndCtv || !addressDistrict}
            className={
              lockDistrictAndCtv || !addressDistrict
                ? "bg-zinc-100 text-zinc-500 opacity-70 dark:bg-zinc-950 dark:text-zinc-400"
                : ""
            }
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
                readOnly={lockDistrictAndCtv}
                tabIndex={lockDistrictAndCtv ? -1 : undefined}
                className={lockedSelectClass}
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

        <Field
          label={copy.streetAddress}
          required
          hint={copy.streetAddressHint}
          error={errors?.streetAddress}
          id={ids.streetAddress}
        >
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

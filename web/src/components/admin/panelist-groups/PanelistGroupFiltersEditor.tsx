"use client";

import { FilterMultiSelect } from "@/components/admin/shared/AdminUi";
import {
  EMPTY_SAMPLE_FILTERS,
  sampleFilterOptions,
  type SampleFilters,
} from "@/lib/admin-sample-selection";
import type { SamplePanelistRow } from "@/lib/admin-sample-selection";
import { formatHeadingCase } from "@/lib/sentence-case";
import { siteCheckboxClass } from "@/lib/site-controls";

export function PanelistGroupFiltersEditor({
  filters,
  options,
  onChange,
}: {
  filters: SampleFilters;
  options: ReturnType<typeof sampleFilterOptions>;
  onChange: (filters: SampleFilters) => void;
}) {
  const update = <K extends keyof SampleFilters>(key: K, value: SampleFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Save filter rules for this group. Member counts update when panelists match these criteria.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FilterMultiSelect
          label="Place of residence"
          options={options.residence}
          selected={filters.residence}
          onChange={(value) => update("residence", value)}
        />
        <FilterMultiSelect
          label="District"
          options={options.districts}
          selected={filters.districts}
          onChange={(value) => update("districts", value)}
        />
        <FilterMultiSelect
          label="City / town / village"
          options={options.cities}
          selected={filters.cities}
          onChange={(value) => update("cities", value)}
        />
        <FilterMultiSelect
          label="Constituency"
          options={options.constituencies}
          selected={filters.constituencies}
          onChange={(value) => update("constituencies", value)}
        />
        <FilterMultiSelect
          label="CTV area"
          options={options.ctvAreas}
          selected={filters.ctvAreas}
          onChange={(value) => update("ctvAreas", value)}
        />
        <FilterMultiSelect
          label="Country if abroad"
          options={options.countriesAbroad}
          selected={filters.countriesAbroad}
          onChange={(value) => update("countriesAbroad", value)}
        />
        <FilterMultiSelect
          label="Sex"
          options={options.sexes}
          selected={filters.sexes}
          onChange={(value) => update("sexes", value)}
        />
        <FilterMultiSelect
          label="Age group"
          options={["18–24", "25–34", "35–44", "45–54", "55–64", "65+", "Unknown"]}
          selected={filters.ageGroups}
          onChange={(value) => update("ageGroups", value)}
        />
        <FilterMultiSelect
          label="Ethnicity"
          options={options.ethnicities}
          selected={filters.ethnicities}
          onChange={(value) => update("ethnicities", value)}
        />
        <FilterMultiSelect
          label="Education"
          options={options.educations}
          selected={filters.educations}
          onChange={(value) => update("educations", value)}
        />
        <FilterMultiSelect
          label="Verification"
          options={options.verificationStatuses}
          selected={filters.verificationStatuses}
          onChange={(value) => update("verificationStatuses", value)}
        />
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Age min</label>
          <input
            type="number"
            min={18}
            max={filters.ageMax}
            value={filters.ageMin}
            onChange={(event) => update("ageMin", Number(event.target.value))}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Age max</label>
          <input
            type="number"
            min={filters.ageMin}
            max={120}
            value={filters.ageMax}
            onChange={(event) => update("ageMax", Number(event.target.value))}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
          />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={filters.registeredVotersOnly}
            onChange={(event) => update("registeredVotersOnly", event.target.checked)}
            className={siteCheckboxClass}
          />
          {formatHeadingCase("Registered voters only")}
        </label>
      </div>
    </div>
  );
}

export function buildSampleFilterOptions(rows: SamplePanelistRow[]) {
  const options = sampleFilterOptions(rows);
  return {
    ...options,
    defaultFilters: {
      ...EMPTY_SAMPLE_FILTERS,
      ageMax: options.maxAge,
    } satisfies SampleFilters,
  };
}

"use client";

import { useMemo, useState } from "react";
import { HorizontalBarChart } from "@/components/admin/analytics/AnalyticsCharts";
import { FilterMultiSelect, MetricCard, PageIntro } from "@/components/admin/shared/AdminUi";
import { TablePagination, useTablePagination } from "@/components/admin/shared/TablePagination";
import {
  applySampleFilters,
  calculateSampleSize,
  contactsNeeded,
  EMPTY_SAMPLE_FILTERS,
  generateRandomSample,
  panelistToSampleRow,
  SAMPLING_METHODS,
  sampleFilterOptions,
  sampleRowsToCsv,
  sortSampleRows,
  type SampleFilters,
  type SamplePanelistRow,
  type SamplingMethod,
} from "@/lib/admin-sample-selection";
import type { PanelistRow } from "@/lib/panelists";
import { formatHeadingCase } from "@/lib/sentence-case";
import { siteCheckboxClass } from "@/lib/site-controls";
import { SiteSelect, mapStringOptions } from "@/components/shared/SiteSelect";

type Tab = "filters" | "calculator" | "sample";
type SortKey = keyof Pick<
  SamplePanelistRow,
  "lastName" | "district" | "constituency" | "sex" | "age" | "verificationStatus"
>;

export function AdminSampleSelectionDashboard({ panelists }: { panelists: PanelistRow[] }) {
  const allRows = useMemo(() => panelists.map(panelistToSampleRow), [panelists]);
  const options = useMemo(() => sampleFilterOptions(allRows), [allRows]);

  const [tab, setTab] = useState<Tab>("filters");
  const [filters, setFilters] = useState<SampleFilters>({
    ...EMPTY_SAMPLE_FILTERS,
    ageMax: options.maxAge,
  });
  const [samplingMethod, setSamplingMethod] = useState<SamplingMethod>("Simple Random Sample");
  const [sampleSize, setSampleSize] = useState(100);
  const [generatedSample, setGeneratedSample] = useState<SamplePanelistRow[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("lastName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [populationSize, setPopulationSize] = useState(1000);
  const [marginError, setMarginError] = useState(5);
  const [confidenceLevel, setConfidenceLevel] = useState<"90%" | "95%" | "99%">("95%");
  const [responseRate, setResponseRate] = useState(35);

  const filteredPool = useMemo(() => applySampleFilters(allRows, filters), [allRows, filters]);

  const requiredSample = useMemo(
    () => calculateSampleSize(populationSize, marginError, confidenceLevel),
    [populationSize, marginError, confidenceLevel]
  );
  const contacts = useMemo(
    () => contactsNeeded(requiredSample, responseRate),
    [requiredSample, responseRate]
  );

  const districtBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of filteredPool) {
      const label = row.district || "Unknown";
      map.set(label, (map.get(label) ?? 0) + 1);
    }
    const total = filteredPool.length || 1;
    return [...map.entries()]
      .map(([label, count]) => ({
        label,
        count,
        percent: Math.round((count / total) * 1000) / 10,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredPool]);

  const displayRows = useMemo(() => {
    const rows = tab === "sample" ? generatedSample : filteredPool;
    return sortSampleRows(rows, sortKey, sortDirection);
  }, [tab, generatedSample, filteredPool, sortKey, sortDirection]);

  const tablePagination = useTablePagination(displayRows);

  const updateFilter = <K extends keyof SampleFilters>(key: K, value: SampleFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setGeneratedSample([]);
  };

  const generateSample = () => {
    const size = Math.min(sampleSize, filteredPool.length);
    setGeneratedSample(generateRandomSample(filteredPool, size, 42));
    setTab("sample");
  };

  const downloadCsv = () => {
    const rows = generatedSample.length > 0 ? generatedSample : filteredPool;
    const csv = sampleRowsToCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `belize-panel-sample-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortDirection === "asc" ? " ↑" : " ↓") : "");

  const TABS: { id: Tab; label: string }[] = [
    { id: "filters", label: "Filter pool" },
    { id: "calculator", label: "Sample size calculator" },
    { id: "sample", label: "Generated sample" },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageIntro
        eyebrow="Fieldwork tools"
        title={formatHeadingCase("Sample selection engine")}
        description="Filter the panel register, calculate required sample sizes, draw a random sample, and export contact lists — ported from the Streamlit MVP Sample Selection module."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total panelists" value={allRows.length} />
        <MetricCard label="Filtered pool" value={filteredPool.length} />
        <MetricCard label="Generated sample" value={generatedSample.length} hint={generatedSample.length ? "Ready to export" : "Not generated yet"} />
        <MetricCard label="Suggested sample" value={requiredSample} hint={`At ${marginError}% MOE · ${confidenceLevel}`} />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
              tab === item.id
                ? "border border-b-0 border-teal-200 bg-white dark:bg-zinc-900 text-teal-900 dark:text-teal-100"
                : "text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 hover:bg-teal-50/50 hover:text-teal-800 dark:text-teal-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "filters" ? (
        <div className="space-y-4">
          <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Panel filters")}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FilterMultiSelect label="Place of residence" options={options.residence} selected={filters.residence} onChange={(v) => updateFilter("residence", v)} />
              <FilterMultiSelect label="District" options={options.districts} selected={filters.districts} onChange={(v) => updateFilter("districts", v)} />
              <FilterMultiSelect label="City / town / village" options={options.cities} selected={filters.cities} onChange={(v) => updateFilter("cities", v)} />
              <FilterMultiSelect label="Constituency" options={options.constituencies} selected={filters.constituencies} onChange={(v) => updateFilter("constituencies", v)} />
              <FilterMultiSelect label="CTV area" options={options.ctvAreas} selected={filters.ctvAreas} onChange={(v) => updateFilter("ctvAreas", v)} />
              <FilterMultiSelect label="Country if abroad" options={options.countriesAbroad} selected={filters.countriesAbroad} onChange={(v) => updateFilter("countriesAbroad", v)} />
              <FilterMultiSelect label="Sex" options={options.sexes} selected={filters.sexes} onChange={(v) => updateFilter("sexes", v)} />
              <FilterMultiSelect label="Ethnicity" options={options.ethnicities} selected={filters.ethnicities} onChange={(v) => updateFilter("ethnicities", v)} />
              <FilterMultiSelect label="Education" options={options.educations} selected={filters.educations} onChange={(v) => updateFilter("educations", v)} />
              <FilterMultiSelect label="Verification" options={options.verificationStatuses} selected={filters.verificationStatuses} onChange={(v) => updateFilter("verificationStatuses", v)} />
            </div>
            <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Age min</label>
                <input
                  type="number"
                  min={18}
                  max={filters.ageMax}
                  value={filters.ageMin}
                  onChange={(e) => updateFilter("ageMin", Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Age max</label>
                <input
                  type="number"
                  min={filters.ageMin}
                  max={120}
                  value={filters.ageMax}
                  onChange={(e) => updateFilter("ageMax", Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={filters.registeredVotersOnly}
                  onChange={(e) => updateFilter("registeredVotersOnly", e.target.checked)}
                  className={siteCheckboxClass}
                />
                Registered voters only
              </label>
            </div>
          </section>
          <HorizontalBarChart rows={districtBreakdown} title="Filtered pool by district" maxBars={10} />
          <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Draw sample")}</h2>
            <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Sampling method</label>
                <SiteSelect
                  value={samplingMethod}
                  onChange={(value) => setSamplingMethod(value as SamplingMethod)}
                  options={mapStringOptions(SAMPLING_METHODS)}
                  className="mt-1.5"
                />
                {samplingMethod !== "Simple Random Sample" ? (
                  <p className="mt-1 text-xs text-amber-700">
                    Stratified, quota, and cluster methods use simple random draw in this portal build.
                  </p>
                ) : null}
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Sample size</label>
                <input
                  type="number"
                  min={1}
                  max={filteredPool.length || 1}
                  value={sampleSize}
                  onChange={(e) => setSampleSize(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  disabled={filteredPool.length === 0}
                  onClick={generateSample}
                  className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  Generate random sample
                </button>
                <button
                  type="button"
                  disabled={displayRows.length === 0}
                  onClick={downloadCsv}
                  className="inline-flex min-h-10 items-center rounded-xl border border-teal-200 bg-white dark:bg-zinc-900 px-4 text-sm font-semibold text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40 disabled:opacity-50"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {tab === "calculator" ? (
        <section className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("Sample size calculator")}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
            Uses the same finite population correction as the Streamlit MVP (Cochran formula with p = 0.5).
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Population size (N)</label>
              <input
                type="number"
                min={1}
                value={populationSize}
                onChange={(e) => setPopulationSize(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Margin of error (%)</label>
              <input
                type="number"
                min={1}
                max={20}
                step={0.5}
                value={marginError}
                onChange={(e) => setMarginError(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Confidence level</label>
              <SiteSelect
                value={confidenceLevel}
                onChange={(value) => setConfidenceLevel(value as "90%" | "95%" | "99%")}
                options={[
                  { value: "90%", label: "90%" },
                  { value: "95%", label: "95%" },
                  { value: "99%", label: "99%" },
                ]}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Expected response rate (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={responseRate}
                onChange={(e) => setResponseRate(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Required completes" value={requiredSample} />
            <MetricCard label="Contacts needed" value={contacts} hint={`Assuming ${responseRate}% response rate`} />
          </div>
          <button
            type="button"
            onClick={() => {
              setSampleSize(Math.min(requiredSample, filteredPool.length || requiredSample));
              setTab("filters");
            }}
            className="inline-flex min-h-10 items-center rounded-xl border border-teal-200 bg-teal-50 px-4 text-sm font-semibold text-teal-900 dark:text-teal-100 hover:bg-teal-100"
          >
            Apply {requiredSample} to sample size and return to filters
          </button>
        </section>
      ) : null}

      {tab === "filters" || tab === "sample" ? (
        <section className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">
                {tab === "sample" && generatedSample.length > 0
                  ? formatHeadingCase("Generated sample")
                  : formatHeadingCase("Filtered pool preview")}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                {tab === "sample" && generatedSample.length === 0
                  ? "Generate a random sample from the Filter pool tab."
                  : `${displayRows.length} rows · click headers to sort`}
              </p>
            </div>
            <button
              type="button"
              disabled={displayRows.length === 0}
              onClick={downloadCsv}
              className="inline-flex min-h-10 items-center rounded-xl border border-teal-200 bg-white dark:bg-zinc-900 px-4 text-sm font-semibold text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40 disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
                  {(
                    [
                      ["lastName", "Name"],
                      ["district", "District"],
                      ["constituency", "Constituency"],
                      ["sex", "Sex"],
                      ["age", "Age"],
                      ["verificationStatus", "Verification"],
                    ] as const
                  ).map(([key, label]) => (
                    <th key={key} className="px-3 py-3">
                      <button type="button" onClick={() => toggleSort(key)} className="font-semibold hover:text-teal-800 dark:text-teal-200">
                        {label}
                        {sortIndicator(key)}
                      </button>
                    </th>
                  ))}
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Phone</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                      No panelists match the current filters.
                    </td>
                  </tr>
                ) : (
                  tablePagination.paginatedRows.map((row) => (
                    <tr key={row.email} className="border-b border-zinc-50 hover:bg-teal-50/30 dark:border-zinc-800/80 dark:hover:bg-teal-950/30">
                      <td className="px-3 py-2.5 font-medium text-zinc-800 dark:text-zinc-200">
                        {row.firstName} {row.lastName}
                      </td>
                      <td className="px-3 py-2.5">{row.district || "—"}</td>
                      <td className="px-3 py-2.5">{row.constituency || "—"}</td>
                      <td className="px-3 py-2.5">{row.sex}</td>
                      <td className="px-3 py-2.5 tabular-nums">{row.age ?? "—"}</td>
                      <td className="px-3 py-2.5">{row.verificationStatus}</td>
                      <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{row.email}</td>
                      <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{row.phone || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {displayRows.length > 0 ? (
            <TablePagination
              page={tablePagination.page}
              pageSize={tablePagination.pageSize}
              totalPages={tablePagination.totalPages}
              totalRows={tablePagination.totalRows}
              onPageChange={tablePagination.setPage}
              onPageSizeChange={tablePagination.setPageSize}
            />
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  AGE_GROUP_ORDER,
  DonutBreakdown,
  HorizontalBarChart,
  SortableAnalyticsTable,
} from "@/components/admin/analytics/AnalyticsCharts";
import { FilterMultiSelect } from "@/components/admin/shared/AdminUi";
import {
  applyAnalyticsFilters,
  buildAdvancedAnalyticsSnapshot,
  EMPTY_ANALYTICS_FILTERS,
  type AnalyticsFilters,
  type AnalyticsPanelistSlice,
} from "@/lib/admin-analytics";
import { formatHeadingCase } from "@/lib/sentence-case";
import { siteCheckboxClass } from "@/lib/site-controls";

type AnalyticsTab = "overview" | "geography" | "demographics" | "interests";

function MetricCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-teal-950">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

const TABS: { id: AnalyticsTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "geography", label: "Geography" },
  { id: "demographics", label: "Demographics" },
  { id: "interests", label: "Interests" },
];

export function AdminAdvancedAnalyticsDashboard({ slices }: { slices: AnalyticsPanelistSlice[] }) {
  const [filters, setFilters] = useState<AnalyticsFilters>(EMPTY_ANALYTICS_FILTERS);
  const [tab, setTab] = useState<AnalyticsTab>("overview");

  const filtered = useMemo(() => applyAnalyticsFilters(slices, filters), [slices, filters]);
  const snapshot = useMemo(
    () => buildAdvancedAnalyticsSnapshot(filtered, slices),
    [filtered, slices]
  );

  const activeFilterCount =
    filters.districts.length +
    filters.constituencies.length +
    filters.verificationStatuses.length +
    filters.panelistStatuses.length +
    filters.voterStatuses.length +
    filters.sexes.length +
    (filters.registeredVotersOnly ? 1 : 0);

  const clearFilters = () => setFilters(EMPTY_ANALYTICS_FILTERS);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="border-l-4 border-teal-600 pl-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Panel intelligence</p>
        <h1 className="mt-1 text-2xl font-bold text-teal-950 sm:text-3xl">
          {formatHeadingCase("Advanced analytics")}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600">
          Live breakdowns from the panel register — filter, sort, and chart coverage across geography,
          demographics, and research interests. Aligned with the Streamlit MVP Advanced Analytics module.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-teal-950">{formatHeadingCase("Filters")}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Showing <strong>{filtered.length}</strong> of <strong>{slices.length}</strong> panelists
              {activeFilterCount > 0 ? ` · ${activeFilterCount} filter(s) active` : ""}
            </p>
          </div>
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Clear all filters
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <FilterMultiSelect
            label="District"
            options={snapshot.filterOptions.districts}
            selected={filters.districts}
            onChange={(districts) => setFilters({ ...filters, districts })}
          />
          <FilterMultiSelect
            label="Constituency"
            options={snapshot.filterOptions.constituencies}
            selected={filters.constituencies}
            onChange={(constituencies) => setFilters({ ...filters, constituencies })}
          />
          <FilterMultiSelect
            label="Verification status"
            options={snapshot.filterOptions.verificationStatuses}
            selected={filters.verificationStatuses}
            onChange={(verificationStatuses) => setFilters({ ...filters, verificationStatuses })}
          />
          <FilterMultiSelect
            label="Panelist status"
            options={snapshot.filterOptions.panelistStatuses}
            selected={filters.panelistStatuses}
            onChange={(panelistStatuses) => setFilters({ ...filters, panelistStatuses })}
          />
          <FilterMultiSelect
            label="Voter status"
            options={snapshot.filterOptions.voterStatuses}
            selected={filters.voterStatuses}
            onChange={(voterStatuses) => setFilters({ ...filters, voterStatuses })}
          />
          <FilterMultiSelect
            label="Sex"
            options={snapshot.filterOptions.sexes}
            selected={filters.sexes}
            onChange={(sexes) => setFilters({ ...filters, sexes })}
          />
        </div>
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={filters.registeredVotersOnly}
            onChange={(e) => setFilters({ ...filters, registeredVotersOnly: e.target.checked })}
            className={siteCheckboxClass}
          />
          Registered voters only
        </label>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total panelists" value={snapshot.total} />
        <MetricCard label="Verified" value={snapshot.verified} />
        <MetricCard label="Pending" value={snapshot.pending} />
        <MetricCard label="Active" value={snapshot.active} />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
              tab === item.id
                ? "bg-teal-700 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-teal-900"
            }`}
          >
            {formatHeadingCase(item.label)}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <DonutBreakdown rows={snapshot.byVerification} title="Verification status" />
            <DonutBreakdown rows={snapshot.byPanelistStatus} title="Panelist status" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <HorizontalBarChart rows={snapshot.byDistrict} title="Panelists by district" />
            <HorizontalBarChart rows={snapshot.byConstituency} title="Panelists by constituency" maxBars={15} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <SortableAnalyticsTable rows={snapshot.byDistrict} title="District table" labelHeader="District" />
            <SortableAnalyticsTable
              rows={snapshot.byConstituency}
              title="Constituency table"
              labelHeader="Constituency"
            />
          </div>
        </div>
      ) : null}

      {tab === "geography" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard label="Registered voters" value={snapshot.registeredVoters} hint="In filtered set" />
            <MetricCard
              label="Constituencies represented"
              value={snapshot.byConstituency.length}
              hint="With at least one panelist"
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <HorizontalBarChart rows={snapshot.byDistrict} title="District coverage" />
            <HorizontalBarChart rows={snapshot.registeredVotersByConstituency} title="Registered voters by constituency" maxBars={15} />
          </div>
          <HorizontalBarChart
            rows={snapshot.registeredVotersByCtv}
            title="Registered voters by CTV / village area"
            maxBars={15}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <SortableAnalyticsTable rows={snapshot.registeredVotersByConstituency} title="Voters by constituency" labelHeader="Constituency" />
            <SortableAnalyticsTable rows={snapshot.registeredVotersByCtv} title="Voters by CTV area" labelHeader="CTV area" />
          </div>
        </div>
      ) : null}

      {tab === "demographics" ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <HorizontalBarChart rows={snapshot.byAgeGroup} title="Age groups" maxBars={7} />
            <HorizontalBarChart rows={snapshot.bySex} title="Sex" maxBars={6} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <HorizontalBarChart rows={snapshot.byEducation} title="Education level" />
            <HorizontalBarChart rows={snapshot.byEthnicity} title="Ethnicity" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <SortableAnalyticsTable
              rows={snapshot.byAgeGroup}
              title="Age group table"
              labelHeader="Age group"
              preserveLabelOrder={AGE_GROUP_ORDER}
            />
            <SortableAnalyticsTable rows={snapshot.bySex} title="Sex table" labelHeader="Sex" />
            <SortableAnalyticsTable rows={snapshot.byEducation} title="Education table" labelHeader="Education" />
            <SortableAnalyticsTable rows={snapshot.byEthnicity} title="Ethnicity table" labelHeader="Ethnicity" />
          </div>
        </div>
      ) : null}

      {tab === "interests" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Political profiles" value={snapshot.withPoliticalInterests} />
            <MetricCard label="Market profiles" value={snapshot.withMarketInterests} />
            <MetricCard label="Civic profiles" value={snapshot.withCivicInterests} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <HorizontalBarChart rows={snapshot.topPoliticalInterests} title="Top political interests" maxBars={10} />
            <HorizontalBarChart rows={snapshot.topMarketInterests} title="Top market interests" maxBars={10} />
            <HorizontalBarChart rows={snapshot.topCivicInterests} title="Top civic interests" maxBars={10} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <SortableAnalyticsTable rows={snapshot.topPoliticalInterests} title="Political interests" labelHeader="Interest" />
            <SortableAnalyticsTable rows={snapshot.topMarketInterests} title="Market interests" labelHeader="Interest" />
            <SortableAnalyticsTable rows={snapshot.topCivicInterests} title="Civic interests" labelHeader="Interest" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { DonutBreakdown, HorizontalBarChart } from "@/components/admin/analytics/AnalyticsCharts";
import { FilterMultiSelect, MetricCard, PageIntro } from "@/components/admin/shared/AdminUi";
import {
  buildSurveyAssignmentRows,
  buildSurveyDistributionStats,
  countEligibleForTarget,
  DELIVERY_METHODS,
  filterSurveyAssignments,
  REWARD_OPTIONS,
  sortSurveyAssignments,
  TARGET_GROUPS,
  type SurveyAssignmentRow,
  type TargetGroup,
} from "@/lib/admin-survey-distribution";
import type { PanelistRow } from "@/lib/panelists";
import type { PanelistSurveyRecord } from "@/lib/panelist-surveys-types";
import { formatAdminLabel, formatHeadingCase } from "@/lib/sentence-case";
import { siteCheckboxClass } from "@/lib/site-controls";
import { SiteSelect, mapStringOptions } from "@/components/shared/SiteSelect";

type Tab = "overview" | "assignments" | "planner";

type SortKey = keyof Pick<
  SurveyAssignmentRow,
  "title" | "panelistName" | "status" | "points" | "assignedDate" | "completeByDate" | "progressPercent"
>;

export function AdminSurveyDistributionDashboard({
  records,
  panelists,
}: {
  records: PanelistSurveyRecord[];
  panelists: PanelistRow[];
}) {
  const panelistsByEmail = useMemo(() => {
    const map = new Map<string, PanelistRow>();
    for (const row of panelists) {
      const email = row.email?.trim().toLowerCase();
      if (email) map.set(email, row);
    }
    return map;
  }, [panelists]);

  const allRows = useMemo(
    () => buildSurveyAssignmentRows(records, panelistsByEmail),
    [records, panelistsByEmail]
  );
  const stats = useMemo(() => buildSurveyDistributionStats(allRows), [allRows]);

  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [verificationStatuses, setVerificationStatuses] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("assignedDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [plannerTitle, setPlannerTitle] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<string>(DELIVERY_METHODS[0]);
  const [targetGroup, setTargetGroup] = useState<TargetGroup>("all_verified");
  const [constituency, setConstituency] = useState("");
  const [reward, setReward] = useState<string>(REWARD_OPTIONS[1]);
  const [reminderDays, setReminderDays] = useState("3");

  const filterOptions = useMemo(() => {
    const unique = (pick: (row: SurveyAssignmentRow) => string) =>
      [...new Set(allRows.map(pick).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      );
    return {
      categories: unique((row) => row.category),
      statuses: unique((row) => row.status),
      verificationStatuses: unique((row) => row.verificationStatus),
      districts: unique((row) => row.district),
    };
  }, [allRows]);

  const constituencyOptions = useMemo(
    () =>
      [...new Set(panelists.map((row) => row.constituency?.trim()).filter(Boolean))].sort((a, b) =>
        String(a).localeCompare(String(b), undefined, { sensitivity: "base" })
      ) as string[],
    [panelists]
  );

  const filteredRows = useMemo(() => {
    const filtered = filterSurveyAssignments(allRows, {
      search,
      categories,
      statuses,
      verificationStatuses,
      districts,
      overdueOnly,
    });
    return sortSurveyAssignments(filtered, sortKey, sortDirection);
  }, [allRows, search, categories, statuses, verificationStatuses, districts, overdueOnly, sortKey, sortDirection]);

  const eligibleCount = useMemo(
    () => countEligibleForTarget(panelists, targetGroup, constituency),
    [panelists, targetGroup, constituency]
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDirection(key === "title" || key === "panelistName" ? "asc" : "desc");
    }
  };

  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortDirection === "asc" ? " ↑" : " ↓") : "");

  const categoryChart = stats.byCategory.map((row) => ({
    label: row.label,
    count: row.count,
    percent: stats.totalAssignments ? Math.round((row.count / stats.totalAssignments) * 1000) / 10 : 0,
  }));
  const statusChart = stats.byStatus.map((row) => ({
    label: row.label.replace(/_/g, " "),
    count: row.count,
    percent: stats.totalAssignments ? Math.round((row.count / stats.totalAssignments) * 1000) / 10 : 0,
  }));

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "assignments", label: "Assignments" },
    { id: "planner", label: "Distribution planner" },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageIntro
        eyebrow="Survey operations"
        title={formatHeadingCase("Survey distribution")}
        description="Track live survey assignments across the panel, review delivery status, and preview target groups for the next distribution — aligned with the Streamlit MVP Survey Distribution module."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total assignments" value={stats.totalAssignments} />
        <MetricCard label="Unique surveys" value={stats.uniqueSurveys} />
        <MetricCard label="Panelists assigned" value={stats.uniquePanelists} />
        <MetricCard label="Overdue" value={stats.overdue} hint={`${stats.completed} completed · ${stats.inProgress} in progress`} />
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

      {tab === "overview" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <HorizontalBarChart rows={categoryChart} title="Assignments by category" />
          <DonutBreakdown rows={statusChart} title="Assignments by status" />
        </div>
      ) : null}

      {tab === "assignments" ? (
        <section className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Search</label>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Survey, panelist, district…"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
                className={siteCheckboxClass}
              />
              Overdue only
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FilterMultiSelect label="Category" options={filterOptions.categories} selected={categories} onChange={setCategories} />
            <FilterMultiSelect label="Status" options={filterOptions.statuses} selected={statuses} onChange={setStatuses} />
            <FilterMultiSelect
              label="Verification"
              options={filterOptions.verificationStatuses}
              selected={verificationStatuses}
              onChange={setVerificationStatuses}
            />
            <FilterMultiSelect label="District" options={filterOptions.districts} selected={districts} onChange={setDistricts} />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
            Showing <strong>{filteredRows.length}</strong> of <strong>{allRows.length}</strong> assignments
          </p>
          <div className="overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
                  {(
                    [
                      ["title", "Survey"],
                      ["panelistName", "Panelist"],
                      ["status", "Status"],
                      ["points", "Points"],
                      ["assignedDate", "Assigned"],
                      ["completeByDate", "Due"],
                      ["progressPercent", "Progress"],
                    ] as const
                  ).map(([key, label]) => (
                    <th key={key} className="px-3 py-3">
                      <button type="button" onClick={() => toggleSort(key)} className="font-semibold hover:text-teal-800 dark:text-teal-200">
                        {label}
                        {sortIndicator(key)}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
                      No assignments match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.recordId} className="border-b border-zinc-50 last:border-0 hover:bg-teal-50/30">
                      <td className="max-w-[14rem] px-3 py-2.5">
                        <p className="truncate font-medium text-zinc-800 dark:text-zinc-200" title={row.title}>
                          {row.title}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{formatAdminLabel(row.category)}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-zinc-800 dark:text-zinc-200">{row.panelistName}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{row.panelistEmail}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            row.overdue
                              ? "bg-red-100 text-red-800"
                              : row.status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-teal-100 text-teal-800 dark:text-teal-200"
                          }`}
                        >
                          {formatAdminLabel(row.overdue ? "overdue" : row.status.replace(/_/g, " "))}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{row.points}</td>
                      <td className="px-3 py-2.5 tabular-nums text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{row.assignedDate}</td>
                      <td className="px-3 py-2.5 tabular-nums text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">{row.completeByDate}</td>
                      <td className="px-3 py-2.5 tabular-nums">{row.progressPercent}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "planner" ? (
        <section className="space-y-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-base font-semibold text-teal-950 dark:text-teal-100">{formatHeadingCase("New distribution preview")}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
              Configure a distribution plan. Automated sending is not wired yet — this preview shows eligible
              panelists and MVP-aligned settings.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Survey title</label>
              <input
                type="text"
                value={plannerTitle}
                onChange={(e) => setPlannerTitle(e.target.value)}
                placeholder="e.g. Q2 consumer sentiment"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Delivery method</label>
              <SiteSelect
                value={deliveryMethod}
                onChange={setDeliveryMethod}
                options={mapStringOptions(DELIVERY_METHODS)}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Target group</label>
              <SiteSelect
                value={targetGroup}
                onChange={(value) => setTargetGroup(value as TargetGroup)}
                options={TARGET_GROUPS.map((group) => ({
                  value: group.id,
                  label: group.label,
                }))}
                className="mt-1.5"
              />
            </div>
            {targetGroup === "specific_constituency" ? (
              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Constituency</label>
                <SiteSelect
                  value={constituency}
                  onChange={setConstituency}
                  placeholder="Select constituency"
                  options={[
                    { value: "", label: "Select constituency" },
                    ...mapStringOptions(constituencyOptions.filter(Boolean)),
                  ]}
                  className="mt-1.5"
                />
              </div>
            ) : null}
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Reward</label>
              <SiteSelect
                value={reward}
                onChange={setReward}
                options={mapStringOptions(REWARD_OPTIONS)}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">Reminder (days before due)</label>
              <input
                type="number"
                min={0}
                max={14}
                value={reminderDays}
                onChange={(e) => setReminderDays(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="rounded-xl border border-teal-100 dark:border-teal-900/60 bg-teal-50/50 p-4">
            <p className="text-sm font-semibold text-teal-950 dark:text-teal-100">Eligible panelists: {eligibleCount}</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
              {plannerTitle.trim()
                ? `"${plannerTitle.trim()}" would reach ${eligibleCount} verified active panelists via ${deliveryMethod.toLowerCase()}.`
                : "Enter a survey title to preview the distribution summary."}
            </p>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
              Reward: {reward} · Reminder: {reminderDays} day(s) before due date
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}

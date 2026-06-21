"use client";

import {
  BellIcon,
  ShieldCheckIcon,
  StarIcon,
  UserCircleIcon,
} from "./DashboardIcons";
import { QuickLinkCard, StatCard } from "./DashboardShell";
import { DASHBOARD_QUICK_SECTIONS } from "./dashboard-sections";
import { ViewLayoutToggle, useViewLayout } from "@/components/shared/ViewLayoutToggle";
import { viewLayoutContainerClass, viewLayoutItemClass } from "@/lib/view-layout";

const QUICK_LINKS = DASHBOARD_QUICK_SECTIONS;

export function DashboardOverviewStats({
  verificationStatus,
  panelistStatus,
  totalPoints,
  totalPointsToDate,
  rewardsVerified,
  unreadCount,
}: {
  verificationStatus: string;
  panelistStatus: string;
  totalPoints: number;
  totalPointsToDate: number;
  rewardsVerified: boolean;
  unreadCount: number;
}) {
  const [layout, setLayout] = useViewLayout("dashboard-overview-stats");

  function verificationTone(status: string): "default" | "success" | "warning" {
    const normalized = status.toLowerCase();
    if (normalized === "verified") return "success";
    if (normalized.includes("pending") || normalized.includes("duplicate")) return "warning";
    return "default";
  }

  const stats = [
    {
      key: "verification",
      label: "Verification status",
      value: verificationStatus,
      hint: "Admin review of your registration",
      tone: verificationTone(verificationStatus) as "default" | "success" | "warning",
      icon: <ShieldCheckIcon className="h-5 w-5" />,
    },
    {
      key: "panel",
      label: "Panel status",
      value: panelistStatus,
      hint: "Participation eligibility",
      tone: "default" as const,
      icon: <UserCircleIcon className="h-5 w-5" />,
    },
    {
      key: "rewards",
      label: "Reward points",
      value: String(totalPoints),
      hint: `${totalPointsToDate} earned to date · ${totalPoints} available`,
      tone: rewardsVerified ? ("success" as const) : ("default" as const),
      icon: <StarIcon className="h-5 w-5" />,
    },
    {
      key: "notifications",
      label: "Unread notifications",
      value: String(unreadCount),
      hint: unreadCount === 1 ? "Update waiting for you" : "Updates waiting for you",
      tone: unreadCount > 0 ? ("warning" as const) : ("default" as const),
      icon: <BellIcon className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ViewLayoutToggle value={layout} onChange={setLayout} />
      </div>
      <div className={viewLayoutContainerClass(layout, "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3")}>
        {stats.map((stat) => (
          <div key={stat.key} className={viewLayoutItemClass(layout, "w-[min(72vw,14rem)]")}>
            <StatCard
              label={stat.label}
              value={stat.value}
              hint={stat.hint}
              tone={stat.tone}
              icon={stat.icon}
              layout={layout}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardOverviewQuickLinks() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {QUICK_LINKS.map((link) => {
        const Icon = link.icon;
        return (
          <QuickLinkCard
            key={link.href}
            href={link.href}
            label={link.label}
            description={link.description}
            icon={<Icon className="h-5 w-5" />}
            variant="stacked"
          />
        );
      })}
    </div>
  );
}

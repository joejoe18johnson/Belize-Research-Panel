import type { ComponentType } from "react";
import {
  BanknotesIcon,
  BellIcon,
  ClipboardIcon,
  GiftIcon,
  HomeIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "./DashboardIcons";

export type DashboardSectionIcon = ComponentType<{ className?: string }>;

export interface DashboardSectionMeta {
  href: string;
  label: string;
  description: string;
  shortLabel?: string;
  icon: DashboardSectionIcon;
  exact?: boolean;
}

export const DASHBOARD_OVERVIEW_SECTION: DashboardSectionMeta = {
  href: "/dashboard",
  label: "Home",
  description: "Dashboard summary and quick links",
  shortLabel: "Home",
  icon: HomeIcon,
  exact: true,
};

export const DASHBOARD_QUICK_SECTIONS: DashboardSectionMeta[] = [
  {
    href: "/dashboard/surveys",
    label: "Surveys",
    description: "Inbox and completed studies",
    shortLabel: "Surveys",
    icon: ClipboardIcon,
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    description: "Registration and contact details",
    shortLabel: "Profile",
    icon: UserCircleIcon,
  },
  {
    href: "/dashboard/verification",
    label: "Verification Center",
    description: "Phone, ID, and verification status",
    shortLabel: "Verification",
    icon: ShieldCheckIcon,
  },
  {
    href: "/dashboard/notifications",
    label: "Notifications",
    description: "Verification and survey updates",
    shortLabel: "Alerts",
    icon: BellIcon,
  },
  {
    href: "/dashboard/payouts",
    label: "Payouts",
    description: "Payout requests and payment history",
    shortLabel: "Payouts",
    icon: BanknotesIcon,
  },
  {
    href: "/dashboard/rewards",
    label: "Rewards",
    description: "Points and redemption info",
    shortLabel: "Rewards",
    icon: GiftIcon,
  },
];

export const DASHBOARD_NAV_SECTIONS: DashboardSectionMeta[] = [
  DASHBOARD_OVERVIEW_SECTION,
  ...DASHBOARD_QUICK_SECTIONS,
];

export function dashboardSectionByHref(href: string): DashboardSectionMeta | undefined {
  return DASHBOARD_NAV_SECTIONS.find((section) => section.href === href);
}

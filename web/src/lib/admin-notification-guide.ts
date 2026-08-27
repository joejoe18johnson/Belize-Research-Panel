import type { NotificationQueueRow } from "./admin-dashboard-metrics";

export type AdminAlertScope = "notifications" | "payouts" | "campaigns" | "under-review";

export interface AdminAlertScopeGuide {
  scope: AdminAlertScope;
  title: string;
  navLabel: string;
  href: string;
  description: string;
  markedReadWhen: string;
}

export interface NotificationQueueGuide {
  type: NotificationQueueRow["type"];
  whereShown: string;
  navBadge: string;
  markedReadWhen: string;
  filterHref?: string;
}

/** Cross-module admin alert scopes. Panelist verification is listed on Notifications and Under Review. */
export const ADMIN_ALERT_SCOPE_GUIDES: AdminAlertScopeGuide[] = [
  {
    scope: "notifications",
    title: "Contact & verification queue",
    navLabel: "Notifications",
    href: "/admin/notifications",
    description:
      "Pending email changes, phone/WhatsApp changes, signup emails awaiting confirmation, and panelists waiting for administrator verification.",
    markedReadWhen:
      "Open record (per row), Approve or Deny (contact changes), Release hold (duplicate review), or Mark all read on this page.",
  },
  {
    scope: "payouts",
    title: "Redemption requests",
    navLabel: "Payouts",
    href: "/admin/payouts",
    description: "New panelist payout and redemption requests awaiting staff processing.",
    markedReadWhen:
      "Process or review a pending row in the payout queue, or Mark all read on the Payouts page.",
  },
  {
    scope: "campaigns",
    title: "Completed fieldwork",
    navLabel: "Campaigns",
    href: "/admin/campaigns",
    description: "Campaigns whose assigned surveys are fully submitted, or campaigns explicitly closed.",
    markedReadWhen: "Open campaign results for that campaign (automatic), or Mark all read on Campaigns.",
  },
  {
    scope: "under-review",
    title: "Panelist verification",
    navLabel: "Under Review",
    href: "/admin/under-review?queue=pending",
    description: "New panelists whose identity, documents, or follow-up still need an administrator to verify.",
    markedReadWhen:
      "Open record from Notifications or Under Review, or Mark all read on either of those pages.",
  },
];

/** Rules for rows shown on the Notifications page queue. */
export const NOTIFICATION_QUEUE_GUIDES: NotificationQueueGuide[] = [
  {
    type: "Email change",
    whereShown: "Admin Console → Notifications (this page)",
    navBadge: "Notifications nav badge",
    markedReadWhen: "Approve, Deny, Open record, or Mark all read",
    filterHref: "/admin/notifications?type=email",
  },
  {
    type: "Phone change",
    whereShown: "Admin Console → Notifications (this page)",
    navBadge: "Notifications nav badge",
    markedReadWhen: "Approve, Deny, Open record, or Mark all read",
    filterHref: "/admin/notifications?type=phone",
  },
  {
    type: "Duplicate review",
    whereShown: "Admin Console → Notifications (this page) and Under Review",
    navBadge: "Notifications nav badge",
    markedReadWhen: "Release hold, Open record, or Mark all read",
    filterHref: "/admin/notifications?type=duplicate",
  },
  {
    type: "Email verification",
    whereShown: "Admin Console → Notifications (this page)",
    navBadge: "Notifications nav badge",
    markedReadWhen: "Open record or Mark all read",
    filterHref: "/admin/notifications?type=verification",
  },
  {
    type: "Panelist verification",
    whereShown: "Admin Console → Notifications and Under Review",
    navBadge: "Notifications and Under Review nav badges",
    markedReadWhen: "Open record or Mark all read on Notifications or Under Review",
    filterHref: "/admin/notifications?type=panelist",
  },
];

export function notificationQueueGuideFor(type: NotificationQueueRow["type"]): NotificationQueueGuide {
  return (
    NOTIFICATION_QUEUE_GUIDES.find((guide) => guide.type === type) ??
    NOTIFICATION_QUEUE_GUIDES[0]
  );
}

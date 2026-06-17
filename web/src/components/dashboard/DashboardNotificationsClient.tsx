"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatHeadingCase } from "@/lib/sentence-case";
import type { DashboardNotification } from "@/lib/panelist-dashboard";
import {
  brandedNotificationBadgeClass,
  brandedNotificationPriorityClass,
  brandedNotificationUnreadClass,
} from "@/lib/site-alerts";
import { BellIcon, ClipboardIcon, GiftIcon, ShieldCheckIcon } from "./DashboardIcons";
import { DashboardCard, DashboardInfoNote } from "./DashboardShell";
import { ViewLayoutToggle, useViewLayout } from "@/components/shared/ViewLayoutToggle";
import { viewLayoutContainerClass, viewLayoutItemClass } from "@/lib/view-layout";
import type { ViewLayout } from "@/lib/view-layout";
import { isSurveyInvitationNotificationId } from "@/lib/survey-notifications";

function notificationIcon(id: string) {
  if (isSurveyInvitationNotificationId(id)) {
    return <ClipboardIcon className="h-5 w-5" />;
  }
  if (id === "verification" || id === "welcome") {
    return <ShieldCheckIcon className="h-5 w-5" />;
  }
  if (id === "surveys") {
    return <ClipboardIcon className="h-5 w-5" />;
  }
  if (id === "rewards") {
    return <GiftIcon className="h-5 w-5" />;
  }
  return <BellIcon className="h-5 w-5" />;
}

function notificationIconTone(id: string, unread: boolean): string {
  if (!unread) return "bg-zinc-100 text-zinc-500";
  if (isSurveyInvitationNotificationId(id)) return "bg-amber-100 text-amber-700";
  if (id === "verification" || id === "welcome") return "bg-teal-100 text-teal-700";
  if (id === "surveys") return "bg-sky-100 text-sky-700";
  if (id === "rewards") return "bg-amber-100 text-amber-700";
  return "bg-teal-100 text-teal-700";
}

function NotificationCard({
  notification,
  layout,
  updatingId,
  onToggle,
}: {
  notification: DashboardNotification;
  layout: ViewLayout;
  updatingId: string | null;
  onToggle: (notification: DashboardNotification) => void;
}) {
  const action = (
    <button
      type="button"
      onClick={() => onToggle(notification)}
      disabled={updatingId === notification.id}
      className="inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-semibold text-teal-700 hover:bg-teal-50 hover:text-teal-900 disabled:opacity-60"
    >
      {updatingId === notification.id
        ? formatHeadingCase("Saving…")
        : notification.unread
          ? formatHeadingCase("Mark as read")
          : formatHeadingCase("Mark as unread")}
    </button>
  );

  if (layout === "list") {
    return (
      <DashboardCard className={`p-4 ${notification.unread ? brandedNotificationUnreadClass : ""}`}>
        <div className="flex items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${notificationIconTone(notification.id, notification.unread)}`}
          >
            {notificationIcon(notification.id)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900">{formatHeadingCase(notification.title)}</h3>
              {notification.unread ? <span className={brandedNotificationBadgeClass}>{formatHeadingCase("New")}</span> : null}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{formatHeadingCase(notification.body)}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-zinc-500">{notification.dateLabel}</p>
              {action}
            </div>
          </div>
        </div>
      </DashboardCard>
    );
  }

  if (layout === "horizontal") {
    return (
      <DashboardCard className={`flex h-full flex-col p-4 ${notification.unread ? brandedNotificationUnreadClass : ""}`}>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${notificationIconTone(notification.id, notification.unread)}`}
        >
          {notificationIcon(notification.id)}
        </span>
        <h3 className="mt-3 line-clamp-2 text-sm font-semibold text-zinc-900">{formatHeadingCase(notification.title)}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-zinc-600">
          {formatHeadingCase(notification.body)}
        </p>
        <p className="mt-3 text-xs text-zinc-500">{notification.dateLabel}</p>
        <div className="mt-2">{action}</div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard className={notification.unread ? brandedNotificationUnreadClass : ""}>
      <div className="flex gap-4">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${notificationIconTone(notification.id, notification.unread)}`}
        >
          {notificationIcon(notification.id)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-900">{formatHeadingCase(notification.title)}</h3>
                {notification.unread ? (
                  <span className={brandedNotificationBadgeClass}>
                    {formatHeadingCase("New")}
                  </span>
                ) : null}
                {notification.priority === "high" && notification.unread ? (
                  <span className={brandedNotificationPriorityClass}>
                    {formatHeadingCase("Important")}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {formatHeadingCase(notification.body)}
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-row items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-end">
              <p className="text-xs text-zinc-500">{notification.dateLabel}</p>
              {action}
            </div>
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}

export function DashboardNotificationsClient({
  initialNotifications,
}: {
  initialNotifications: DashboardNotification[];
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [layout, setLayout] = useViewLayout("dashboard-notifications");

  const unreadCount = notifications.filter((notification) => notification.unread).length;

  const updateReadState = async (payload: { notificationId?: string; read?: boolean; markAllRead?: boolean }) => {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      notifications?: DashboardNotification[];
      message?: string;
    };

    if (!res.ok || !data.notifications) {
      throw new Error(data.message ?? "Could not update notification.");
    }

    setNotifications(data.notifications);
    router.refresh();
  };

  const toggleNotification = async (notification: DashboardNotification) => {
    setUpdatingId(notification.id);
    try {
      await updateReadState({
        notificationId: notification.id,
        read: notification.unread ? true : false,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await updateReadState({ markAllRead: true });
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600">
          {unreadCount > 0 ? (
            <>
              {formatHeadingCase("You have")}{" "}
              <span className="font-semibold text-zinc-900">{unreadCount}</span>{" "}
              {formatHeadingCase(unreadCount === 1 ? "unread notification." : "unread notifications.")}
            </>
          ) : (
            formatHeadingCase("All caught up — no unread notifications.")
          )}
        </p>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={markAllRead}
            disabled={markingAll}
            className="flex min-h-11 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-60 sm:w-auto"
          >
            {markingAll ? formatHeadingCase("Updating…") : formatHeadingCase("Mark all as read")}
          </button>
        ) : null}
      </div>

      <div className="flex justify-end">
        <ViewLayoutToggle value={layout} onChange={setLayout} />
      </div>

      <div className={viewLayoutContainerClass(layout, "space-y-3")}>
        {notifications.map((notification) => (
          <div key={notification.id} className={viewLayoutItemClass(layout, "w-[min(88vw,16rem)]")}>
            <NotificationCard
              notification={notification}
              layout={layout}
              updatingId={updatingId}
              onToggle={toggleNotification}
            />
          </div>
        ))}
      </div>

      <DashboardInfoNote>
        {formatHeadingCase(
          "Read and unread status is saved to your account. Automated delivery tracking and survey alerts will expand in a future release."
        )}
      </DashboardInfoNote>
    </div>
  );
}

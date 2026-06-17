import Link from "next/link";
import { BellIcon } from "./DashboardIcons";

export function NotificationBellLink({ unreadCount }: { unreadCount: number }) {
  const label =
    unreadCount === 0
      ? "Notifications — no unread"
      : unreadCount === 1
        ? "Notifications — 1 unread"
        : `Notifications — ${unreadCount} unread`;

  return (
    <Link
      href="/dashboard/notifications"
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-600 dark:text-zinc-400 dark:text-zinc-500 transition hover:bg-zinc-100 dark:bg-zinc-800 hover:text-teal-800 dark:text-teal-200"
      aria-label={label}
      title={label}
    >
      <BellIcon className="h-5 w-5" />
      {unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-teal-700 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}

import Link from "next/link";
import type { AccountStatus } from "@/lib/auth-types";
import type {
  DashboardNotification,
  DashboardRewardSummary,
  PanelistDashboardProfile,
} from "@/lib/panelist-dashboard";
import type { PanelistSurvey } from "@/lib/panelist-surveys-types";
import { isSurveyOverdue } from "@/lib/panelist-surveys-types";
import {
  BellIcon,
  ChevronRightIcon,
  ClipboardIcon,
  ShieldCheckIcon,
  StarIcon,
  UserCircleIcon,
} from "./DashboardIcons";
import {
  DashboardAlert,
  DashboardCard,
  QuickLinkCard,
  SectionHeading,
  StatCard,
} from "./DashboardShell";
import { UserAvatar } from "./UserAvatar";
import { isAccountApproved, VerifiedCheckBadge, VerifiedStatusPill } from "./VerifiedCheckBadge";
import { formatHeadingCase } from "@/lib/sentence-case";

function verificationTone(status: string): "default" | "success" | "warning" {
  const normalized = status.toLowerCase();
  if (normalized === "verified") return "success";
  if (normalized.includes("pending") || normalized.includes("duplicate")) return "warning";
  return "default";
}

const QUICK_LINKS = [
  { href: "/dashboard/surveys", label: "Surveys", description: "Inbox and completed studies" },
  { href: "/dashboard/profile", label: "Profile", description: "Registration and contact details" },
  { href: "/dashboard/verification", label: "Verification Center", description: "Phone, ID, and verification status" },
  { href: "/dashboard/notifications", label: "Notifications", description: "Verification and survey updates" },
  { href: "/dashboard/rewards", label: "Rewards", description: "Points and redemption info" },
] as const;

function SurveyPreviewRow({ survey }: { survey: PanelistSurvey }) {
  const overdue = isSurveyOverdue(survey);
  const inProgress = survey.status === "in_progress";
  const href = survey.surveyUrl ?? "/dashboard/surveys";

  return (
    <a
      href={href}
      target={survey.surveyUrl ? "_blank" : undefined}
      rel={survey.surveyUrl ? "noopener noreferrer" : undefined}
      className="group flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 transition hover:border-teal-200 hover:bg-teal-50/40"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900 group-hover:text-teal-900">{survey.title}</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {inProgress
            ? formatHeadingCase(`${survey.progressPercent}% complete`)
            : formatHeadingCase("Not started")}
          {" · "}
          <span className={overdue ? "font-medium text-red-600" : ""}>
            {formatHeadingCase("Due")} {survey.completeByDateLabel}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-800">
          +{survey.points} pts
        </span>
        <ChevronRightIcon className="h-4 w-4 text-zinc-400 transition group-hover:text-teal-700" />
      </div>
    </a>
  );
}

export function DashboardOverviewSection({
  profile,
  rewards,
  notifications,
  inboxSurveys,
  accountStatus = "active",
  welcome,
}: {
  profile: PanelistDashboardProfile;
  rewards: DashboardRewardSummary;
  notifications: DashboardNotification[];
  inboxSurveys: PanelistSurvey[];
  accountStatus?: AccountStatus;
  welcome?: boolean;
}) {
  const unreadCount = notifications.filter((notification) => notification.unread).length;
  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Panelist";
  const approved = isAccountApproved(profile.verificationStatus, accountStatus);

  return (
    <div className="space-y-6">
      {welcome ? (
        <DashboardAlert title="Registration complete">
          {formatHeadingCase(
            "Your panelist profile has been submitted. Use the tabs above to view your profile, notifications, and rewards."
          )}
        </DashboardAlert>
      ) : null}

      <DashboardCard className="overflow-hidden border-teal-200 bg-gradient-to-br from-teal-700 via-teal-800 to-teal-950 p-0 text-white">
        <div className="relative overflow-hidden rounded-t-2xl p-5 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_55%)]" />
          <div className="relative flex flex-col gap-4">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <UserAvatar firstName={profile.firstName} email={profile.email} size="lg" />
                {approved ? (
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <VerifiedCheckBadge size="sm" title="Verified panelist account" tone="light" />
                  </span>
                ) : null}
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="text-sm font-medium text-teal-100">{formatHeadingCase("Welcome back")}</p>
                  <h2 className="mt-1 flex flex-wrap items-center gap-2 text-xl font-bold leading-snug tracking-tight sm:text-2xl lg:text-3xl">
                    <span>{displayName}</span>
                    {approved ? (
                      <VerifiedCheckBadge size="md" title="Verified panelist account" tone="light" />
                    ) : null}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {approved ? (
                    <VerifiedStatusPill />
                  ) : (
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                      {profile.verificationStatus}
                    </span>
                  )}
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                    {profile.panelistStatus}
                  </span>
                </div>
              </div>
            </div>
            <p className="w-full text-sm leading-relaxed text-teal-100/90 sm:max-w-2xl">
              {formatHeadingCase(
                "Survey invitations matched to your interests will appear in your inbox when studies open."
              )}
            </p>
          </div>
        </div>
      </DashboardCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Verification status"
          value={profile.verificationStatus}
          hint="Admin review of your registration"
          tone={verificationTone(profile.verificationStatus)}
          icon={<ShieldCheckIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Panel status"
          value={profile.panelistStatus}
          hint="Participation eligibility"
          icon={<UserCircleIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Reward points"
          value={String(rewards.totalPoints)}
          hint={`${rewards.totalPointsToDate} earned to date · ${rewards.totalPoints} available`}
          tone={rewards.verified ? "success" : "default"}
          icon={<StarIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Unread notifications"
          value={String(unreadCount)}
          hint={unreadCount === 1 ? "Update waiting for you" : "Updates waiting for you"}
          tone={unreadCount > 0 ? "warning" : "default"}
          icon={<BellIcon className="h-5 w-5" />}
        />
      </div>

      {inboxSurveys.length > 0 ? (
        <DashboardCard>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <ClipboardIcon className="h-4 w-4" />
              </span>
              <div>
                <SectionHeading as="h3">Active surveys</SectionHeading>
                <p className="text-xs text-zinc-500">{inboxSurveys.length} waiting in your inbox</p>
              </div>
            </div>
            <Link
              href="/dashboard/surveys"
              className="text-sm font-semibold text-teal-700 hover:text-teal-900"
            >
              {formatHeadingCase("View all")}
            </Link>
          </div>
          <div className="space-y-2">
            {inboxSurveys.slice(0, 3).map((survey) => (
              <SurveyPreviewRow key={survey.id} survey={survey} />
            ))}
          </div>
        </DashboardCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map((link) => (
          <QuickLinkCard key={link.href} {...link} />
        ))}
      </div>
    </div>
  );
}

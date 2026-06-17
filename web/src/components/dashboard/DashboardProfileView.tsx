import type { SessionAccount } from "@/lib/auth-types";
import type { PanelistDashboardProfile } from "@/lib/panelist-dashboard";
import type { ProfileContactDisplay } from "@/lib/profile-update-types";
import {
  DashboardAlert,
  DashboardCard,
  InterestList,
  ProfileField,
  StatusBadge,
} from "./DashboardShell";
import type { ProfileEditSection } from "./ProfileEditForm";
import { ProfileContactChangePanel } from "./ProfileContactChangePanel";
import { DeleteAccountPanel } from "@/components/account/DeleteAccountPanel";
import { formatHeadingCase } from "@/lib/sentence-case";

function verificationBadgeTone(status: string): "success" | "warning" | "default" {
  const normalized = status.toLowerCase();
  if (normalized === "verified") return "success";
  if (normalized.includes("pending") || normalized.includes("duplicate")) return "warning";
  return "default";
}

function ProfileCardHeader({
  title,
  onEdit,
  editLabel = "Edit",
}: {
  title: string;
  onEdit: () => void;
  editLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
      <h3 className="min-w-0 flex-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">{formatHeadingCase(title)}</h3>
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-900 dark:text-teal-100"
      >
        {formatHeadingCase(editLabel)}
      </button>
    </div>
  );
}

export function DashboardProfileView({
  profile,
  account,
  contact,
  onEdit,
  onEditSection,
  savedMessage,
  emailUpdated,
  onDismissSaved,
}: {
  profile: PanelistDashboardProfile;
  account: SessionAccount;
  contact: ProfileContactDisplay;
  onEdit: () => void;
  onEditSection: (section: ProfileEditSection) => void;
  savedMessage?: boolean;
  emailUpdated?: boolean;
  onDismissSaved?: () => void;
}) {
  const residenceSummary =
    profile.placeOfResidence === "Living abroad"
      ? [profile.countryIfAbroad, profile.cityTownVillage].filter(Boolean).join(", ")
      : [profile.district, profile.cityTownVillage].filter(Boolean).join(" · ");

  return (
    <div className="space-y-6">
      {emailUpdated ? (
        <DashboardAlert title="Email updated" tone="success">
          Your email address has been verified and updated. Your account is active again if no other changes are pending.
        </DashboardAlert>
      ) : null}

      {account.accountStatus === "on_hold" ? (
        <DashboardAlert tone="info" title="Account on hold">
          Your account is on hold while contact changes are verified.{" "}
          <a href="/dashboard/account-on-hold" className="font-semibold underline">
            View hold status
          </a>
        </DashboardAlert>
      ) : null}

      {savedMessage ? (
        <DashboardAlert title="Profile updated" tone="success">
          Your changes have been saved.
          {onDismissSaved ? (
            <>
              {" "}
              <button type="button" className="font-semibold underline" onClick={onDismissSaved}>
                Dismiss
              </button>
            </>
          ) : null}
        </DashboardAlert>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={profile.verificationStatus} tone={verificationBadgeTone(profile.verificationStatus)} />
          <StatusBadge label={profile.panelistStatus} tone="info" />
          {profile.registrationDate !== "Not provided" ? (
            <span className="text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">Registered {profile.registrationDate}</span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 sm:w-auto"
        >
          Edit profile
        </button>
      </div>

      <ProfileContactChangePanel contact={contact} account={account} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard>
          <ProfileCardHeader title="Personal details" onEdit={() => onEditSection("personal")} />
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
            Name, date of birth, sex, and ethnicity cannot be changed online. Education can be updated when you edit
            your profile.
          </p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <ProfileField label="First name" value={profile.firstName} />
            <ProfileField label="Last name(s)" value={profile.lastName} />
            <ProfileField label="Date of birth" value={profile.dob} />
            <ProfileField label="Age" value={profile.age} />
            <ProfileField label="Sex" value={profile.sex} />
            <ProfileField label="Education" value={profile.education} />
            <ProfileField label="Ethnicity" value={profile.ethnicity} />
          </dl>
        </DashboardCard>

        <DashboardCard>
          <ProfileCardHeader
            title="Citizenship and residence"
            onEdit={() => onEditSection("citizenship")}
          />
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <ProfileField label="Citizenship / residency status" value={profile.citizenshipStatus} />
            {profile.commonwealthCountry ? (
              <ProfileField label="Commonwealth country of citizenship" value={profile.commonwealthCountry} />
            ) : null}
            <ProfileField label="Registered to vote in Belize" value={profile.votingStatus} />
            <ProfileField label="Voter status" value={profile.voterStatus} />
            <ProfileField label="Where you currently live" value={profile.placeOfResidence} />
            {residenceSummary ? (
              <ProfileField label="Location details" value={residenceSummary} />
            ) : null}
            {profile.constituency ? (
              <ProfileField label="Constituency registered to vote" value={profile.constituency} />
            ) : null}
            {profile.registeredCtvArea ? (
              <ProfileField label="Registered CTV area" value={profile.registeredCtvArea} />
            ) : null}
          </dl>
        </DashboardCard>

        <DashboardCard>
          <ProfileCardHeader title="Contact details" onEdit={() => onEditSection("contact")} />
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <ProfileField label="Email address" value={profile.email} />
            <ProfileField label="Phone / WhatsApp" value={profile.phone} />
            <ProfileField label="Facebook" value={profile.facebook} />
            <ProfileField label="Instagram" value={profile.instagram} />
            <ProfileField label="TikTok" value={profile.tiktok} />
            {profile.otherContact ? (
              <ProfileField
                label={profile.otherContactPlatform || "Other contact"}
                value={profile.otherContact}
              />
            ) : null}
          </dl>
        </DashboardCard>

        <DashboardCard>
          <ProfileCardHeader title="Research interests" onEdit={() => onEditSection("interests")} />
          <div className="mt-4 space-y-5">
            <InterestList title="Political / election polls" items={profile.politicalInterests} />
            <InterestList title="Market research" items={profile.marketInterests} />
            <InterestList title="Civic / public / social issues" items={profile.civicInterests} />
          </div>
        </DashboardCard>
      </div>

      <DeleteAccountPanel />
    </div>
  );
}

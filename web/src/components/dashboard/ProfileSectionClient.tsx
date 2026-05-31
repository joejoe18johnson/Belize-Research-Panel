"use client";

import { useState } from "react";
import type { SessionAccount } from "@/lib/auth-types";
import type { PanelistDashboardProfile } from "@/lib/panelist-dashboard";
import type { ProfileContactDisplay, ProfileUpdateFormData } from "@/lib/profile-update-types";
import { formatHeadingCase } from "@/lib/sentence-case";
import { DashboardAlert } from "./DashboardShell";
import { DashboardProfileView } from "./DashboardProfileView";
import { ProfileEditForm, type ProfileEditSection } from "./ProfileEditForm";

export function ProfileSectionClient({
  profile,
  account,
  contact,
  initialForm,
  emailUpdated,
}: {
  profile: PanelistDashboardProfile;
  account: SessionAccount;
  contact: ProfileContactDisplay;
  initialForm: ProfileUpdateFormData;
  emailUpdated?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editSection, setEditSection] = useState<ProfileEditSection | undefined>();
  const [savedMessage, setSavedMessage] = useState(false);

  const startEdit = (section?: ProfileEditSection) => {
    setSavedMessage(false);
    setEditSection(section);
    setEditing(true);
  };

  if (editing) {
    return (
      <>
        {account.accountStatus === "on_hold" ? (
          <DashboardAlert tone="info" title="Account on hold">
            Profile fields other than email and phone cannot be saved while your account is on hold.
          </DashboardAlert>
        ) : null}
        <ProfileEditForm
          profile={profile}
          account={account}
          contact={contact}
          initialForm={initialForm}
          focusSection={editSection}
          onCancel={() => {
            setEditing(false);
            setEditSection(undefined);
          }}
          onSaved={() => {
            setEditing(false);
            setEditSection(undefined);
            setSavedMessage(true);
          }}
        />
      </>
    );
  }

  return (
    <DashboardProfileView
      profile={profile}
      account={account}
      contact={contact}
      savedMessage={savedMessage}
      emailUpdated={emailUpdated}
      onDismissSaved={() => setSavedMessage(false)}
      onEdit={() => startEdit()}
      onEditSection={startEdit}
    />
  );
}

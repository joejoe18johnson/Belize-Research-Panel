import type { SessionAccount } from "./auth-types";
import type { PanelistRow } from "./panelists";
import { panelistHasUpload } from "./panelists";
import { formatHeadingCase } from "./sentence-case";
import { parseAuthorisedRegistration } from "./authorised-registrars";
import { isCommonwealthCitizenInBelize } from "./constants";
import { assessPanelistRequirements, type RequirementApprovalStatus } from "./panelist-requirements";
import { cleanText } from "./validation";
import { loadNotificationReadState } from "./notification-state";
import { ID_DOCUMENT_DELETED_NOTICE, PHOTO_ID_PURGED_MARKER } from "./purge-verified-photo-id";

export type VerificationItemStatus = "verified" | "under_review" | "pending_approval" | "missing" | "denied";

export interface VerificationItem {
  id: "email" | "phone" | "photo_id" | "proof_of_residence";
  label: string;
  description: string;
  valueOnFile: string;
  valueLabel?: string;
  status: VerificationItemStatus;
  statusLabel: string;
  essential: boolean;
}

export interface VerificationCenterSummary {
  overallStatus: string;
  isVerified: boolean;
  idDocumentDeleted: boolean;
  items: VerificationItem[];
  registrationDate: string;
}

function statusLabel(status: VerificationItemStatus): string {
  switch (status) {
    case "verified":
      return formatHeadingCase("Verified");
    case "under_review":
      return formatHeadingCase("Under review");
    case "pending_approval":
      return formatHeadingCase("Pending approval");
    case "missing":
      return formatHeadingCase("Action required");
    case "denied":
      return formatHeadingCase("Denied");
    default:
      return formatHeadingCase("Unknown");
  }
}

function requirementItemStatus(status: RequirementApprovalStatus): VerificationItemStatus {
  switch (status) {
    case "approved":
      return "verified";
    case "denied":
      return "denied";
    case "missing":
      return "missing";
    default:
      return "under_review";
  }
}

function itemStatusWhenAccountPending(
  hasOnFile: boolean,
  pendingApproval = false
): VerificationItemStatus {
  if (pendingApproval) return "pending_approval";
  if (hasOnFile) return "under_review";
  return "missing";
}

export async function buildVerificationCenterSummary(
  panelist: PanelistRow,
  account: SessionAccount
): Promise<VerificationCenterSummary> {
  const overallStatus = formatHeadingCase(cleanText(panelist.verification_status) || "Pending");
  const isVerified = overallStatus.toLowerCase() === "verified";
  const username = cleanText(panelist.username);
  const phone = cleanText(panelist.phone_whatsapp);
  const photoIdType = cleanText(panelist.photo_id_type);
  const isCommonwealthInBelize = isCommonwealthCitizenInBelize(cleanText(panelist.citizenship_status));
  const authorisedRegistration = parseAuthorisedRegistration(panelist);

  const [hasPhotoUpload, hasResidenceUpload] = await Promise.all([
    panelistHasUpload(username, "photo-id"),
    panelistHasUpload(username, "residence-proof"),
  ]);

  const phonePending = Boolean(account.pendingPhone?.trim());
  const photoDeclared = Boolean(photoIdType);
  const photoOnFile = photoDeclared || authorisedRegistration.isAuthorised;
  const residenceOnFile = hasResidenceUpload;
  const requirements = assessPanelistRequirements(panelist, {
    emailVerified: account.emailVerified,
    pendingPhone: phonePending,
    hasPhotoUpload,
  });
  const phoneRequirement = requirements.items.find((item) => item.key === "phone");
  const photoRequirement = requirements.items.find((item) => item.key === "photo_id");
  const emailRequirement = requirements.items.find((item) => item.key === "email");

  const email = cleanText(account.email);
  const readState = email ? await loadNotificationReadState(email) : {};
  const idDocumentDeleted = Boolean(readState[PHOTO_ID_PURGED_MARKER]?.read);
  const items: VerificationItem[] = [
    {
      id: "email",
      label: formatHeadingCase("Email"),
      description: formatHeadingCase(
        "Your email address was confirmed before you could open this page. It is used to sign in and receive panel updates."
      ),
      valueOnFile: email || formatHeadingCase("Not provided"),
      status: emailRequirement ? requirementItemStatus(emailRequirement.status) : "verified",
      statusLabel: "",
      essential: true,
    },
    {
      id: "phone",
      label: formatHeadingCase("Phone number"),
      description: formatHeadingCase(
        "Your WhatsApp or mobile number is used to confirm identity and reach you for survey invitations."
      ),
      valueOnFile: phone || formatHeadingCase("Not provided"),
      status: phonePending
        ? "pending_approval"
        : phoneRequirement
          ? requirementItemStatus(phoneRequirement.status)
          : itemStatusWhenAccountPending(Boolean(phone), phonePending),
      statusLabel: "",
      essential: true,
    },
    {
      id: "photo_id",
      label: formatHeadingCase("Photo identification"),
      description: formatHeadingCase(
        "We use government-issued photo ID submitted during registration solely to confirm your identity and eligibility. We do not keep or store ID documents in our files."
      ),
      valueLabel: formatHeadingCase("Submitted"),
      valueOnFile: idDocumentDeleted
        ? ID_DOCUMENT_DELETED_NOTICE
        : photoOnFile
          ? authorisedRegistration.isAuthorised
            ? formatHeadingCase(
                authorisedRegistration.registrarName
                  ? `Authorised registration — ID checked in person by ${authorisedRegistration.registrarName} (code ${authorisedRegistration.code}). No ID file on record.`
                  : `Authorised registration — ID checked in person (code ${authorisedRegistration.code || "on file"}). No ID file on record.`
              )
            : hasPhotoUpload
              ? `${photoIdType} — ${formatHeadingCase("used for verification only; not stored in our files")}`
              : `${photoIdType} — ${formatHeadingCase("type declared; document not stored in our files")}`
          : formatHeadingCase("Not provided"),
      status: photoRequirement
        ? requirementItemStatus(photoRequirement.status)
        : itemStatusWhenAccountPending(photoOnFile),
      statusLabel: "",
      essential: true,
    },
  ];

  if (isCommonwealthInBelize) {
    items.push({
      id: "proof_of_residence",
      label: formatHeadingCase("Proof of Belize residence"),
      description: formatHeadingCase(
        "Required for Commonwealth citizens living in Belize to confirm current residency."
      ),
      valueOnFile: residenceOnFile
        ? formatHeadingCase("Document submitted with registration")
        : formatHeadingCase("Not provided"),
      status: isVerified ? "verified" : itemStatusWhenAccountPending(residenceOnFile),
      statusLabel: "",
      essential: true,
    });
  }

  return {
    overallStatus,
    isVerified,
    idDocumentDeleted,
    items: items.map((item) => ({ ...item, statusLabel: statusLabel(item.status) })),
    registrationDate: cleanText(panelist.registration_date) || formatHeadingCase("Recently submitted"),
  };
}

import type { SessionAccount } from "./auth-types";
import type { PanelistRow } from "./panelists";
import { panelistHasUpload } from "./panelists";
import { formatHeadingCase } from "./sentence-case";
import { isPanelistVerified } from "./verification-status";
import { cleanText } from "./validation";

export type VerificationItemStatus = "verified" | "under_review" | "pending_approval" | "missing";

export interface VerificationItem {
  id: "phone" | "photo_id" | "proof_of_residence";
  label: string;
  description: string;
  valueOnFile: string;
  status: VerificationItemStatus;
  statusLabel: string;
  essential: boolean;
}

export interface VerificationCenterSummary {
  overallStatus: string;
  isVerified: boolean;
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
    default:
      return formatHeadingCase("Unknown");
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
  const isCommonwealthInBelize =
    cleanText(panelist.citizenship_status) === "Citizen of a Commonwealth country living in Belize";
  const authorisedRegistration = cleanText(panelist.notes).toLowerCase().includes("authorised registration");

  const [hasPhotoUpload, hasResidenceUpload] = await Promise.all([
    panelistHasUpload(username, "photo-id"),
    panelistHasUpload(username, "residence-proof"),
  ]);

  const phonePending = Boolean(account.pendingPhone?.trim());
  const phoneOnFile = Boolean(phone);
  const photoDeclared = Boolean(photoIdType);
  const photoOnFile = photoDeclared || authorisedRegistration;
  const residenceOnFile = hasResidenceUpload;

  const items: VerificationItem[] = [
    {
      id: "phone",
      label: formatHeadingCase("Phone number"),
      description: formatHeadingCase(
        "Your WhatsApp or mobile number is used to confirm identity and reach you for survey invitations."
      ),
      valueOnFile: phone || formatHeadingCase("Not provided"),
      status: isVerified
        ? "verified"
        : itemStatusWhenAccountPending(phoneOnFile, phonePending),
      statusLabel: "",
      essential: true,
    },
    {
      id: "photo_id",
      label: formatHeadingCase("Photo identification"),
      description: formatHeadingCase(
        "Government-issued photo ID submitted during registration to confirm your identity and eligibility."
      ),
      valueOnFile: photoOnFile
        ? authorisedRegistration
          ? formatHeadingCase("Authorised registration — photo ID review in progress")
          : hasPhotoUpload
            ? `${photoIdType} — ${formatHeadingCase("document uploaded")}`
            : photoIdType
        : formatHeadingCase("Not provided"),
      status: isVerified ? "verified" : itemStatusWhenAccountPending(photoOnFile),
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
    items: items.map((item) => ({ ...item, statusLabel: statusLabel(item.status) })),
    registrationDate: cleanText(panelist.registration_date) || formatHeadingCase("Recently submitted"),
  };
}

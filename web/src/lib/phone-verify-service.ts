import "server-only";
import { revalidatePath } from "next/cache";
import {
  approveAccountPhoneChange,
  findAccountByEmail,
  getPendingPhoneForApproval,
} from "./accounts";
import { sendPhoneChangeApprovedEmail } from "./email/process-emails";
import {
  findPanelistByEmail,
  updatePanelistAdminFields,
  updatePanelistPhone,
  type PanelistRow,
} from "./panelists";
import { verificationStatusFromRequirementApprovals } from "./panelist-requirements";
import type { TwilioVerifyChannel } from "./twilio-verify";
import { emailNewlyVerifiedRequirements } from "./verification-notices";
import { cleanText } from "./validation";

export type PhoneVerifiedVia = "twilio_whatsapp" | "twilio_sms" | "admin";

function viaFromChannel(channel: TwilioVerifyChannel): PhoneVerifiedVia {
  return channel === "whatsapp" ? "twilio_whatsapp" : "twilio_sms";
}

/**
 * Mark the panelist's phone as verified after a successful Twilio OTP check.
 * Sets admin_phone_approved, stores phone_verified_via, updates verification_status,
 * and emails the panelist when the phone check newly becomes approved.
 */
export async function markPanelistPhoneVerifiedByTwilio(input: {
  email: string;
  channel: TwilioVerifyChannel;
  origin?: string;
}): Promise<{ panelist: PanelistRow | null; verificationStatus: string }> {
  const email = cleanText(input.email).toLowerCase();
  if (!email) return { panelist: null, verificationStatus: "" };

  const before = await findPanelistByEmail(email);
  if (!before) return { panelist: null, verificationStatus: "" };

  const via = viaFromChannel(input.channel);
  const nextStatus = verificationStatusFromRequirementApprovals(
    { ...before, admin_phone_approved: "true", phone_verified_via: via },
    { emailVerified: true }
  );

  await updatePanelistAdminFields(email, {
    admin_phone_approved: "true",
    phone_verified_via: via,
    verification_status: nextStatus,
  });

  const after = await findPanelistByEmail(email);
  if (after && input.origin) {
    const account = await findAccountByEmail(email);
    await emailNewlyVerifiedRequirements({
      to: email,
      firstName: account?.first_name || after.first_name || "",
      origin: input.origin,
      before,
      after,
      context: { emailVerified: true },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/verification");
  revalidatePath("/admin", "layout");

  return { panelist: after, verificationStatus: nextStatus };
}

/**
 * Apply a pending phone change after Twilio OTP, then mark the new number verified.
 */
export async function applyPendingPhoneChangeViaTwilio(input: {
  email: string;
  channel: TwilioVerifyChannel;
  origin: string;
}): Promise<{ ok: true; phone: string } | { ok: false; message: string }> {
  const email = cleanText(input.email).toLowerCase();
  const pendingPhone = await getPendingPhoneForApproval(email);
  if (!pendingPhone) {
    return { ok: false, message: "No pending phone change for this account." };
  }

  const updated = await updatePanelistPhone(email, pendingPhone);
  if (!updated) {
    return { ok: false, message: "Panelist record not found." };
  }

  const cleared = await approveAccountPhoneChange(email);
  if (!cleared) {
    return { ok: false, message: "Could not clear phone change request." };
  }

  await markPanelistPhoneVerifiedByTwilio({
    email,
    channel: input.channel,
    origin: input.origin,
  });

  const account = await findAccountByEmail(email);
  if (account) {
    void sendPhoneChangeApprovedEmail({
      to: email,
      firstName: account.first_name,
      newPhone: pendingPhone,
      origin: input.origin,
    });
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/account-on-hold");

  return { ok: true, phone: pendingPhone };
}

import { payoutShortId } from "./admin-payout-display";
import { sendPayoutStatusEmail } from "./email/process-emails";
import { markNotificationUnread } from "./notification-state";
import { logPanelistWhatsappOutreach } from "./panelist-outreach";
import { findPanelistByEmail } from "./panelists";
import type { PayoutProcessAction, RedemptionRequest } from "./reward-redemption";
import { formatBz } from "./reward-redemption";

export function redemptionNotificationId(requestId: string): string {
  return `redemption-${requestId}`;
}

export async function notifyPanelistOfPayoutUpdate(
  request: RedemptionRequest,
  action: PayoutProcessAction,
  origin: string
): Promise<void> {
  const email = request.email;
  const shortId = payoutShortId(request.id);
  const amount = formatBz(request.amountBz ?? request.points / 25);

  await markNotificationUnread(email, redemptionNotificationId(request.id));

  const panelist = await findPanelistByEmail(email);
  const firstName = panelist?.first_name ?? "";

  await sendPayoutStatusEmail({
    to: email,
    firstName,
    optionLabel: request.optionLabel,
    amount,
    referenceId: shortId,
    origin,
    action,
  });

  const whatsappBody =
    action === "start"
      ? `Your ${request.optionLabel} redemption (${amount}) is now being processed. Reference ${shortId}.`
      : action === "complete"
        ? `Your ${request.optionLabel} redemption of ${amount} has been completed. Reference ${shortId}.`
        : `Your ${request.optionLabel} redemption request (${shortId}) was not approved. Points remain in your balance.`;

  await logPanelistWhatsappOutreach({
    email,
    phone: panelist?.phone_whatsapp,
    body: `${whatsappBody}\n\nSign in to your Belize Research Panel dashboard for details.`,
    context: `payout-${action}`,
  });
}

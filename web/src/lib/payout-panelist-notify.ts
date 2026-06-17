import { payoutShortId } from "./admin-payout-display";
import { markNotificationUnread } from "./notification-state";
import { sendPanelistOutreach } from "./panelist-outreach";
import { findPanelistByEmail } from "./panelists";
import type { PayoutProcessAction, RedemptionRequest } from "./reward-redemption";
import { formatBz } from "./reward-redemption";

export function redemptionNotificationId(requestId: string): string {
  return `redemption-${requestId}`;
}

function payoutMessageForAction(
  request: RedemptionRequest,
  action: PayoutProcessAction
): { title: string; body: string } {
  const shortId = payoutShortId(request.id);
  const amount = formatBz(request.amountBz ?? request.points / 25);

  if (action === "start") {
    return {
      title: "Payout processing",
      body: `Your ${request.optionLabel} redemption (${amount}) is now being processed. Reference ${shortId}.`,
    };
  }

  if (action === "complete") {
    return {
      title: "Payout completed",
      body: `Your ${request.optionLabel} redemption of ${amount} has been completed. Reference ${shortId}.`,
    };
  }

  return {
    title: "Payout request declined",
    body: `Your ${request.optionLabel} redemption request (${shortId}) was not approved. Points remain in your balance.`,
  };
}

export async function notifyPanelistOfPayoutUpdate(
  request: RedemptionRequest,
  action: PayoutProcessAction
): Promise<void> {
  const email = request.email;
  const { title, body } = payoutMessageForAction(request, action);

  await markNotificationUnread(email, redemptionNotificationId(request.id));

  const panelist = await findPanelistByEmail(email);
  await sendPanelistOutreach({
    email,
    phone: panelist?.phone_whatsapp,
    subject: title,
    body: `${body}\n\nSign in to your Belize Research Panel dashboard for details.`,
    context: `payout-${action}`,
  });
}

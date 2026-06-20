import { formatPayoutPaymentDetails, payoutShortId } from "@/lib/admin-payout-display";
import { loadPanelists } from "@/lib/panelists";
import { findRedemptionRequestById } from "@/lib/redemption-requests";
import type { RedemptionRequest } from "@/lib/reward-redemption";
import { cleanText } from "@/lib/validation";
import { buildPayoutStatementPdf, payoutStatementPdfFilename } from "./payout-statement-pdf";

function panelistNameForEmail(email: string, panelists: Awaited<ReturnType<typeof loadPanelists>>): string {
  const normalized = cleanText(email).toLowerCase();
  const row = panelists.find((panelist) => cleanText(panelist.email).toLowerCase() === normalized);
  if (!row) return "Panelist";
  return `${cleanText(row.first_name)} ${cleanText(row.last_name)}`.trim() || "Panelist";
}

export async function resolvePayoutStatementPdf(
  requestId: string,
  options: { maskPaymentDetails?: boolean; audience?: "admin" | "panelist" } = {}
): Promise<{ bytes: Uint8Array; filename: string; request: RedemptionRequest; email: string } | null> {
  const located = await findRedemptionRequestById(requestId);
  if (!located) return null;

  const panelists = await loadPanelists();
  const payment = formatPayoutPaymentDetails(located.request.optionId, located.request.details, {
    maskSensitive: options.maskPaymentDetails ?? false,
  });

  const bytes = await buildPayoutStatementPdf({
    id: located.request.id,
    panelistName: panelistNameForEmail(located.email, panelists),
    email: located.email,
    optionLabel: located.request.optionLabel,
    amountBz: located.request.amountBz ?? located.request.points / 25,
    points: located.request.points,
    status: located.request.status,
    submittedAt: located.request.submittedAt,
    updatedAt: located.request.updatedAt,
    processedBy: located.request.processedBy,
    payment: { title: payment.title, fields: payment.fields },
    panelistNotes: located.request.notes,
    audience: options.audience ?? "admin",
  });

  return {
    bytes,
    filename: payoutStatementPdfFilename(payoutShortId(located.request.id)),
    request: located.request,
    email: located.email,
  };
}

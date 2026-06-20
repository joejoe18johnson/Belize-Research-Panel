import type { RedemptionRequest } from "@/lib/reward-redemption";
import { formatAdminPayoutDate, payoutShortId, payoutStatusLabel } from "@/lib/admin-payout-display";
import { formatBz } from "@/lib/reward-redemption";
import { BrandedPdfBuilder } from "./branded-pdf-builder";

export interface PayoutStatementPdfInput {
  id: string;
  panelistName: string;
  email: string;
  optionLabel: string;
  amountBz: number;
  points: number;
  status: RedemptionRequest["status"];
  submittedAt: string;
  updatedAt?: string;
  processedBy?: string;
  payment: { title: string; fields: Array<{ label: string; value: string }> };
  panelistNotes?: string;
  audience?: "admin" | "panelist";
}

function statusTone(status: RedemptionRequest["status"]): "success" | "warning" | "info" | "neutral" {
  if (status === "fulfilled") return "success";
  if (status === "approved") return "info";
  if (status === "pending") return "warning";
  return "neutral";
}

export async function buildPayoutStatementPdf(input: PayoutStatementPdfInput): Promise<Uint8Array> {
  const shortId = payoutShortId(input.id);
  const pdf = await BrandedPdfBuilder.create({
    documentTitle: "Redemption Statement",
    documentSubtitle: "Belize Research Panel rewards payout record",
    referenceId: shortId,
    generatedAt: new Date().toLocaleString("en-BZ", { dateStyle: "medium", timeStyle: "short" }),
    confidential: true,
  });

  pdf.addStatusBadge(payoutStatusLabel(input.status), statusTone(input.status));

  pdf.addHighlightCard(
    "Payout amount",
    formatBz(input.amountBz),
    `${input.points.toLocaleString()} points redeemed · ${input.optionLabel}`
  );

  pdf.addSectionTitle("Request summary");
  pdf.addKeyValueGrid([
    { label: "Request ID", value: shortId },
    { label: "Panelist", value: input.panelistName },
    { label: "Email", value: input.email },
    { label: "Redemption option", value: input.optionLabel },
    { label: "Points redeemed", value: input.points.toLocaleString() },
    { label: "Amount (BZD)", value: formatBz(input.amountBz) },
    { label: "Submitted", value: formatAdminPayoutDate(input.submittedAt) },
    { label: "Status", value: payoutStatusLabel(input.status) },
    ...(input.updatedAt ? [{ label: "Last updated", value: formatAdminPayoutDate(input.updatedAt) }] : []),
    ...(input.processedBy && input.audience === "admin"
      ? [{ label: "Processed by", value: input.processedBy }]
      : []),
  ]);

  pdf.addSectionTitle("Payment details");
  pdf.addParagraph(input.payment.title, { muted: false });
  if (input.payment.fields.length > 0) {
    pdf.addKeyValueGrid(input.payment.fields.map((field) => ({ label: field.label, value: field.value })));
  } else {
    pdf.addParagraph("No additional payment details on file.", { muted: true });
  }

  if (input.panelistNotes?.trim()) {
    pdf.addSectionTitle("Panelist notes");
    pdf.addParagraph(input.panelistNotes.trim());
  }

  pdf.addDivider();
  pdf.addParagraph(
    input.audience === "panelist"
      ? "This statement confirms your redemption request on the Belize Research Panel. Retain a copy for your records. If you have questions about this payout, contact the panel support team."
      : "This statement is generated from the Belize Research Panel admin payout queue. Payment details should be verified before processing. Do not share outside authorised finance and operations staff.",
    { muted: true, size: 9 }
  );

  return pdf.toBytes();
}

export function payoutStatementPdfFilename(shortId: string): string {
  return `brp-payout-statement-${shortId}.pdf`;
}

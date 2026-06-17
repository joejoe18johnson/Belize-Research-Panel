import type { RedemptionOptionId, RedemptionRequest } from "./reward-redemption";
import { formatBz, getRedemptionOption } from "./reward-redemption";
import { formatHeadingCase } from "./sentence-case";
import { cleanText } from "./validation";

const BANK_LABELS: Record<string, string> = {
  belize_bank: "Belize Bank",
  atlantic_bank: "Atlantic Bank",
  heritage_bank: "Heritage Bank",
  other: "Other",
};

const CARRIER_LABELS: Record<string, string> = {
  digicell: "DigiCell",
  smart: "Smart!",
};

const UTILITY_LABELS: Record<string, string> = {
  bel: "Belize Electricity Limited (BEL)",
  bws: "Belize Water Services (BWS)",
  belize_electricity: "Belize Electricity Limited (BEL)",
};

export function payoutShortId(id: string): string {
  const normalized = cleanText(id).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return normalized.slice(-6) || "—";
}

export function formatAdminPayoutDate(iso: string): string {
  const value = cleanText(iso);
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day} at ${time}`;
}

export function payoutStatusLabel(status: RedemptionRequest["status"]): string {
  switch (status) {
    case "pending":
      return "Pending review";
    case "approved":
      return "Approved";
    case "fulfilled":
      return "Completed";
    case "rejected":
      return "Rejected";
    default:
      return formatHeadingCase(status);
  }
}

export function maskAccountNumber(value: string): string {
  const digits = cleanText(value).replace(/\D/g, "");
  if (!digits) return "—";
  return `****${digits.slice(-4)}`;
}

export function formatPayoutPaymentDetails(
  optionId: RedemptionOptionId,
  details: Record<string, string>
): { title: string; lines: string[] } {
  const option = getRedemptionOption(optionId);

  if (optionId === "bank_transfer") {
    const bankName = BANK_LABELS[cleanText(details.bankName)] ?? (cleanText(details.bankName) || "Bank account");
    const holder = cleanText(details.accountHolderName) || "Account holder";
    const account = maskAccountNumber(details.accountNumber ?? "");
    return {
      title: bankName,
      lines: [holder, account].filter((line) => line && line !== "—"),
    };
  }

  if (optionId === "mobile_top_up") {
    const carrier = CARRIER_LABELS[cleanText(details.carrier)] ?? (cleanText(details.carrier) || "Mobile top-up");
    const phone = cleanText(details.phone) || "—";
    return {
      title: carrier,
      lines: phone !== "—" ? [phone] : [],
    };
  }

  if (optionId === "gift_card") {
    const retailer = cleanText(details.retailer) || "Gift card";
    const deliveryEmail = cleanText(details.deliveryEmail);
    return {
      title: retailer,
      lines: deliveryEmail ? [deliveryEmail] : [],
    };
  }

  if (optionId === "utility_credit") {
    const provider =
      UTILITY_LABELS[cleanText(details.utilityProvider)] ??
      UTILITY_LABELS[cleanText(details.provider)] ??
      (cleanText(details.utilityProvider) || "Utility account");
    const account = maskAccountNumber(details.accountNumber ?? "");
    const holder = cleanText(details.accountName);
    const address = cleanText(details.serviceAddress);
    return {
      title: provider,
      lines: [holder, account, address].filter((line) => line && line !== "—"),
    };
  }

  return {
    title: option?.label ?? "Redemption details",
    lines: Object.values(details)
      .map((value) => cleanText(value))
      .filter(Boolean),
  };
}

export function buildPayoutStatementText(input: {
  id: string;
  name: string;
  email: string;
  optionLabel: string;
  amountBz: number;
  points: number;
  status: RedemptionRequest["status"];
  submittedAt: string;
  payment: { title: string; lines: string[] };
}): string {
  return [
    "Belize Research Panel — Redemption Statement",
    "===========================================",
    "",
    `Request ID: ${payoutShortId(input.id)}`,
    `Panelist: ${input.name}`,
    `Email: ${input.email}`,
    `Option: ${input.optionLabel}`,
    `Amount: ${formatBz(input.amountBz)}`,
    `Points: ${input.points.toLocaleString()}`,
    `Status: ${payoutStatusLabel(input.status)}`,
    `Submitted: ${formatAdminPayoutDate(input.submittedAt)}`,
    "",
    "Payment details",
    "---------------",
    input.payment.title,
    ...input.payment.lines,
    "",
    "This statement is generated from the admin payout queue.",
  ].join("\n");
}

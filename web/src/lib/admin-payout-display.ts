import type { RedemptionRequest, StoredRedemptionOptionId } from "./reward-redemption";
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
      return "Processing";
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

function formatAccountNumber(value: string, maskSensitive: boolean): string {
  const raw = cleanText(value);
  if (!raw) return "—";
  return maskSensitive ? maskAccountNumber(raw) : raw;
}

export interface PayoutPaymentField {
  label: string;
  value: string;
}

export function formatPayoutPaymentDetails(
  optionId: StoredRedemptionOptionId,
  details: Record<string, string>,
  options: { maskSensitive?: boolean } = {}
): { title: string; lines: string[]; fields: PayoutPaymentField[] } {
  const maskSensitive = options.maskSensitive ?? false;
  const option = getRedemptionOption(optionId);

  if (optionId === "bank_transfer") {
    const bankName = BANK_LABELS[cleanText(details.bankName)] ?? (cleanText(details.bankName) || "Bank account");
    const holder = cleanText(details.accountHolderName) || "—";
    const account = formatAccountNumber(details.accountNumber ?? "", maskSensitive);
    const fields: PayoutPaymentField[] = [
      { label: "Account holder", value: holder },
      { label: "Account number", value: account },
    ];
    return {
      title: bankName,
      lines: fields.filter((field) => field.value !== "—").map((field) => `${field.label}: ${field.value}`),
      fields: fields.filter((field) => field.value !== "—"),
    };
  }

  if (optionId === "mobile_top_up") {
    const carrier = CARRIER_LABELS[cleanText(details.carrier)] ?? (cleanText(details.carrier) || "Mobile top-up");
    const phone = cleanText(details.phone) || "—";
    const fields: PayoutPaymentField[] = [{ label: "Mobile number", value: phone }];
    return {
      title: carrier,
      lines: phone !== "—" ? [`Mobile number: ${phone}`] : [],
      fields: phone !== "—" ? fields : [],
    };
  }

  if (optionId === "gift_card") {
    const retailer = cleanText(details.retailer) || "Gift card";
    const deliveryEmail = cleanText(details.deliveryEmail);
    const fields: PayoutPaymentField[] = deliveryEmail ? [{ label: "Delivery email", value: deliveryEmail }] : [];
    return {
      title: retailer,
      lines: deliveryEmail ? [`Delivery email: ${deliveryEmail}`] : [],
      fields,
    };
  }

  if (optionId === "utility_credit") {
    const provider =
      UTILITY_LABELS[cleanText(details.utilityProvider)] ??
      UTILITY_LABELS[cleanText(details.provider)] ??
      (cleanText(details.utilityProvider) || "Utility account");
    const account = formatAccountNumber(details.accountNumber ?? "", maskSensitive);
    const holder = cleanText(details.accountName);
    const address = cleanText(details.serviceAddress);
    const fields: PayoutPaymentField[] = [
      ...(holder ? [{ label: "Account holder", value: holder }] : []),
      ...(account !== "—" ? [{ label: "Utility account number", value: account }] : []),
      ...(address ? [{ label: "Service address", value: address }] : []),
    ];
    return {
      title: provider,
      lines: fields.map((field) => `${field.label}: ${field.value}`),
      fields,
    };
  }

  const fields = Object.entries(details)
    .map(([key, value]) => {
      const cleaned = cleanText(value);
      if (!cleaned) return null;
      return { label: formatHeadingCase(key.replace(/([A-Z])/g, " $1")), value: cleaned };
    })
    .filter((field): field is PayoutPaymentField => field !== null);

  return {
    title: option?.label ?? "Redemption details",
    lines: fields.map((field) => `${field.label}: ${field.value}`),
    fields,
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

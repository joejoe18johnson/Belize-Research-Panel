export type SupportTopicId =
  | "account-login"
  | "verification"
  | "surveys"
  | "rewards-payouts"
  | "profile-changes"
  | "privacy-data"
  | "other";

export interface SupportTopic {
  id: SupportTopicId;
  label: string;
}

export const SUPPORT_TOPICS: SupportTopic[] = [
  { id: "account-login", label: "Account & login" },
  { id: "verification", label: "Verification & documents" },
  { id: "surveys", label: "Surveys & invitations" },
  { id: "rewards-payouts", label: "Rewards & payouts" },
  { id: "profile-changes", label: "Email, phone, or profile changes" },
  { id: "privacy-data", label: "Privacy & data requests" },
  { id: "other", label: "Something else" },
];

export interface SupportFaqItem {
  question: string;
  answer: string;
}

export const SUPPORT_FAQ: SupportFaqItem[] = [
  {
    question: "How do I verify my email after signing up?",
    answer:
      "Check your inbox for a verification email after creating your account. You can also open the check-email page from the login screen if you still need to verify. Links expire after 24 hours — use forgot password or sign up again if needed.",
  },
  {
    question: "Why is my account on hold?",
    answer:
      "Accounts are placed on hold when you request an email or phone change, or while our team reviews verification documents. Sign in to view your status on the account on hold page. We email you when the review is complete.",
  },
  {
    question: "When will my payout be processed?",
    answer:
      "Redemption requests are typically processed within 5–7 business days. Track status under Dashboard → Payouts. You will receive email updates when processing starts and when your payout is completed.",
  },
  {
    question: "How do I change my email or phone number?",
    answer:
      "Go to Dashboard → Profile and submit a change request. Your account will be on hold until an administrator approves the update. This helps protect your account from unauthorised changes.",
  },
  {
    question: "How do I delete my account?",
    answer:
      "Signed-in panelists can delete their account from the delete account page linked in the site footer. You will need your password and must confirm that you want to opt out.",
  },
  {
    question: "How do I exercise my privacy rights?",
    answer:
      "Email privacy@belizepanel.test for access, correction, or erasure requests. You can also use the contact form below and choose “Privacy & data requests”. We may verify your identity before responding.",
  },
];

const DEFAULT_SUPPORT_INBOX = "support@belizepanel.test";
const DEFAULT_PRIVACY_INBOX = "privacy@belizepanel.test";

export function getSupportInboxEmail(): string {
  return (
    process.env.SUPPORT_INBOX_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    DEFAULT_SUPPORT_INBOX
  );
}

export function getPrivacyContactEmail(): string {
  return process.env.PRIVACY_CONTACT_EMAIL?.trim() || DEFAULT_PRIVACY_INBOX;
}

export function getSupportTopicLabel(topicId: string): string {
  return SUPPORT_TOPICS.find((topic) => topic.id === topicId)?.label ?? "General enquiry";
}

export function isSupportTopicId(value: string): value is SupportTopicId {
  return SUPPORT_TOPICS.some((topic) => topic.id === value);
}

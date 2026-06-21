import { HelpContactClient } from "@/components/help/HelpContactClient";
import { PolicyPageShell } from "@/components/PolicyPageShell";
import { getSessionAccount } from "@/lib/auth";
import {
  getPrivacyContactEmail,
  getSupportInboxEmail,
  SUPPORT_FAQ,
} from "@/lib/support-contact";

export const metadata = {
  title: "Help & contact | Belize Research Panel",
  description:
    "Get help with your Belize Research Panel account, verification, surveys, rewards, and privacy requests.",
};

export default async function HelpPage() {
  const session = await getSessionAccount();
  const defaultName = session ? `${session.firstName} ${session.lastName}`.trim() : "";
  const defaultEmail = session?.email ?? "";

  return (
    <PolicyPageShell
      title="Help & contact"
      description="Find answers to common questions or send a message to our support team."
      plainContent
    >
      <HelpContactClient
        faq={SUPPORT_FAQ}
        supportEmail={getSupportInboxEmail()}
        privacyEmail={getPrivacyContactEmail()}
        defaultName={defaultName}
        defaultEmail={defaultEmail}
      />
    </PolicyPageShell>
  );
}

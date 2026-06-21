import { HelpContactClient } from "@/components/help/HelpContactClient";
import { PolicyPageShell } from "@/components/PolicyPageShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSessionAccount } from "@/lib/auth";
import { faqPageJsonLd, webPageJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  getPrivacyContactEmail,
  getSupportInboxEmail,
  SUPPORT_FAQ,
} from "@/lib/support-contact";

const PAGE_TITLE = "Help & contact";
const PAGE_DESCRIPTION =
  "Get help with your Belize Research Panel account, verification, surveys, rewards, and privacy requests.";

export const metadata = buildPageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/help",
});

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
      <JsonLd
        data={[
          webPageJsonLd({
            path: "/help",
            title: PAGE_TITLE,
            description: PAGE_DESCRIPTION,
          }),
          faqPageJsonLd(SUPPORT_FAQ),
        ]}
      />
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

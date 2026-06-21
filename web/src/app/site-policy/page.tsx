import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPageShell, PolicySection } from "@/components/PolicyPageShell";
import { formatHeadingCase } from "@/lib/sentence-case";

export const metadata: Metadata = {
  title: "Site policy | Belize Research Panel",
  description: "Terms governing use of the Belize Research Panel website and panelist accounts.",
};

export default function SitePolicyPage() {
  return (
    <PolicyPageShell
      title="Site policy"
      description="Rules for using the Belize Research Panel platform, accounts, and research participation."
    >
      <PolicySection title="About this platform">
        <p>
          {formatHeadingCase(
            "The Belize Research Panel is an invitation-quality research platform for public opinion polling, market research, and governance studies in Belize. This site policy explains how you may use our website and panelist services."
          )}
        </p>
      </PolicySection>

      <PolicySection title="Eligibility and accounts">
        <p>
          {formatHeadingCase(
            "You must meet published eligibility criteria, create an account with a valid email address, and complete registration honestly. You are responsible for keeping your login credentials secure and for activity under your account."
          )}
        </p>
        <p>
          {formatHeadingCase(
            "We may suspend or close accounts that appear fraudulent, duplicated, incomplete, or inconsistent with panel integrity requirements."
          )}
        </p>
      </PolicySection>

      <PolicySection title="Acceptable use">
        <p>
          {formatHeadingCase(
            "You agree not to misuse the platform, attempt unauthorised access, interfere with service operation, submit false information, or use automated tools to scrape or disrupt the site."
          )}
        </p>
        <p>
          {formatHeadingCase(
            "Research responses must reflect your own views unless a study explicitly permits assisted completion. Sharing confidential survey materials without permission is prohibited."
          )}
        </p>
      </PolicySection>

      <PolicySection title="Research participation">
        <p>
          {formatHeadingCase(
            "Survey invitations are matched to your profile and interests. Participation is voluntary unless otherwise stated in a specific study agreement. Reward points and redemption rules are published in the dashboard and may change with notice."
          )}
        </p>
      </PolicySection>

      <PolicySection title="Content and intellectual property">
        <p>
          {formatHeadingCase(
            "Platform branding, software, and materials are owned by or licensed to the Belize Research Panel. You may not copy, reverse engineer, or redistribute them except as allowed for normal personal use of the service."
          )}
        </p>
      </PolicySection>

      <PolicySection title="Service availability">
        <p>
          {formatHeadingCase(
            "We aim to keep the platform available and secure but do not guarantee uninterrupted access. Maintenance, updates, or events outside our control may affect availability."
          )}
        </p>
      </PolicySection>

      <PolicySection title="Changes and contact">
        <p>
          {formatHeadingCase(
            "We may update this site policy to reflect legal, operational, or product changes. Material updates will be posted on this page with a revised effective date."
          )}
        </p>
        <p>
          {formatHeadingCase("Questions about this policy may be sent through our")}{" "}
          <Link href="/help" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            help & contact page
          </Link>{" "}
          {formatHeadingCase("or by email to")}{" "}
          <a href="mailto:privacy@belizepanel.test" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            privacy@belizepanel.test
          </a>
          .
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase("Effective date")}: 30 May 2026</p>
      </PolicySection>
    </PolicyPageShell>
  );
}

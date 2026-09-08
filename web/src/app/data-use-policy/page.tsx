import Link from "next/link";
import { PolicyPageShell, PolicySection } from "@/components/PolicyPageShell";
import { formatHeadingCase } from "@/lib/sentence-case";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPrivacyContactEmail } from "@/lib/support-contact";

export const metadata = buildPageMetadata({
  title: "Data use policy",
  description:
    "How the Belize Research Panel collects, uses, and protects personal data under GDPR-aligned standards.",
  path: "/data-use-policy",
});

export default function DataUsePolicyPage() {
  const privacyEmail = getPrivacyContactEmail();

  return (
    <PolicyPageShell
      title="Data use policy"
      description="How we collect, use, store, and protect personal data in line with GDPR principles."
    >
      <PolicySection title="Data controller">
        <p>
          {formatHeadingCase(
            "The Belize Research Panel is the data controller for personal information collected through this website and panelist registration. For privacy requests, visit our"
          )}{" "}
          <Link href="/help" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            help & contact page
          </Link>{" "}
          {formatHeadingCase("or email")}{" "}
          <a href={`mailto:${privacyEmail}`} className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            {privacyEmail}
          </a>
          .
        </p>
      </PolicySection>

      <PolicySection title="Personal data we collect">
        <p>{formatHeadingCase("Depending on your use of the platform, we may process:")}</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>{formatHeadingCase("Account data — name, email, login credentials, verification status")}</li>
          <li>{formatHeadingCase("Registration profile — date of birth, citizenship, residence, interests, contact details")}</li>
          <li>{formatHeadingCase("Verification materials — phone number, photo identification, and proof of residence where required")}</li>
          <li>{formatHeadingCase("Participation data — survey responses, reward points, and redemption requests")}</li>
          <li>{formatHeadingCase("Technical data — device/browser information and security logs necessary to operate the service")}</li>
          <li>
            {formatHeadingCase(
              "Social contact details — Facebook, Instagram, or TikTok handle or profile link you provide, and, if you connect Facebook Login, your Facebook user identifier, name, and email Facebook shares with us"
            )}
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="Legal bases for processing">
        <p>{formatHeadingCase("We process personal data only where a lawful basis applies under GDPR, including:")}</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>{formatHeadingCase("Consent")}</strong> —{" "}
            {formatHeadingCase("for research participation, contact about studies, and privacy notices you accept at registration")}
          </li>
          <li>
            <strong>{formatHeadingCase("Contract")}</strong> —{" "}
            {formatHeadingCase("to create and manage your panelist account and deliver agreed services")}
          </li>
          <li>
            <strong>{formatHeadingCase("Legitimate interests")}</strong> —{" "}
            {formatHeadingCase("to verify eligibility, prevent fraud, maintain panel quality, and improve platform security, balanced against your rights")}
          </li>
          <li>
            <strong>{formatHeadingCase("Legal obligation")}</strong> —{" "}
            {formatHeadingCase("where retention or disclosure is required by applicable law")}
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="How we use your data">
        <p>
          {formatHeadingCase(
            "We use personal data to verify panelist eligibility, administer accounts, match relevant research invitations, process rewards, communicate about verification and surveys, protect platform integrity, and produce aggregated research outputs that do not identify individuals without separate consent."
          )}
        </p>
        <p>
          {formatHeadingCase(
            "We do not sell personal data. Identifiable information is shared only with authorised administrators, contracted processors bound by confidentiality, or where required by law."
          )}
        </p>
      </PolicySection>

      <PolicySection title="Retention">
        <p>
          {formatHeadingCase(
            "We keep personal data only as long as necessary for the purposes above, including active panel membership, legal compliance, dispute resolution, and audit requirements. Verification documents and contact history may be retained for a defined period after account closure unless deletion is requested and no overriding legal basis applies."
          )}
        </p>
      </PolicySection>

      <PolicySection title="Security">
        <p>
          {formatHeadingCase(
            "We apply appropriate technical and organisational measures — including access controls, encryption in transit where supported, and restricted handling of identity documents — to protect personal data against unauthorised access, loss, or misuse."
          )}
        </p>
      </PolicySection>

      <PolicySection title="International transfers">
        <p>
          {formatHeadingCase(
            "Where data is processed outside your country, we ensure appropriate safeguards consistent with GDPR requirements, such as adequacy decisions, standard contractual clauses, or equivalent protections."
          )}
        </p>
      </PolicySection>

      <PolicySection title="Your GDPR rights">
        <p>{formatHeadingCase("Subject to applicable law, you may have the right to:")}</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>{formatHeadingCase("Access the personal data we hold about you")}</li>
          <li>{formatHeadingCase("Rectify inaccurate or incomplete data")}</li>
          <li>{formatHeadingCase("Erase data where processing is no longer lawful or necessary")}</li>
          <li>{formatHeadingCase("Restrict or object to certain processing, including direct marketing")}</li>
          <li>{formatHeadingCase("Data portability for information you provided in a structured, commonly used format")}</li>
          <li>{formatHeadingCase("Withdraw consent at any time, without affecting prior lawful processing")}</li>
          <li>{formatHeadingCase("Unsubscribe from survey invitations using the link in those emails")}</li>
          <li>
            {formatHeadingCase("Delete your account and opt out from your profile, the")}{" "}
            <Link href="/account/delete" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
              delete account
            </Link>{" "}
            {formatHeadingCase("page, or the public")}{" "}
            <Link href="/data-deletion" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
              data deletion
            </Link>{" "}
            {formatHeadingCase("instructions. Closing an account also unsubscribes that email from all future messages")}
          </li>
          <li>{formatHeadingCase("Lodge a complaint with a supervisory data protection authority")}</li>
        </ul>
        <p>
          {formatHeadingCase("To exercise these rights, use our")}{" "}
          <Link href="/help" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            help & contact page
          </Link>{" "}
          {formatHeadingCase("or email")}{" "}
          <a href={`mailto:${privacyEmail}`} className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            {privacyEmail}
          </a>
          . {formatHeadingCase("We may need to verify your identity before responding.")}
        </p>
      </PolicySection>

      <PolicySection title="Facebook and other platforms">
        <p>
          {formatHeadingCase(
            "You may give us a Facebook, Instagram, or TikTok profile as a way to contact you. If Facebook Login is enabled, connecting your Facebook account lets us receive the name, email, and public profile Facebook is authorised to share. We use this only to confirm your identity or contact details for panel administration."
          )}
        </p>
        <p>
          {formatHeadingCase(
            "We do not post to your Facebook account. You can remove a stored Facebook handle in your profile, disconnect the app in Facebook Settings → Apps and websites, or delete your panel account. Step-by-step instructions are on our"
          )}{" "}
          <Link href="/data-deletion" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            data deletion
          </Link>{" "}
          {formatHeadingCase("page.")}
        </p>
      </PolicySection>

      <PolicySection title="Cookies and similar technologies">
        <p>
          {formatHeadingCase(
            "We use essential cookies and browser storage necessary for authentication, security, preferences, and core site functionality. We do not use advertising or third-party tracking cookies."
          )}{" "}
          {formatHeadingCase("Full details are in our")}{" "}
          <Link href="/cookie-policy" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            cookie policy
          </Link>
          .
        </p>
      </PolicySection>

      <PolicySection title="Children">
        <p>
          {formatHeadingCase(
            "The panel is intended for eligible adults. We do not knowingly collect personal data from individuals below the minimum panel age without appropriate parental or guardian authority where required by law."
          )}
        </p>
      </PolicySection>

      <PolicySection title="Updates to this policy">
        <p>
          {formatHeadingCase(
            "We may update this data use policy when our practices or legal obligations change. The current version will always be published on this page."
          )}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">{formatHeadingCase("Effective date")}: 30 May 2026</p>
      </PolicySection>
    </PolicyPageShell>
  );
}

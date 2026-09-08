import Link from "next/link";
import { PolicyPageShell, PolicySection } from "@/components/PolicyPageShell";
import { formatHeadingCase } from "@/lib/sentence-case";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPrivacyContactEmail } from "@/lib/support-contact";

export const metadata = buildPageMetadata({
  title: "Cookie policy",
  description:
    "How the Belize Research Panel uses cookies and browser storage for authentication, security, preferences, and drafts.",
  path: "/cookie-policy",
});

export default function CookiePolicyPage() {
  const privacyEmail = getPrivacyContactEmail();

  return (
    <PolicyPageShell
      title="Cookie policy"
      description="What cookies and similar technologies we use, why we use them, and how you can manage them."
    >
      <PolicySection title="Overview">
        <p>
          {formatHeadingCase(
            "This cookie policy explains how the Belize Research Panel uses cookies and similar technologies such as local storage and session storage when you visit our website."
          )}
        </p>
        <p>
          {formatHeadingCase("It should be read together with our")}{" "}
          <Link href="/data-use-policy" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            data use policy
          </Link>{" "}
          {formatHeadingCase("and")}{" "}
          <Link href="/site-policy" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            site policy
          </Link>
          .
        </p>
      </PolicySection>

      <PolicySection title="What are cookies and similar technologies?">
        <p>
          {formatHeadingCase(
            "Cookies are small text files stored on your device by a website. We also use browser storage (local storage and session storage) for preferences, drafts, and temporary session information. Together, these help the site work securely and remember choices you make."
          )}
        </p>
      </PolicySection>

      <PolicySection title="Essential cookies and storage we use">
        <p>
          {formatHeadingCase(
            "We use essential cookies and storage that are necessary for the site to function. These are not used for advertising and are not sold to third parties."
          )}
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>{formatHeadingCase("Authentication and security")}</strong> —{" "}
            {formatHeadingCase(
              "session cookies keep you signed in securely after login and help protect accounts against unauthorised access."
            )}
          </li>
          <li>
            <strong>{formatHeadingCase("Preferences")}</strong> —{" "}
            {formatHeadingCase(
              "browser storage may remember theme preference (light, dark, or system), language choice during registration, and similar display settings."
            )}
          </li>
          <li>
            <strong>{formatHeadingCase("Drafts and continuity")}</strong> —{" "}
            {formatHeadingCase(
              "registration and survey drafts may be saved in browser storage so you can continue later on the same device."
            )}
          </li>
          <li>
            <strong>{formatHeadingCase("Cookie notice")}</strong> —{" "}
            {formatHeadingCase(
              "we store a simple record that you have acknowledged this cookie notice so we do not show it on every visit."
            )}
          </li>
          <li>
            <strong>{formatHeadingCase("Operational notices")}</strong> —{" "}
            {formatHeadingCase(
              "temporary session storage may remember that you dismissed an in-app notice, such as a new survey alert."
            )}
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="Analytics and advertising cookies">
        <p>
          {formatHeadingCase(
            "We do not use advertising cookies, social media tracking pixels, or third-party marketing trackers on this site. If that ever changes, we will update this policy and provide any additional notice or consent required by law."
          )}
        </p>
      </PolicySection>

      <PolicySection title="How long cookies last">
        <p>
          {formatHeadingCase(
            "Session cookies usually expire when you close your browser or after a limited idle period. Preference and draft storage may remain until you clear them, finish the related task, or delete the stored values in your browser settings."
          )}
        </p>
      </PolicySection>

      <PolicySection title="Managing cookies">
        <p>
          {formatHeadingCase(
            "You can control or delete cookies and site data through your browser settings. Blocking essential cookies may prevent sign-in, registration, or other core features from working correctly."
          )}
        </p>
        <p>
          {formatHeadingCase(
            "Clearing site data will also remove saved drafts, theme preference, language confirmation, and the record that you acknowledged this notice."
          )}
        </p>
      </PolicySection>

      <PolicySection title="Your choices">
        <p>
          {formatHeadingCase(
            "Because we only use essential cookies and storage needed to run the service, the cookie notice asks you to acknowledge this information rather than opt into optional tracking. You can review this page at any time from the site footer."
          )}
        </p>
      </PolicySection>

      <PolicySection title="Contact">
        <p>
          {formatHeadingCase("Questions about cookies or privacy can be sent through our")}{" "}
          <Link href="/help" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            help & contact page
          </Link>{" "}
          {formatHeadingCase("or emailed to")}{" "}
          <a href={`mailto:${privacyEmail}`} className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            {privacyEmail}
          </a>
          .
        </p>
      </PolicySection>

      <PolicySection title="Updates">
        <p>
          {formatHeadingCase(
            "We may update this cookie policy when our practices or legal requirements change. The current version will always be published on this page."
          )}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {formatHeadingCase("Effective date")}: 8 September 2026
        </p>
      </PolicySection>
    </PolicyPageShell>
  );
}

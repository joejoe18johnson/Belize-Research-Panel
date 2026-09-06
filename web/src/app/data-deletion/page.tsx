import Link from "next/link";
import { PolicyPageShell, PolicySection } from "@/components/PolicyPageShell";
import { formatHeadingCase } from "@/lib/sentence-case";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPrivacyContactEmail, getPublicPrivacyContactEmail } from "@/lib/support-contact";

export const metadata = buildPageMetadata({
  title: "Data deletion",
  description:
    "How to request deletion of your Belize Research Panel account and any Facebook-connected data.",
  path: "/data-deletion",
});

export default function DataDeletionPage() {
  const privacyEmail = getPublicPrivacyContactEmail() || getPrivacyContactEmail();

  return (
    <PolicyPageShell
      title="Data deletion"
      description="How to delete your Belize Research Panel account and any information connected through Facebook or other contact details."
    >
      <PolicySection title="How to delete your account">
        <p>
          {formatHeadingCase(
            "Signed-in panelists can delete their account and opt out at any time. This removes your login, withdraws panel membership, and anonymises or deletes personal data we are not required to keep."
          )}
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            {formatHeadingCase("Sign in and open")}{" "}
            <Link href="/account/delete" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
              delete account
            </Link>
            .
          </li>
          <li>{formatHeadingCase("Confirm that you want to opt out and enter your password.")}</li>
          <li>
            {formatHeadingCase(
              "We process the request on the same page. Your email is also unsubscribed from future messages."
            )}
          </li>
        </ol>
        <p>
          {formatHeadingCase("You can also start from Dashboard → Profile, or use the Delete account link in the site footer when you are signed in.")}
        </p>
      </PolicySection>

      <PolicySection title="If you cannot sign in">
        <p>
          {formatHeadingCase("Email a deletion request from the address on the account to")}{" "}
          <a href={`mailto:${privacyEmail}`} className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            {privacyEmail}
          </a>
          {formatHeadingCase(", or send a message through our")}{" "}
          <Link href="/help" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            help & contact page
          </Link>{" "}
          {formatHeadingCase("and choose Privacy & data requests. We may verify your identity before completing deletion.")}
        </p>
      </PolicySection>

      <PolicySection title="Facebook and other connected details">
        <p>
          {formatHeadingCase(
            "If you added a Facebook, Instagram, or TikTok profile as a contact method, or later connect a Facebook account, we store only what is needed to reach you or confirm the account — typically your name, handle or profile link, and a Facebook user identifier if Facebook Login is used."
          )}
        </p>
        <p>{formatHeadingCase("To remove that information:")}</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>{formatHeadingCase("Delete your Belize Research Panel account using the steps above. This removes stored Facebook, Instagram, and TikTok contact details with the rest of your profile.")}</li>
          <li>{formatHeadingCase("If you connected Facebook Login, also open Facebook → Settings & privacy → Settings → Apps and websites, then remove Belize Research Panel.")}</li>
          <li>{formatHeadingCase("If you only want the Facebook handle removed and wish to keep your panel account, sign in, edit your profile, and clear the Facebook field — or email us and ask us to remove it.")}</li>
        </ul>
      </PolicySection>

      <PolicySection title="What we delete">
        <p>{formatHeadingCase("When an account is deleted we remove or anonymise:")}</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>{formatHeadingCase("Login credentials and session access")}</li>
          <li>{formatHeadingCase("Name, email, phone, address, and social contact details, including Facebook")}</li>
          <li>{formatHeadingCase("Verification uploads we are not required to retain")}</li>
          <li>{formatHeadingCase("Pending rewards or redemption requests, which may be cancelled")}</li>
        </ul>
        <p>
          {formatHeadingCase(
            "We may keep a limited record where the law, fraud prevention, or completed payouts require it. Survey answers already used in aggregated research stay in anonymised form and are not linked back to you."
          )}
        </p>
      </PolicySection>

      <PolicySection title="How long deletion takes">
        <p>
          {formatHeadingCase(
            "Self-service deletion from the delete account page is completed when you confirm. Email or help-form requests are normally completed within 30 days after we verify the request."
          )}
        </p>
      </PolicySection>

      <PolicySection title="Related policies">
        <p>
          <Link href="/data-use-policy" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            Data use policy
          </Link>
          {" · "}
          <Link href="/site-policy" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            Site policy
          </Link>
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatHeadingCase("Effective date")}: 5 September 2026</p>
      </PolicySection>
    </PolicyPageShell>
  );
}

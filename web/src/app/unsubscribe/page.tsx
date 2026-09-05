import Link from "next/link";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { unsubscribeFromOutreachToken } from "@/lib/email/unsubscribe";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Unsubscribe",
  description: "Stop survey invitation emails from the Belize Research Panel.",
  path: "/unsubscribe",
  noIndex: true,
});

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 1);
  return `${visible}${"•".repeat(Math.max(local.length - 1, 1))}@${domain}`;
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string; error?: string }>;
}) {
  const { token, done, error } = await searchParams;

  if (error === "invalid" || (!token && done !== "1")) {
    return (
      <AuthPageShell
        title="Invalid unsubscribe link"
        subtitle="This unsubscribe link is missing or no longer valid. If you still receive survey invitations, use the unsubscribe link in the most recent email."
      >
        <Link
          href="/help"
          className="inline-block rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Contact support
        </Link>
      </AuthPageShell>
    );
  }

  if (token) {
    const result = await unsubscribeFromOutreachToken(token);
    if (!result.ok) {
      return (
        <AuthPageShell
          title="Invalid unsubscribe link"
          subtitle="This unsubscribe link is missing or no longer valid. If you still receive survey invitations, use the unsubscribe link in the most recent email."
        >
          <Link
            href="/help"
            className="inline-block rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Contact support
          </Link>
        </AuthPageShell>
      );
    }

    const closedAccount = result.scope === "all";
    return (
      <AuthPageShell
        title={result.already || closedAccount ? "Already unsubscribed" : "You are unsubscribed"}
        subtitle={
          closedAccount
            ? `We will not send further emails to ${maskEmail(result.email)}.`
            : `We will stop sending survey invitations and reminders to ${maskEmail(result.email)}. You will still receive account, verification, and payout messages while your account is open.`
        }
      >
        <div className="flex flex-col gap-3">
          <Link
            href="/help"
            className="rounded-xl bg-teal-700 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-800"
          >
            Contact support
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-zinc-300 px-5 py-2.5 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Back to home
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title="You are unsubscribed"
      subtitle="We will stop sending survey invitations and reminders to this address. You will still receive account, verification, and payout messages while your account is open."
    >
      <Link
        href="/"
        className="inline-block rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
      >
        Back to home
      </Link>
    </AuthPageShell>
  );
}

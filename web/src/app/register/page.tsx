import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { RegisterAuthGate } from "@/components/auth/RegisterAuthGate";
import { RegistrationPageClient } from "@/components/registration/RegistrationPageClient";
import { getSessionAccount } from "@/lib/auth";
import { formatHeadingCase } from "@/lib/sentence-case";

export const metadata = {
  title: "Register | Belize Research Panel",
  description: "Join the exclusive Belize Research Panel",
};

export default async function RegisterPage() {
  const account = await getSessionAccount();

  if (!account) {
    return <RegisterAuthGate nextPath="/register" />;
  }

  if (!account.emailVerified) {
    return (
      <AuthPageShell
        title="Verify your email first"
        subtitle="Panelist registration opens after your email address is verified."
      >
        <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
          <p>
            Signed in as <span className="font-medium text-zinc-900 dark:text-zinc-100">{account.email}</span>.
          </p>
          <Link
            href={`/signup/check-email?email=${encodeURIComponent(account.email)}&next=/register`}
            className="inline-block rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Go to email verification
          </Link>
          <div className="pt-2">
            <LogoutButton className="text-sm font-medium text-teal-700 hover:text-teal-900 dark:text-teal-100" />
          </div>
          <p className="pt-2 text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">
            {formatHeadingCase("Want to leave?")}{" "}
            <Link href="/account/delete" className="font-medium text-teal-700 hover:underline">
              {formatHeadingCase("Delete account and opt out")}
            </Link>
          </p>
        </div>
      </AuthPageShell>
    );
  }

  if (account.panelistRegistered) {
    redirect("/dashboard");
  }

  return (
    <RegistrationPageClient
      account={{
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        citizenshipStatus: account.citizenshipStatus,
        commonwealthCountry: account.commonwealthCountry,
        dob: account.dob,
      }}
    />
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { BrpLogoLink } from "@/components/BrpLogo";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { RegisterAuthGate } from "@/components/auth/RegisterAuthGate";
import { RegistrationForm } from "@/components/registration/RegistrationForm";
import { getSessionAccount } from "@/lib/auth";
import { appContentClass } from "@/lib/layout-widths";
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
        <div className="space-y-4 text-sm text-zinc-700">
          <p>
            Signed in as <span className="font-medium text-zinc-900">{account.email}</span>.
          </p>
          <Link
            href={`/signup/check-email?email=${encodeURIComponent(account.email)}&next=/register`}
            className="inline-block rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Go to email verification
          </Link>
          <div className="pt-2">
            <LogoutButton className="text-sm font-medium text-teal-700 hover:text-teal-900" />
          </div>
          <p className="pt-2 text-xs text-zinc-500">
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
    <div className="min-h-screen bg-zinc-100">
      <header className="safe-top sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className={`relative ${appContentClass} flex items-center justify-center px-3 py-3 sm:px-4 sm:py-4`}>
          <BrpLogoLink href="/" variant="light" priority />
          <div className="absolute right-3 flex items-center gap-2 text-sm sm:right-4 sm:gap-4">
            <Link
              href="/account/delete"
              className="hidden text-xs font-medium text-zinc-500 hover:text-teal-800 sm:inline"
            >
              {formatHeadingCase("Delete account")}
            </Link>
            <span className="hidden max-w-[12rem] truncate text-zinc-600 md:inline">{account.email}</span>
            <LogoutButton className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-teal-700 hover:bg-teal-50 hover:text-teal-900 sm:px-4" />
          </div>
        </div>
      </header>
      <main className={`${appContentClass} px-3 py-6 sm:px-4 sm:py-8`}>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            {formatHeadingCase("Panelist registration")}
          </h1>
          <p className="mt-2 text-zinc-600">
            {formatHeadingCase(
              "Your account is verified. Complete the steps below to join the panel for public opinion polling, market research, and governance studies."
            )}
          </p>
        </div>
        <RegistrationForm
          account={{
            firstName: account.firstName,
            lastName: account.lastName,
            email: account.email,
            citizenshipStatus: account.citizenshipStatus,
            commonwealthCountry: account.commonwealthCountry,
            dob: account.dob,
          }}
        />
      </main>
    </div>
  );
}

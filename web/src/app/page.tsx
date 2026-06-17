import Link from "next/link";
import { AdminEntryButton } from "@/components/admin/AdminEntryButton";
import { BrpLogoLink } from "@/components/BrpLogo";
import { formatHeadingCase } from "@/lib/sentence-case";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-950 via-teal-900 to-zinc-900 text-white">
      <header className="safe-top mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
        <BrpLogoLink href="/" variant="dark" />
        <div className="hidden w-full gap-2 sm:flex sm:w-auto sm:gap-3">
          <AdminEntryButton variant="header" />
          <Link
            href="/login"
            className="flex min-h-11 flex-1 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-teal-100 hover:bg-white/10 sm:flex-none"
          >
            {formatHeadingCase("Log in")}
          </Link>
          <Link
            href="/register"
            className="flex min-h-11 flex-1 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-50 sm:flex-none"
          >
            {formatHeadingCase("Register")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium text-teal-200">{formatHeadingCase("Exclusive research panel")}</p>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
            {formatHeadingCase(
              "Public opinion polling, market research, and governance studies for Belize"
            )}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-teal-100 sm:mt-6 sm:text-lg">
            {formatHeadingCase(
              "A secure, invitation-quality research platform. Create an account, verify your email, then complete panelist registration to participate in surveys matched to your profile and interests."
            )}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href="/register"
              className="flex min-h-12 items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-teal-900 shadow-lg hover:bg-teal-50"
            >
              {formatHeadingCase("Register for the panel")}
            </Link>
            <Link
              href="/login"
              className="flex min-h-12 items-center justify-center rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              {formatHeadingCase("Panelist login")}
            </Link>
            <AdminEntryButton variant="inline" />
          </div>
        </div>

        <section className="mt-14 grid gap-4 sm:mt-20 sm:gap-6 md:grid-cols-3">
          {[
            ["Verified eligibility", "Age, citizenship, residency, and voter status checks before panel admission."],
            ["Secure accounts", "Create an account with email verification before completing panelist registration."],
            ["Matched research", "Political, market, and civic interest profiling for relevant survey invitations."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <h2 className="text-lg font-semibold">{formatHeadingCase(title)}</h2>
              <p className="mt-2 text-sm leading-relaxed text-teal-100">{formatHeadingCase(body)}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

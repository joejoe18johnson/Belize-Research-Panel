import Link from "next/link";
import { redirect } from "next/navigation";
import { DeleteAccountPanel } from "@/components/account/DeleteAccountPanel";
import { BrpLogoLink } from "@/components/BrpLogo";
import { getSessionAccount } from "@/lib/auth";
import { AUTH_CONTENT_MAX } from "@/lib/layout-widths";
import { formatHeadingCase } from "@/lib/sentence-case";

export const metadata = {
  title: "Delete account | Belize Research Panel",
};

export default async function DeleteAccountPage() {
  const account = await getSessionAccount();
  if (!account) {
    redirect("/login?next=/account/delete");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-100">
      <header className="safe-top shrink-0 border-b border-zinc-200 bg-white">
        <div className={`mx-auto flex ${AUTH_CONTENT_MAX} items-center justify-center px-4 py-4 sm:px-6`}>
          <BrpLogoLink href={account.panelistRegistered ? "/dashboard" : "/register"} variant="light" />
        </div>
      </header>
      <main className={`mx-auto w-full flex-1 px-4 py-8 sm:px-6 sm:py-12 ${AUTH_CONTENT_MAX}`}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">{formatHeadingCase("Delete account and opt out")}</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {formatHeadingCase("Signed in as")}{" "}
            <span className="font-medium text-zinc-900">{account.email}</span>
          </p>
        </div>
        <DeleteAccountPanel compact />
        <p className="mt-6 text-center text-sm text-zinc-600">
          {formatHeadingCase("Changed your mind?")}{" "}
          <Link
            href={account.panelistRegistered ? "/dashboard/profile" : "/register"}
            className="font-semibold text-teal-700 hover:underline"
          >
            {formatHeadingCase("Go back")}
          </Link>
        </p>
      </main>
    </div>
  );
}

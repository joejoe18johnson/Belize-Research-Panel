import Link from "next/link";
import { formatHeadingCase } from "@/lib/sentence-case";

export default function ClientPortalNotFound() {
  return (
    <div className="space-y-6">
      <div className="border-l-4 border-teal-600 pl-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-teal-700">{formatHeadingCase("Client portal")}</p>
        <h1 className="mt-1 text-2xl font-bold text-teal-950 dark:text-teal-100 sm:text-3xl">
          {formatHeadingCase("Page not found")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          We could not find that page in your research portal. Return to your commissioned studies list to open a linked
          campaign.
        </p>
      </div>
      <Link
        href="/client"
        className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800"
      >
        {formatHeadingCase("Back to my campaigns")}
      </Link>
    </div>
  );
}

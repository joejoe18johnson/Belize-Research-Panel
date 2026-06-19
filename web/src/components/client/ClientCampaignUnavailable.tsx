import Link from "next/link";
import { BrandedAlert } from "@/components/shared/BrandedFeedback";
import { formatHeadingCase } from "@/lib/sentence-case";

export function ClientCampaignUnavailable({ campaignId }: { campaignId?: string }) {
  return (
    <div className="space-y-6">
      <div className="border-l-4 border-teal-600 pl-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-teal-700">{formatHeadingCase("Research report")}</p>
        <h1 className="mt-1 text-2xl font-bold text-teal-950 dark:text-teal-100 sm:text-3xl">
          {formatHeadingCase("Study not available")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          This study is not linked to your client account, or it may have been removed. Only campaigns commissioned by
          your organization appear in the client portal.
        </p>
      </div>

      <BrandedAlert tone="info" title="Need access?" showIcon>
        If you expected to see results here, ask your Belize Research Panel project manager to link the study to your
        client account in admin.
        {campaignId ? (
          <span className="mt-2 block font-mono text-xs text-zinc-500 dark:text-zinc-400">Reference: {campaignId}</span>
        ) : null}
      </BrandedAlert>

      <Link
        href="/client"
        className="inline-flex min-h-11 items-center rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800"
      >
        {formatHeadingCase("Back to my campaigns")}
      </Link>
    </div>
  );
}

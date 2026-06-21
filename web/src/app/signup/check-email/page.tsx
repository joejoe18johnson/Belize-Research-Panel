import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";
import CheckEmailClient from "./CheckEmailClient";

export const metadata = buildPageMetadata({
  title: "Verify your email",
  description: "Check your inbox for a verification link to activate your Belize Research Panel account.",
  path: "/signup/check-email",
  noIndex: true,
});

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">Loading…</p>}>
      <CheckEmailClient />
    </Suspense>
  );
}

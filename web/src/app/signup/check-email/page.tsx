import { Suspense } from "react";
import { AuthPageSkeleton } from "@/components/shared/PageSkeletons";
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
    <Suspense fallback={<AuthPageSkeleton />}>
      <CheckEmailClient />
    </Suspense>
  );
}

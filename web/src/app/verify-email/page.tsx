import { redirect } from "next/navigation";
import { VerifyEmailClient } from "./VerifyEmailClient";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Verify email",
  description: "Confirm your email address for your Belize Research Panel account.",
  path: "/verify-email",
  noIndex: true,
});

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; purpose?: string; error?: string; verified?: string }>;
}) {
  const { token, purpose, error, verified } = await searchParams;

  if (token && !error && purpose !== "email-change") {
    redirect(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  }

  if (verified === "1") {
    return <VerifyEmailClient state={{ kind: "verified" }} />;
  }

  if (purpose === "email-change" && token) {
    return <VerifyEmailClient state={{ kind: "email-change" }} />;
  }

  if (error === "missing") {
    return <VerifyEmailClient state={{ kind: "missing" }} />;
  }

  if (error === "expired") {
    return <VerifyEmailClient state={{ kind: "expired" }} />;
  }

  if (error === "failed") {
    return <VerifyEmailClient state={{ kind: "failed" }} />;
  }

  return <VerifyEmailClient state={{ kind: "default" }} />;
}

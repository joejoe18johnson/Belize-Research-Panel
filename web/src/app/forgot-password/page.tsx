import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Forgot password",
  description: "Request a password reset link for your Belize Research Panel account.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      title="Forgot password"
      subtitle="Enter the email address for your account and we will send you a link to reset your password."
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}

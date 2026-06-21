import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Forgot password | Belize Research Panel",
};

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

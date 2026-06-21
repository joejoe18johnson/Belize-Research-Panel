import { AdminAuthShell } from "@/components/admin/AdminAuthShell";
import { AdminForgotPasswordForm } from "@/components/admin/AdminForgotPasswordForm";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Forgot password | Admin",
};

export default async function AdminForgotPasswordPage() {
  if (await isAdminSessionActive()) {
    redirect("/admin/dashboard");
  }

  return (
    <AdminAuthShell
      eyebrow="Admin access"
      title="Forgot password"
      description="Enter your staff email address and we will send you a link to reset your admin password."
    >
      <AdminForgotPasswordForm />
    </AdminAuthShell>
  );
}

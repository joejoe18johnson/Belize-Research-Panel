import { AdminAuthShell } from "@/components/admin/AdminAuthShell";
import { AdminForgotPasswordForm } from "@/components/admin/AdminForgotPasswordForm";
import { getAdminSession } from "@/lib/admin-auth";
import { staffDefaultAdminPath } from "@/lib/staff-roles";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Forgot password | Admin",
};

export default async function AdminForgotPasswordPage() {
  const session = await getAdminSession();
  if (session) {
    redirect(staffDefaultAdminPath(session.role, session.allowedModules));
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

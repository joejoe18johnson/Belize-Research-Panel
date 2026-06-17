import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin login | Belize Research Panel",
};

export default async function AdminLoginPage() {
  if (await isAdminSessionActive()) {
    redirect("/admin/dashboard");
  }

  return <AdminLoginForm />;
}

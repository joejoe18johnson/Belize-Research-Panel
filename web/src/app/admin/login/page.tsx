import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getAdminSession } from "@/lib/admin-auth";
import { resolveStaffLoginRedirect } from "@/lib/staff-roles";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin login | Belize Research Panel",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getAdminSession();
  const { next } = await searchParams;
  if (session) {
    redirect(resolveStaffLoginRedirect(session, next));
  }

  return <AdminLoginForm nextPath={next} />;
}

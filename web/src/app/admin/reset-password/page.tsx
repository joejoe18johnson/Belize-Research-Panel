import Link from "next/link";
import { AdminAuthShell } from "@/components/admin/AdminAuthShell";
import { AdminResetPasswordForm } from "@/components/admin/AdminResetPasswordForm";
import { isAdminSessionActive } from "@/lib/admin-auth";
import { findStaffUserByPasswordResetToken } from "@/lib/staff-users";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Reset password | Admin",
};

export default async function AdminResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  if (await isAdminSessionActive()) {
    redirect("/admin/dashboard");
  }

  const { token } = await searchParams;

  if (!token) {
    return (
      <AdminAuthShell eyebrow="Admin access" title="Invalid reset link">
        <Link
          href="/admin/forgot-password"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-teal-700 text-sm font-semibold text-white hover:bg-teal-800"
        >
          Request a new link
        </Link>
      </AdminAuthShell>
    );
  }

  const user = await findStaffUserByPasswordResetToken(token);
  if (!user) {
    return (
      <AdminAuthShell
        eyebrow="Admin access"
        title="Reset link expired"
        description="This link may have already been used or is no longer valid. Request a new password reset email."
      >
        <div className="flex flex-col gap-3">
          <Link
            href="/admin/forgot-password"
            className="rounded-xl bg-teal-700 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-800"
          >
            Request new link
          </Link>
          <Link
            href="/admin/login"
            className="rounded-xl border border-zinc-200 px-5 py-2.5 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Back to staff login
          </Link>
        </div>
      </AdminAuthShell>
    );
  }

  return (
    <AdminAuthShell
      eyebrow="Admin access"
      title="Choose a new password"
      description={`Create a new password for ${user.email}.`}
    >
      <AdminResetPasswordForm token={token} />
    </AdminAuthShell>
  );
}

import { AdminEmailTemplatesClient } from "@/components/admin/email/AdminEmailTemplatesClient";

export const metadata = {
  title: "Email Templates | Admin",
};

export default function AdminEmailTemplatesPage() {
  const resendConfigured = Boolean(process.env.RESEND_API_KEY?.trim());

  return <AdminEmailTemplatesClient resendConfigured={resendConfigured} />;
}

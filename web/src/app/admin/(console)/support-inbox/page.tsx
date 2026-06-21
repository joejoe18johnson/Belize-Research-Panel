import { AdminSupportInboxClient } from "@/components/admin/support/AdminSupportInboxClient";
import { loadSupportMessages } from "@/lib/support-messages";

export const metadata = {
  title: "Support inbox | Admin",
};

export default async function AdminSupportInboxPage() {
  const messages = await loadSupportMessages();
  return <AdminSupportInboxClient messages={messages} />;
}

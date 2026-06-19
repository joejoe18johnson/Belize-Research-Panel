import { ClientShell } from "@/components/client/ClientShell";
import { requireClientSession } from "@/lib/client-auth";

export default async function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireClientSession();
  return <ClientShell session={session}>{children}</ClientShell>;
}

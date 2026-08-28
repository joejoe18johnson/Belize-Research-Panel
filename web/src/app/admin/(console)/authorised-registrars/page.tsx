import { AdminAuthorisedRegistrarsClient } from "@/components/admin/panelists/AdminAuthorisedRegistrarsClient";
import { loadAuthorisedRegistrars } from "@/lib/authorised-registrars-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Authorised Registrars | Admin",
};

export default async function AdminAuthorisedRegistrarsPage() {
  const store = await loadAuthorisedRegistrars();
  return <AdminAuthorisedRegistrarsClient initialRegistrars={store.registrars} />;
}

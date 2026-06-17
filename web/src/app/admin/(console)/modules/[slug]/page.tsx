import { notFound } from "next/navigation";
import { AdminModulePlaceholder } from "@/components/admin/AdminModulePlaceholder";
import { getAdminModule } from "@/lib/admin-modules";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const module = getAdminModule(slug);
  return {
    title: module ? `${module.label} | Admin` : "Admin module",
  };
}

export default async function AdminModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const module = getAdminModule(slug);

  if (!module || module.kind !== "placeholder") {
    notFound();
  }

  return <AdminModulePlaceholder module={module} />;
}

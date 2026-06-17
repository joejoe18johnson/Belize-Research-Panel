import { notFound } from "next/navigation";
import { AdminModulePage } from "@/components/admin/AdminModulePage";
import { getAdminModuleWithContent } from "@/lib/admin-modules";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getAdminModuleWithContent(slug);
  return {
    title: entry ? `${entry.module.label} | Admin` : "Admin module",
  };
}

export default async function AdminModuleRoutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getAdminModuleWithContent(slug);
  if (!entry) notFound();

  return <AdminModulePage module={entry.module} content={entry.content} />;
}

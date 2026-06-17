import { notFound } from "next/navigation";
import { AdminDataModuleDashboard } from "@/components/admin/AdminDataModuleDashboard";
import { AdminDistributionEngineDashboard } from "@/components/admin/distribution/AdminDistributionEngineDashboard";
import { AdminExternalDataImportDashboard } from "@/components/admin/external-import/AdminExternalDataImportDashboard";
import { ADMIN_MODULES } from "@/lib/admin-modules";
import { loadAdminDataHub } from "@/lib/admin-data-hub";
import {
  buildDistributionExportRows,
  buildModuleSnapshot,
  buildPanelMatchIndex,
  isDataModuleSlug,
} from "@/lib/admin-module-snapshots";

export async function generateStaticParams() {
  return ADMIN_MODULES.filter((module) => isDataModuleSlug(module.slug)).map((module) => ({ slug: module.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mod = ADMIN_MODULES.find((item) => item.slug === slug);
  return { title: mod ? `${mod.label} | Admin` : "Admin module" };
}

export default async function AdminDataModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isDataModuleSlug(slug)) notFound();

  const hub = await loadAdminDataHub();
  const snapshot = buildModuleSnapshot(slug, hub);
  if (!snapshot) notFound();

  if (slug === "distribution-engine") {
    return (
      <AdminDistributionEngineDashboard snapshot={snapshot} exportRows={buildDistributionExportRows(hub)} />
    );
  }

  if (slug === "external-data-import") {
    return <AdminExternalDataImportDashboard snapshot={snapshot} matchIndex={buildPanelMatchIndex(hub)} />;
  }

  return <AdminDataModuleDashboard snapshot={snapshot} />;
}

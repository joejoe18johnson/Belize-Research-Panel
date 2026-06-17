import { redirect } from "next/navigation";

/** Legacy /admin/modules/[slug] URLs → /admin/[slug] */
export default async function LegacyAdminModuleRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/admin/${slug}`);
}

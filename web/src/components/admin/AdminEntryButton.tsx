import Link from "next/link";
import { ADMIN_LOGIN_PATH, isAdminEntryVisible } from "@/lib/admin-entry";
import { formatHeadingCase } from "@/lib/sentence-case";

const VARIANT_CLASS = {
  header:
    "flex min-h-11 items-center justify-center rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-teal-100 transition hover:border-white/35 hover:bg-white/10 sm:flex-none",
  inline:
    "flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10",
} as const;

export function AdminEntryButton({ variant = "header" }: { variant?: keyof typeof VARIANT_CLASS }) {
  if (!isAdminEntryVisible()) return null;

  return (
    <Link href={ADMIN_LOGIN_PATH} className={VARIANT_CLASS[variant]}>
      {formatHeadingCase("Admin")}
    </Link>
  );
}

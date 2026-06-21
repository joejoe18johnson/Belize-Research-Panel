import { privateAreaMetadata } from "@/lib/seo/metadata";

export const metadata = privateAreaMetadata("Admin");

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import { privateAreaMetadata } from "@/lib/seo/metadata";

export const metadata = privateAreaMetadata("Client portal");

export default function ClientRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}

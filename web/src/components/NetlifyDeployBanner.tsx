import { isDemoAccountsEnabled } from "@/lib/demo-accounts";
import { isNetlifyDeployPreview } from "@/lib/deploy-env";

export function NetlifyDeployBanner() {
  if (!isNetlifyDeployPreview() || !isDemoAccountsEnabled()) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950"
    >
      Netlify preview — demo accounts enabled. File-based writes may not persist between requests.
    </div>
  );
}

import { isSupabaseConfigured } from "./server";

/** Use Supabase when env is set. Set USE_SUPABASE=false to force JSON files. */
export function useSupabase(): boolean {
  if (process.env.USE_SUPABASE === "false") return false;
  return isSupabaseConfigured();
}

/** True on Netlify/production hosts where JSON/CSV writes do not persist. */
export function isProductionDeploy(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.NETLIFY) ||
    Boolean(process.env.CONTEXT)
  );
}

/** Whether account/panelist writes can succeed in this environment. */
export function canPersistData(): boolean {
  if (useSupabase()) return true;
  return !isProductionDeploy();
}

/** Throws when deployed without Supabase (JSON fallback is dev-only). */
export function assertCanPersistData(): void {
  if (!canPersistData()) {
    throw new Error("storage_not_configured");
  }
}

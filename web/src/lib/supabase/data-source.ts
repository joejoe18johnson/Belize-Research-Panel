import { isSupabaseConfigured } from "./server";

/** Use Supabase when env is set. Set USE_SUPABASE=false to force JSON files. */
export function useSupabase(): boolean {
  if (process.env.USE_SUPABASE === "false") return false;
  return isSupabaseConfigured();
}

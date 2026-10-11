import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";

let adminClient: SupabaseClient | null = null;

function cleanEnv(value: string | undefined): string {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "");
}

/** Server-only Supabase client using the service role (bypasses RLS). Never import in client components. */
export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to web/.env.local."
    );
  }

  // Netlify/Node 20 has no native WebSocket; supabase-js requires an explicit transport.
  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: ws as unknown as typeof WebSocket,
    },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  });

  return adminClient;
}

/** True when Supabase env vars are configured (does not verify connectivity). */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
      cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

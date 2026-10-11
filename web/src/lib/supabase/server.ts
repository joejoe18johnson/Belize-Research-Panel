import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

function cleanEnv(value: string | undefined): string {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "");
}

/** Node 20 (and some serverless runtimes) lack global WebSocket; supabase-js requires one at init. */
function ensureServerWebSocket(): void {
  if (typeof globalThis.WebSocket !== "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const wsModule = require("ws") as { WebSocket?: typeof WebSocket } & typeof WebSocket;
  const WS = (wsModule.WebSocket ?? wsModule) as typeof WebSocket;
  globalThis.WebSocket = WS;
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

  ensureServerWebSocket();

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
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

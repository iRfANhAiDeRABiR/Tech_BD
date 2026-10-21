import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton pattern to prevent multiple GoTrueClient instances
// which causes "Multiple GoTrueClient instances detected" warnings
// and potential session/auth state conflicts.
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!supabaseInstance) {
    // Uses @supabase/ssr so the session is persisted in cookies.
    // This is required for server-side auth checks (middleware,
    // server components) to see the logged-in user. A plain
    // supabase-js client stores the session in localStorage only,
    // which breaks protected routes like /account.
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

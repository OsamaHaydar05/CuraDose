import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://ngesweuiyyrptmqvyryv.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_1JYDNuUZhsUFNjuhuM-tpQ_XjgcoHDA";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase configuration.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
    storageKey: "curadose-auth",
  },
});

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

let client: SupabaseClient | undefined;

/**
 * Klijent za JAVNO čitanje (anonimna uloga, bez kolačića).
 * Ne ovisi o zahtjevu pa javne stranice mogu biti statične i keširane (ISR).
 * RLS u bazi određuje što je vidljivo.
 */
export function publicClient(): SupabaseClient {
  if (!client) {
    const env = publicEnv();
    client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}

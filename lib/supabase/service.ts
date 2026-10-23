import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

let client: SupabaseClient | undefined;

/**
 * Privilegirani klijent (service role / secret key). ZAOBILAZI RLS.
 * Koristi se SAMO na serveru i SAMO za:
 *  - upis upita kupaca preko funkcije submit_inquiry (s ograničenjem učestalosti),
 *  - stvaranje/brisanje korisničkih računa administratora (Auth Admin API).
 * Pozivatelj mora prije poziva provjeriti ovlasti.
 */
export function serviceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Nedostaje SUPABASE_SECRET_KEY (server). Pogledajte README → Varijable okruženja.");
  }
  if (!client) {
    client = createClient(publicEnv().NEXT_PUBLIC_SUPABASE_URL, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}

export function hasServiceKey(): boolean {
  return Boolean(process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY);
}

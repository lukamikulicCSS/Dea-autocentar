import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";

/**
 * Klijent vezan uz sesiju prijavljenog korisnika (kolačići).
 * Koristi se za administraciju; sve ovlasti provjerava RLS u bazi.
 */
export async function sessionClient() {
  const env = publicEnv();
  const cookieStore = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Pozvano iz Server Componenta gdje se kolačići ne mogu postaviti.
          // Sesiju osvježava proxy.ts pa je ovo sigurno zanemariti.
        }
      },
    },
  });
}

import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { sessionClient } from "@/lib/supabase/server";

export type AdminContext = {
  supabase: Awaited<ReturnType<typeof sessionClient>>;
  userId: string;
  email: string;
};

/**
 * Provjera na serveru: korisnik ima valjanu sesiju (JWT provjeren preko getClaims)
 * I postoji u tablici admins. Nikad se ne oslanja na skrivanje sučelja.
 *
 * React `cache` osigurava da se provjera izvrši JEDNOM po zahtjevu, iako je
 * pozivaju i layout administracije i sama stranica (inače 2× getClaims + 2× is_admin
 * prema bazi u Parizu za svako otvaranje stranice).
 */
const resolveAdmin = cache(async (): Promise<AdminContext | "anonymous" | "forbidden"> => {
  const supabase = await sessionClient();
  const { data, error } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (error || !sub) return "anonymous";

  const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");
  if (rpcError || isAdmin !== true) return "forbidden";

  return { supabase, userId: sub, email: String(data.claims.email ?? "") };
});

/** Za stranice administracije: preusmjerava na prijavu ako nema pristupa. */
export async function requireAdmin(nextPath = "/admin"): Promise<AdminContext> {
  const result = await resolveAdmin();
  if (result === "anonymous") redirect(`/admin/prijava?next=${encodeURIComponent(nextPath)}`);
  if (result === "forbidden") redirect("/admin/prijava?greska=pristup");
  return result;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Nemate ovlasti za ovu radnju. Prijavite se ponovno.");
    this.name = "UnauthorizedError";
  }
}

/** Za Server Actions i Route Handlere: baca grešku umjesto preusmjeravanja. */
export async function assertAdmin(): Promise<AdminContext> {
  const result = await resolveAdmin();
  if (result === "anonymous" || result === "forbidden") throw new UnauthorizedError();
  return result;
}

export { safeAdminRedirect } from "@/lib/auth-redirect";

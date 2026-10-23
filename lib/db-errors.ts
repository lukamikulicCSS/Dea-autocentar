import { UnauthorizedError } from "@/lib/auth";

type PgError = { code?: string; message?: string; details?: string | null } | null | undefined;

/** Pretvara grešku baze u razumljivu poruku za administratora (bez tehničkih detalja). */
export function friendlyDbError(error: PgError, fallback = "Spremanje nije uspjelo. Pokušajte ponovno."): string {
  if (!error) return fallback;
  switch (error.code) {
    case "P0001": // naše poslovne poruke iz okidača (već na hrvatskom)
      return error.message && error.message.length < 200 ? error.message : fallback;
    case "23505":
      return "Zapis s tim podacima već postoji.";
    case "23514":
      return "Neka polja imaju neispravnu vrijednost. Provjerite unos.";
    case "23503":
      return "Povezani zapis ne postoji ili je obrisan. Osvježite stranicu.";
    case "42501":
      return "Nemate ovlasti za ovu radnju.";
    case "PGRST116":
      return "Zapis nije pronađen. Možda je obrisan.";
    default:
      return fallback;
  }
}

export function actionError(e: unknown, fallback?: string): string {
  if (e instanceof UnauthorizedError) return e.message;
  return fallback ?? "Došlo je do neočekivane greške. Pokušajte ponovno.";
}

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string>; values?: Record<string, string> };

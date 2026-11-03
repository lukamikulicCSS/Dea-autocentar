import { z } from "zod";

/**
 * Javne varijable okruženja (dostupne i u pregledniku).
 * Next.js ugrađuje NEXT_PUBLIC_* vrijednosti pri buildu, pa ih čitamo izravno.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ message: "NEXT_PUBLIC_SUPABASE_URL mora biti ispravan URL" }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20, "Nedostaje NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(10).optional(),
});

function readPublicEnv() {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined,
  });
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `- ${i.message}`).join("\n");
    throw new Error(`Neispravne varijable okruženja:\n${issues}\nPogledajte .env.example i README.`);
  }
  return parsed.data;
}

let cached: z.infer<typeof publicSchema> | undefined;
export function publicEnv() {
  cached ??= readPublicEnv();
  return cached;
}

/** Kanonski URL stranice bez završne kose crte. */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  // NEXT_PUBLIC_SITE_URL je obavezan u produkciji (ugrađuje se pri buildu) — bez njega
  // bi kanonske adrese i sitemap pokazivali na localhost.
  return "http://localhost:3000";
}

/**
 * Indeksiranje je dopušteno samo kad je to izričito uključeno (produkcijska domena).
 * Tako testne adrese (npr. *.workers.dev) nikad ne završe u Googleu.
 */
export function indexingAllowed(): boolean {
  return process.env.ALLOW_INDEXING === "true";
}

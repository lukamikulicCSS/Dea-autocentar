/**
 * Privola za kolačiće i vanjske sadržaje — čista logika (bez Reacta i bez
 * pristupa pregledniku), da bi se mogla testirati.
 *
 * Kategorije:
 *  - nužni (uvijek uključeni, ne traže privolu): pamćenje ovog izbora,
 *    prijava djelatnika u administraciju;
 *  - external: Google karta. Učitava se na osnovu legitimnog interesa, pa
 *    vrijedi: bez odluke ili true → prikazana; false → posjetitelj ju je
 *    isključio (prigovor, čl. 23. ZZLP) i više se ne učitava.
 *
 * Stranica NE koristi analitiku ni oglasne kolačiće. Ako se ikad doda nova
 * kategorija ili nova vanjska usluga, povećajte CONSENT_VERSION — svi
 * posjetitelji tada ponovo dobiju pitanje (stara privola ne pokriva novu svrhu).
 */
export const CONSENT_COOKIE = "dea_privola";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_SECONDS = 180 * 24 * 60 * 60; // 180 dana (vidi RETENTION.consentDays)
/** Događaj kojim bilo koji gumb (npr. u podnožju) otvara postavke kolačića. */
export const OPEN_CONSENT_EVENT = "dea:postavke-kolacica";

export type ConsentChoice = {
  /** Verzija pravila na koju se privola odnosi. */
  v: number;
  /** Google karta: false = posjetitelj ju je isključio. */
  external: boolean;
  /** Trenutak odluke (ISO), radi dokazivosti (čl. 9. st. 1. ZZLP). */
  at: string;
};

export function makeChoice(external: boolean, now: Date = new Date()): ConsentChoice {
  return { v: CONSENT_VERSION, external, at: now.toISOString() };
}

export function serializeConsent(choice: ConsentChoice): string {
  return encodeURIComponent(`${choice.v}.${choice.external ? 1 : 0}.${choice.at}`);
}

/**
 * Vraća valjanu privolu ili null (nema odluke, oštećena vrijednost ili
 * zastarjela verzija → posjetitelja treba ponovo pitati).
 */
export function parseConsent(raw: string | null | undefined): ConsentChoice | null {
  if (!raw) return null;
  let value: string;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const m = /^(\d{1,4})\.([01])\.(\d{4}-\d{2}-\d{2}T[\d:.]+Z)$/.exec(value);
  if (!m) return null;
  const v = Number(m[1]);
  if (v !== CONSENT_VERSION) return null;
  if (Number.isNaN(Date.parse(m[3]!))) return null;
  return { v, external: m[2] === "1", at: m[3]! };
}

/** Izvlači vrijednost kolačića privole iz `document.cookie`. */
export function readConsentFromCookieString(cookieString: string): ConsentChoice | null {
  for (const part of cookieString.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === CONSENT_COOKIE) return parseConsent(rest.join("="));
  }
  return null;
}

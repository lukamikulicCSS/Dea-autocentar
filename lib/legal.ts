/**
 * Pravni podaci i rokovi — JEDNO mjesto za sve pravne tekstove stranice
 * (/privatnost, /uvjeti-koristenja, podnožje, obavijest uz obrazac za upit).
 *
 * ⚠️ PRIJE OBJAVE: vlasnik (investitor) upisuje podatke iz rješenja o
 * registraciji pravnog lica. Dok su polja prazna, stranice prikazuju naziv i
 * adresu iz Postavki, a ID broj i registar se izostavljaju.
 *
 * Kad se bilo što ovdje promijeni na način koji utječe na posjetitelje
 * (nova usluga, novi kolačić, novi rok), povećajte POLICY.version i ažurirajte
 * POLICY.effectiveDate. Ako se dodaje nova kategorija kolačića, povećajte i
 * CONSENT_VERSION u lib/consent.ts kako bi se privola ponovo zatražila.
 */
export const LEGAL = {
  /** Puni naziv pravnog lica iz rješenja o registraciji, npr. „DEA d.o.o. Zenica“. */
  companyName: "",
  /** Identifikacioni broj (ID broj / JIB, 13 znamenki). */
  idNumber: "",
  /** Registarski sud i broj upisa, npr. „Općinski sud u Zenici, MBS 43-01-0000-00“. */
  registry: "",
  /** Email za pitanja o zaštiti podataka. Prazno → koristi se email iz Postavki. */
  privacyEmail: "",
  /** Stvarno nadležni sud za sporove iz uvjeta korištenja. */
  court: "nadležni sud u Zenici",
} as const;

export const POLICY = {
  version: "1.0",
  /** Datum od kojeg vrijedi trenutna verzija pravnih tekstova. */
  effectiveDate: "2. 11. 2026.",
} as const;

/** Rokovi čuvanja — moraju se podudarati s migracijom 20261102100000_privacy_retention.sql. */
export const RETENTION = {
  inquiryMonths: 24,
  ipHashDays: 30,
  consentDays: 180,
} as const;

/** Nadzorni organ (čl. 14. st. 4. i čl. 15. st. 2. t. d) ZZLP BiH). */
export const AUTHORITY = {
  name: "Agencija za zaštitu ličnih podataka u Bosni i Hercegovini",
  url: "https://www.azlp.ba",
} as const;

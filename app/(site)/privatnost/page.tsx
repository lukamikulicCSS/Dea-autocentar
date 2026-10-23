import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { getSiteSettings } from "@/lib/vehicles/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Privatnost i kolačići",
  description: "Kako Auto Centar DEA postupa s podacima iz upita i koje kolačiće koristi web stranica.",
  alternates: { canonical: "/privatnost" },
};

/**
 * NAPOMENA: tekst opisuje stvarno ponašanje aplikacije. Prije objave neka ga
 * pregleda vlasnik/pravni savjetnik i dopuni podatke o pravnoj osobi.
 */
export default async function PrivacyPage() {
  const s = await getSiteSettings();
  return (
    <>
      <PageHeader title="Privatnost i kolačići" crumbs={[{ name: "Početna", href: "/" }, { name: "Privatnost" }]} />
      <div className="wrap max-w-3xl space-y-8 py-14 text-[1.0625rem] leading-relaxed [&_h2]:mb-3 [&_h2]:text-xl">
        <section>
          <h2>Koje podatke prikupljamo</h2>
          <p>
            Kad pošaljete upit preko web stranice, spremamo vašu email adresu, poruku koju napišete (ako je napišete), vozilo
            na koje se upit odnosi i vrijeme slanja. Ne tražimo ime, adresu ni broj telefona.
          </p>
          <p className="mt-3">
            Radi zaštite od zlouporabe (slanja velikog broja upita) spremamo i jednosmjerni sažetak (hash) vaše IP adrese.
            Iz sažetka se IP adresa ne može izravno očitati.
          </p>
        </section>
        <section>
          <h2>Zašto ih koristimo</h2>
          <p>Podatke koristimo isključivo kako bismo odgovorili na vaš upit. Ne prodajemo ih i ne koristimo ih za oglašavanje.</p>
        </section>
        <section>
          <h2>Gdje se podaci čuvaju</h2>
          <p>
            Podaci se čuvaju u bazi podataka pružatelja usluge Supabase, a stranica se poslužuje preko pružatelja usluge
            hostinga. Pristup upitima imaju samo ovlaštene osobe salona.
          </p>
        </section>
        <section>
          <h2>Kolačići</h2>
          <p>
            Javni dio stranice ne koristi kolačiće za praćenje ni analitiku i ne učitava oglasne skripte. Kolačići se koriste
            samo za prijavu djelatnika u administraciju.
          </p>
        </section>
        <section>
          <h2>Vaša prava</h2>
          <p>
            Možete zatražiti uvid u svoje podatke ili njihovo brisanje
            {s.email ? (
              <>
                {" "}slanjem poruke na <a className="underline underline-offset-2" href={`mailto:${s.email}`}>{s.email}</a>
              </>
            ) : null}
            .
          </p>
        </section>
      </div>
    </>
  );
}

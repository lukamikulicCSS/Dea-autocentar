"use client";

import { saveConsent, useConsent } from "./consent/useConsent";

/**
 * Karta s lokacijom salona (Google Maps embed, bez API ključa).
 *
 * Pravni model: legitimni interes (čl. 8. st. 1. t. f) ZZLP BiH) — pokazati
 * posjetiteljima gdje je salon. Ograničenja koja taj interes čine razmjernim:
 *  - karta se učitava tek kad dođe u vidno polje (loading="lazy");
 *  - posjetitelj je u svakom trenutku može isključiti (pravo na prigovor, čl. 23.):
 *    „Isključi kartu“ u obavijesti ili „Postavke kolačića“ u podnožju;
 *  - nakon isključenja Google se više ne učitava dok ga posjetitelj sam ne uključi.
 *
 * Do hidracije se ne učitava ništa, kako se karta ne bi pokrenula prije nego
 * što se pročita eventualno isključenje.
 */
export function LocationMap({ query, label, href, dark }: { query: string; label: string; href: string | null; dark: boolean }) {
  const consent = useConsent(); // undefined = još nepoznato, null = bez odluke, objekt = odluka
  const off = consent?.external === false;
  const link = dark ? "text-fog hover:text-white" : "text-ink-muted hover:text-ink";

  return (
    <div className="mt-3">
      <div className={`relative aspect-[16/9] w-full max-w-[28rem] overflow-hidden rounded-sm border ${dark ? "border-line-dark bg-graphite" : "border-line bg-surface"}`}>
        {consent !== undefined && !off && (
          <iframe
            src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`}
            title={`Karta: ${label}`}
            className="absolute inset-0 size-full border-0"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        )}
        {off && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <p className={`text-[0.8125rem] ${dark ? "text-fog" : "text-ink-muted"}`}>Google karta je isključena prema vašem izboru.</p>
            <button type="button" onClick={() => saveConsent(true)} className={`btn btn-sm ${dark ? "btn-outline-dark" : "btn-outline"}`}>
              Uključi kartu
            </button>
          </div>
        )}
      </div>
      <p className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm ${link}`}>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-1 underline-offset-4">
            Otvori u Google Kartama
          </a>
        )}
        <a href="/privatnost#kolacici" className="text-[0.8125rem] opacity-80 hover:opacity-100">
          Karta: Google · privatnost
        </a>
      </p>
    </div>
  );
}

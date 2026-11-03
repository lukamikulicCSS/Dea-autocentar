"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { OPEN_CONSENT_EVENT } from "@/lib/consent";
import { saveConsent, useConsent } from "./useConsent";

/**
 * Obavijest o kolačićima (transparentnost, čl. 15. ZZLP BiH) i mogućnost
 * isključivanja Google karte (prigovor na obradu na osnovu legitimnog
 * interesa, čl. 23.):
 *  - „Isključi kartu“ i „U redu“ jednako su vidljivi i jednako laki;
 *  - izbor se u svakom trenutku mijenja preko „Postavke kolačića“ u podnožju;
 *  - odluka se pamti 180 dana, nakon čega se obavijest ponovo prikazuje.
 */
const BTN = "btn btn-sm btn-outline-dark";
const CHECK = "mt-1 size-4 shrink-0 accent-[var(--color-red)]";

export function ConsentBanner() {
  const consent = useConsent();
  const [reopened, setReopened] = useState(false);
  const [details, setDetails] = useState(false);
  const [external, setExternal] = useState(true);
  const consentRef = useRef(consent);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();

  useEffect(() => {
    consentRef.current = consent;
  }, [consent]);

  // „Postavke kolačića“ iz podnožja: otvori s trenutnim stanjem (bez odluke = karta uključena)
  useEffect(() => {
    const open = () => {
      setExternal(consentRef.current?.external !== false);
      setDetails(true);
      setReopened(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, []);

  // Ponovo otvoreno: fokus na naslov, Esc zatvara bez promjene
  useEffect(() => {
    if (!reopened) return;
    headingRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setReopened(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reopened]);

  // undefined = još nepoznato (server/hidracija); objekt = odluka postoji
  if (consent === undefined || (consent !== null && !reopened)) return null;

  const decide = (value: boolean) => {
    saveConsent(value);
    setReopened(false);
    setDetails(false);
  };

  return (
    <section
      role={reopened ? "dialog" : "region"}
      aria-labelledby={titleId}
      className="fixed inset-x-0 z-50 px-3 pb-3 sm:px-5 sm:pb-5"
      style={{ bottom: "var(--bottom-nav-h)" }}
    >
      <div className="ml-auto max-w-[34rem] rounded-md border border-line-dark bg-asphalt p-5 text-fog shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} ref={headingRef} tabIndex={-1} className="text-base font-semibold text-white outline-none" style={{ fontStretch: "100%" }}>
            Kolačići i Google karta
          </h2>
          {reopened && (
            <button type="button" onClick={() => setReopened(false)} className="-m-2 p-2 hover:text-white" aria-label="Zatvori postavke">
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <p className="mt-2 text-[0.875rem] leading-relaxed">
          Koristimo samo kolačiće nužne za rad stranice, bez analitike i oglašavanja. Za lakši dolazak do salona
          prikazujemo Google kartu, pri čemu Google može postaviti vlastite kolačiće. Kartu možete isključiti.{" "}
          <Link href="/privatnost#kolacici" className="underline underline-offset-2 hover:text-white">
            Više
          </Link>
        </p>

        {details && (
          <fieldset className="mt-4 space-y-3 border-t border-line-dark pt-4 text-[0.875rem]">
            <legend className="sr-only">Postavke</legend>
            <label className="flex gap-3">
              <input type="checkbox" checked disabled className={CHECK} />
              <span>
                <span className="font-semibold text-white">Nužni</span> — pamte vaš izbor i omogućuju prijavu djelatnika.
                Uvijek uključeni.
              </span>
            </label>
            <label className="flex cursor-pointer gap-3">
              <input type="checkbox" checked={external} onChange={(e) => setExternal(e.target.checked)} className={CHECK} />
              <span>
                <span className="font-semibold text-white">Google karta</span> — lokacija salona (Google Ireland Ltd. /
                Google LLC).
              </span>
            </label>
          </fieldset>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          {details ? (
            <>
              <button type="button" className={BTN} onClick={() => {
                  setReopened(false);
                  setDetails(false);
                }}>
                Odustani
              </button>
              <button type="button" className={BTN} onClick={() => decide(external)}>
                Spremi izbor
              </button>
            </>
          ) : (
            <>
              <button type="button" className={BTN} onClick={() => decide(false)}>
                Isključi kartu
              </button>
              <button type="button" className={BTN} onClick={() => decide(true)}>
                U redu
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { FileCheck, Phone, Repeat, Search, ShieldCheck, Route } from "lucide-react";
import { ContactDetails } from "@/components/site/ContactDetails";
import { InquiryForm } from "@/components/site/InquiryForm";
import { EditorialCard } from "@/components/site/Listing";
import { SectionHeading } from "@/components/site/SectionHeading";
import { VehicleCard, VehicleGrid } from "@/components/site/VehicleCard";
import { HIGHLIGHTS } from "@/lib/content";
import { phoneHref } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/vehicles/constants";
import { getHomeSections, getSiteSettings, mainListingStatuses } from "@/lib/vehicles/queries";
import { SearchSuggest } from "@/components/site/SearchSuggest";

export const revalidate = 300;

const HIGHLIGHT_ICONS = { shield: ShieldCheck, steering: Route, repeat: Repeat, file: FileCheck } as const;

export default async function HomePage() {
  const settings = await getSiteSettings();
  const { premium, latest, comingSoon, reserved, sold } = await getHomeSections(settings);
  const [leadPremium, ...otherPremium] = premium;
  const heroTitle = settings.hero_title ?? "Provjerena vozila u srcu Zenice";
  const heroSubtitle =
    settings.hero_subtitle ??
    "Svako vozilo iz naše ponude prije oglašavanja prolazi detaljan pregled. Pogledajte ponudu ili nas nazovite.";
  const nothingYet = premium.length + latest.length + comingSoon.length === 0;

  return (
    <>
      {/* HERO — pravi salon DEA, jedini orkestrirani pokret na stranici */}
      <section className="relative isolate overflow-hidden bg-asphalt text-white" aria-labelledby="hero-naslov">
        <div className="absolute inset-0 -z-10 lg:left-[42%]">
          {/* Fotografija + dva animirana sloja iste veličine (uvijek se poklapaju s autom) */}
          <div className="hero-image absolute inset-0">
            <Image
              src="/images/hero-porsche-911.jpg"
              alt="Porsche 911 obasjan svjetlosnim tragovima"
              fill
              priority
              fetchPriority="high"
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover object-[65%_50%] lg:object-[40%_55%]"
            />
            <Image
              src="/images/hero-porsche-911-tragovi.jpg"
              alt=""
              aria-hidden="true"
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="hero-streaks object-cover object-[65%_50%] lg:object-[40%_55%]"
            />
            <Image
              src="/images/hero-porsche-911-svjetla.jpg"
              alt=""
              aria-hidden="true"
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="hero-lights object-cover object-[65%_50%] lg:object-[40%_55%]"
            />
          </div>
          {/* Gradijent za čitljivost teksta preko fotografije */}
          <div className="absolute inset-0 bg-gradient-to-t from-asphalt via-asphalt/70 to-asphalt/10 lg:bg-gradient-to-r lg:from-asphalt lg:via-asphalt/25 lg:to-transparent" />
        </div>

        <div className="wrap flex min-h-[78svh] flex-col justify-end pb-10 pt-40 lg:min-h-[640px] lg:justify-center lg:py-24">
          <div className="hero-text max-w-xl">
            <span aria-hidden="true" className="hero-slash mb-6 block h-1 w-16 -skew-x-[28deg] bg-red" />
            <h1 id="hero-naslov" className="text-[2.5rem] leading-[1.02] sm:text-[3.25rem] lg:text-[3.75rem]" style={{ fontStretch: "125%" }}>
              {heroTitle}
            </h1>
            <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-[#d4d7da]">{heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/vozila" className="btn btn-primary">
                Pogledaj vozila
              </Link>
              {settings.phone && (
                <a href={phoneHref(settings.phone)} className="btn btn-outline-dark bg-asphalt/40">
                  <Phone className="size-4" aria-hidden="true" />
                  <span className="tabular">{settings.phone}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* BRZA PRETRAGA — radi i bez JavaScripta (GET na /vozila) */}
      <section aria-label="Pretraga vozila" className="border-b border-line-dark bg-graphite">
        <form action="/vozila" method="get" className="wrap grid gap-3 py-5 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="hs-q" className="label text-fog">Marka ili model</label>
            <SearchSuggest
              id="hs-q"
              placeholder="npr. BMW, Golf, X5"
              tone="dark"
              scope={{ statuses: mainListingStatuses(settings) }}
              className="field border-line-dark bg-asphalt text-white placeholder:text-[#7d838a] focus:border-white focus:shadow-[0_0_0_1px_#fff]"
            />
          </div>
          <div>
            <label htmlFor="hs-kat" className="label text-fog">Kategorija</label>
            <select id="hs-kat" name="kategorija" className="field border-line-dark bg-asphalt bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%228%22%20fill=%22none%22%3E%3Cpath%20stroke=%22%23A6ACB3%22%20stroke-width=%221.6%22%20d=%22m1%201.5%205%205%205-5%22/%3E%3C/svg%3E')] text-white">
              <option value="">Sve</option>
              <option value="premium">{CATEGORY_LABELS.premium}</option>
              <option value="standard">{CATEGORY_LABELS.standard}</option>
            </select>
          </div>
          <div>
            <label htmlFor="hs-cijena" className="label text-fog">Cijena do (KM)</label>
            <input id="hs-cijena" name="cijenaDo" inputMode="numeric" pattern="[0-9]*" placeholder="npr. 40000" className="field tabular border-line-dark bg-asphalt text-white placeholder:text-[#7d838a] focus:border-white focus:shadow-[0_0_0_1px_#fff]" />
          </div>
          <button type="submit" className="btn btn-primary sm:px-7">
            <Search className="size-4" aria-hidden="true" />
            Traži
          </button>
        </form>
      </section>

      {nothingYet && (
        <section className="wrap py-16">
          <div className="rounded-sm border border-dashed border-line bg-surface p-8 text-center">
            <h2 className="text-2xl">Ponuda se upravo osvježava</h2>
            <p className="mx-auto mt-3 max-w-md text-ink-muted">
              Nova vozila uskoro će biti objavljena. Javite nam se i rado ćemo vam reći što je trenutno u salonu.
            </p>
          </div>
        </section>
      )}

      {/* PREMIUM */}
      {leadPremium && (
        <section className="wrap py-16 sm:py-20" aria-labelledby="premium-naslov">
          <div id="premium-naslov">
            <SectionHeading
              title="Premium vozila"
              description="Izdvojena ponuda s detaljnim opisom i bogatom fotogalerijom."
              href="/premium"
              linkLabel="Sva premium vozila"
            />
          </div>
          <EditorialCard vehicle={leadPremium} />
          {otherPremium.length > 0 && (
            <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2">
              {otherPremium.map((v) => (
                <li key={v.id}>
                  <VehicleCard vehicle={v} sizes="(min-width: 640px) 50vw, 100vw" />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* NAJNOVIJE */}
      {latest.length > 0 && (
        <section className={`wrap pb-16 sm:pb-20 ${leadPremium ? "" : "pt-16 sm:pt-20"}`} aria-label="Najnovija vozila u ponudi">
          <SectionHeading
            title="Najnovije u ponudi"
            description="Dostupna vozila spremna za probnu vožnju."
            href="/vozila"
            linkLabel="Pogledaj sva vozila"
          />
          <VehicleGrid vehicles={latest} />
        </section>
      )}

      {/* U DOLASKU */}
      {comingSoon.length > 0 && (
        <section className="bg-asphalt py-16 sm:py-20" aria-label="Vozila u dolasku">
          <div className="wrap">
            <SectionHeading
              tone="dark"
              title="Uskoro u salonu"
              description="Vozila na putu prema Zenici. Datumi dolaska su okvirni — pošaljite upit i javit ćemo vam čim stigne."
              href="/u-dolasku"
              linkLabel="Sva vozila u dolasku"
            />
            <VehicleGrid vehicles={comingSoon} tone="dark" />
          </div>
        </section>
      )}

      {/* REZERVIRANO (kad je tako odabrano u postavkama) */}
      {reserved.length > 0 && (
        <section className="wrap py-16 sm:py-20" aria-label="Rezervirana vozila">
          <SectionHeading title="Rezervirano" description="Za ova vozila trenutno postoji rezervacija." href="/rezervirano" linkLabel="Sva rezervirana" />
          <VehicleGrid vehicles={reserved} />
        </section>
      )}

      {/* ZAŠTO DEA — samo tvrdnje koje salon sam navodi */}
      <section className="border-y border-line bg-surface" aria-labelledby="zasto-naslov">
        <div className="wrap grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm sm:aspect-square lg:aspect-auto lg:min-h-[480px]">
            <Image
              src="/images/salon-dea-vanjski.jpg"
              alt="Ferrari ispred salona Auto Centra DEA u Zenici"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover object-[50%_42%]"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span aria-hidden="true" className="mb-4 block h-[3px] w-10 -skew-x-[28deg] bg-red" />
            <h2 id="zasto-naslov" className="text-[1.75rem] sm:text-[2.125rem]">Kupnja bez nagađanja</h2>
            <p className="mt-3 max-w-lg text-[1.0625rem] text-ink-muted">
              {settings.business_name} vozila prodaje onako kako biste ih i sami htjeli kupiti: pregledana, isprobana i s jasnim papirima.
            </p>
            <dl className="mt-10 divide-y divide-line border-y border-line">
              {HIGHLIGHTS.map((h) => {
                const Icon = HIGHLIGHT_ICONS[h.icon];
                return (
                  <div key={h.title} className="flex gap-4 py-5">
                    <Icon className="mt-0.5 size-5 shrink-0 text-steel" strokeWidth={1.8} aria-hidden="true" />
                    <div>
                      <dt className="font-semibold">{h.title}</dt>
                      <dd className="mt-1 text-[0.9375rem] text-ink-muted">{h.text}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>
            <Link href="/o-nama" className="mt-8 self-start text-[0.9375rem] font-semibold underline decoration-red decoration-2 underline-offset-[6px]">
              Više o salonu
            </Link>
          </div>
        </div>
      </section>

      {/* NEDAVNO PRODANO — diskretno, radi vjerodostojnosti */}
      {sold.length > 0 && (
        <section className="wrap py-16" aria-label="Nedavno prodana vozila">
          <SectionHeading title="Nedavno prodano" href="/prodana-vozila" linkLabel="Arhiva prodanih vozila" />
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {sold.map((v) => (
              <li key={v.id}>
                <VehicleCard vehicle={v} sizes="(min-width: 1024px) 25vw, 50vw" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* KONTAKT + UPIT */}
      <section className="bg-asphalt text-white" aria-labelledby="kontakt-naslov">
        <div className="wrap grid gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-20">
          <div>
            <span aria-hidden="true" className="mb-4 block h-[3px] w-10 -skew-x-[28deg] bg-red" />
            <h2 id="kontakt-naslov" className="text-[1.75rem] sm:text-[2.125rem]">Posjetite nas ili pošaljite upit</h2>
            <div className="mt-8">
              <ContactDetails settings={settings} />
            </div>
          </div>
          <div className="rounded-sm border border-line-dark bg-graphite p-6 sm:p-8">
            <h3 className="text-xl" style={{ fontStretch: "110%" }}>Tražite određeno vozilo?</h3>
            <p className="mb-6 mt-2 text-[0.9375rem] text-fog">Ostavite email i napišite što vas zanima. Javit ćemo vam se.</p>
            <InquiryForm tone="dark" />
          </div>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FileCheck, MapPin, Repeat, Route, ShieldCheck } from "lucide-react";
import { fullAddress } from "@/lib/contact";
import { JsonLd } from "@/components/site/JsonLd";
import { PageHeader } from "@/components/site/PageHeader";
import { HIGHLIGHTS } from "@/lib/content";
import { breadcrumbJsonLd } from "@/lib/seo";
import { getSiteSettings } from "@/lib/vehicles/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "O nama",
  description: "Auto Centar DEA u Zenici: provjerena vozila, probna vožnja, zamjena uz besplatnu procjenu te osiguranje i registracija na jednom mjestu.",
  alternates: { canonical: "/o-nama" },
};

const ICONS = { shield: ShieldCheck, steering: Route, repeat: Repeat, file: FileCheck } as const;

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const address = fullAddress(settings);
  const paragraphs = (settings.about_text ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Početna", path: "/" }, { name: "O nama", path: "/o-nama" }])} />
      <PageHeader title={`O salonu ${settings.business_name}`} crumbs={[{ name: "Početna", href: "/" }, { name: "O nama" }]} />

      {/*
        Uravnotežen raspored: tekst s naslovom lijevo, fotografija u formatu 5:4 desno.
        Fotografija je izrezana na 5:4 s fokusom na vozilo, pa je visinom usklađena s tekstom
        umjesto da dominira stranicom.
      */}
      <section className="wrap grid items-center gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16 lg:py-24">
        <div className="max-w-[36rem]">
          <span className="block h-[3px] w-10 -skew-x-[28deg] bg-red" aria-hidden="true" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-ink-muted">O nama</p>
          <h2 className="mt-2 text-[clamp(1.75rem,1.35rem+1.6vw,2.5rem)] leading-[1.08]">
            Provjerena vozila i sve usluge na jednom mjestu
          </h2>
          <div className="mt-6 space-y-4 text-[1.0625rem] leading-relaxed text-ink-muted">
            {paragraphs.length > 0 ? (
              paragraphs.map((p) => <p key={p.slice(0, 32)}>{p}</p>)
            ) : (
              <p>Opis salona bit će uskoro dodan.</p>
            )}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/vozila" className="btn btn-primary">Pogledaj vozila</Link>
            <Link href="/kontakt" className="btn btn-outline">Kontakt i lokacija</Link>
          </div>
        </div>

        <figure className="relative">
          <div className="relative aspect-[5/4] overflow-hidden rounded-sm bg-line shadow-[0_1.5rem_3rem_-1.5rem_rgb(0_0_0/0.45)]">
            <Image
              src="/images/ferrari-roma-o-nama.jpg"
              alt="Ferrari Roma u izložbenom prostoru Auto Centra DEA"
              fill
              sizes="(min-width: 1280px) 40rem, (min-width: 1024px) 52vw, 100vw"
              className="object-cover object-[50%_75%]"
            />
          </div>
          {address && (
            <figcaption className="absolute left-3 top-3 flex items-center gap-2 max-w-[calc(100%-1.5rem)] rounded-sm bg-asphalt/85 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm sm:left-4 sm:top-4">
              <MapPin className="size-3.5 text-red" aria-hidden="true" />
              <span className="hidden sm:inline">Izložbeni prostor · </span>
              {address}
            </figcaption>
          )}
        </figure>
      </section>

      <section className="border-t border-line bg-surface" aria-labelledby="usluge">
        <div className="wrap py-14 lg:py-20">
          <h2 id="usluge" className="text-[clamp(1.625rem,1.3rem+1.3vw,2.125rem)]">Što dobivate kod nas</h2>
          <dl className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {HIGHLIGHTS.map((h) => {
              const Icon = ICONS[h.icon];
              return (
                <div key={h.title} className="flex gap-4 border-t border-line pt-6">
                  <Icon className="mt-0.5 size-6 shrink-0 text-steel" strokeWidth={1.7} aria-hidden="true" />
                  <div>
                    <dt className="text-lg font-semibold">{h.title}</dt>
                    <dd className="mt-1.5 text-ink-muted">{h.text}</dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </div>
      </section>
    </>
  );
}
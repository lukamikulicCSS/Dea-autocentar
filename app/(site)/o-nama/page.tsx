import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FileCheck, Repeat, Route, ShieldCheck } from "lucide-react";
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
  const paragraphs = (settings.about_text ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Početna", path: "/" }, { name: "O nama", path: "/o-nama" }])} />
      <PageHeader title={`O salonu ${settings.business_name}`} crumbs={[{ name: "Početna", href: "/" }, { name: "O nama" }]} />

      <section className="wrap grid gap-10 py-14 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-20">
        <div className="max-w-[64ch] space-y-5 text-[1.0625rem] leading-relaxed">
          {paragraphs.length > 0 ? (
            paragraphs.map((p) => <p key={p.slice(0, 32)}>{p}</p>)
          ) : (
            <p className="text-ink-muted">Opis salona bit će uskoro dodan.</p>
          )}
          <div className="flex flex-wrap gap-3 pt-4">
            <Link href="/vozila" className="btn btn-primary">Pogledaj vozila</Link>
            <Link href="/kontakt" className="btn btn-outline">Kontakt i lokacija</Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative col-span-2 aspect-[16/11] overflow-hidden rounded-sm">
            <Image src="/images/salon-ferrari-roma.jpg" alt="Izložbeni prostor Auto Centra DEA" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover object-[50%_35%]" />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-sm">
            <Image src="/images/audi-r8-interijer.jpg" alt="Detalj unutrašnjosti vozila u salonu" fill sizes="(min-width: 1024px) 22vw, 50vw" className="object-cover" />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-sm">
            <Image src="/images/ferrari-roma-straznja.jpg" alt="Vozilo izloženo u salonu DEA s pogledom na ulicu" fill sizes="(min-width: 1024px) 22vw, 50vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-surface" aria-labelledby="usluge">
        <div className="wrap py-14 lg:py-20">
          <h2 id="usluge" className="text-[1.75rem] sm:text-[2.125rem]">Što dobivate kod nas</h2>
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

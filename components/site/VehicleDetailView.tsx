import Link from "next/link";
import { CalendarClock, Check, ChevronRight, Phone, Send } from "lucide-react";
import { Gallery } from "@/components/site/Gallery";
import { InquiryForm } from "@/components/site/InquiryForm";
import { ShareButton } from "@/components/site/ShareButton";
import { StatusBadge } from "@/components/site/StatusBadge";
import { VehicleGrid } from "@/components/site/VehicleCard";
import { formatArrival, formatCc, formatKm, formatPower, formatPrice, phoneHref } from "@/lib/format";
import { vehicleAlt, vehicleImageUrl } from "@/lib/images";
import type { SiteSettings, VehicleCard, VehicleDetail } from "@/lib/types";
import {
  BODY_LABELS,
  CATEGORY_LABELS,
  DRIVETRAIN_LABELS,
  FUEL_LABELS,
  TRANSMISSION_LABELS,
} from "@/lib/vehicles/constants";

function SpecRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null; // nepoznate podatke ne prikazujemo (bez lažnih zamjena)
  return (
    <div className="flex justify-between gap-6 border-b border-line py-3 text-[0.9375rem]">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="tabular text-right font-semibold">{value}</dd>
    </div>
  );
}

/** Prikaz vozila — koristi ga javna stranica i administratorski pregled prije objave. */
export function VehicleDetailView({
  vehicle: v,
  settings,
  related,
  shareUrl,
}: {
  vehicle: VehicleDetail;
  settings: SiteSettings;
  related: VehicleCard[];
  shareUrl: string;
}) {
  const images = v.vehicle_images.map((img, i) => ({
    src: vehicleImageUrl(img.storage_path),
    alt: vehicleAlt(v, img, i),
    width: img.width,
    height: img.height,
  }));
  const sold = v.status === "sold";
  const canInquire = v.status === "available" || v.status === "coming_soon" || v.status === "reserved";
  const arrival = v.status === "coming_soon" ? formatArrival(v) : null;
  const defaultMessage = `Zanima me ${v.title} (${v.year}.). Je li vozilo još dostupno?`;

  const keySpecs = [
    { label: "Godina", value: `${v.year}.` },
    { label: "Kilometraža", value: formatKm(v.mileage_km) },
    v.power_kw ? { label: "Snaga", value: formatPower(v.power_kw) } : { label: "Gorivo", value: FUEL_LABELS[v.fuel_type] },
    { label: "Mjenjač", value: TRANSMISSION_LABELS[v.transmission] },
  ];

  return (
    <article>
      <div className="wrap pt-5">
        <nav aria-label="Putanja">
          <ol className="flex flex-wrap items-center gap-1 text-[0.8125rem] text-ink-muted">
            <li><Link href="/" className="hover:text-ink">Početna</Link></li>
            <li className="flex items-center gap-1">
              <ChevronRight className="size-3.5" aria-hidden="true" />
              <Link href={v.category === "premium" ? "/premium" : "/vozila"} className="hover:text-ink">
                {v.category === "premium" ? "Premium vozila" : "Vozila"}
              </Link>
            </li>
            <li className="flex items-center gap-1">
              <ChevronRight className="size-3.5" aria-hidden="true" />
              <span aria-current="page" className="text-ink">{v.title}</span>
            </li>
          </ol>
        </nav>
      </div>

      <div className="wrap grid gap-8 pb-8 pt-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(21.25rem,1fr)] lg:gap-12">
        <div className="min-w-0">
          <Gallery images={images} title={v.title} />
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={v.status} />
            <span className="inline-flex items-center rounded-sm border border-line px-2 py-[3px] text-[0.6875rem] font-bold uppercase leading-none tracking-[0.04em] text-ink-muted">
              {CATEGORY_LABELS[v.category]}
            </span>
          </div>
          <h1 className="mt-4 text-[1.875rem] sm:text-[2.25rem]">{v.title}</h1>
          {v.variant && <p className="mt-2 text-ink-muted">{v.variant}</p>}

          <p className="tabular mt-5 text-[2rem] font-bold leading-none" style={{ fontStretch: "118%" }}>
            {sold ? "Prodano" : formatPrice(v)}
          </p>
          {arrival && (
            <p className="mt-4 flex items-start gap-2 rounded-sm bg-[#e8eef3] dark:bg-steel/20 dark:text-steel-light px-3 py-2.5 text-[0.9375rem] text-steel">
              <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{arrival}. Datum je okviran i nije zajamčen.</span>
            </p>
          )}
          {v.status === "reserved" && (
            <p className="mt-4 rounded-sm bg-[#f6efe4] dark:bg-status-reserved/20 dark:text-[#f0b766] px-3 py-2.5 text-[0.9375rem] text-status-reserved">
              Vozilo je trenutno rezervirano. Pošaljite upit i javit ćemo vam ako se ponovno oslobodi.
            </p>
          )}
          {sold && (
            <div className="mt-5 rounded-sm border border-line bg-surface p-4 text-[0.9375rem]">
              <p className="font-semibold">Ovo vozilo je prodano.</p>
              <p className="mt-1 text-ink-muted">Pogledajte slična vozila iz aktualne ponude ili nam javite što tražite.</p>
              <Link href="/vozila" className="btn btn-dark btn-sm mt-4">Aktualna ponuda</Link>
            </div>
          )}

          {canInquire && (
            <div className="mt-6 hidden gap-2 lg:flex">
              <a href="#upit" className="btn btn-primary flex-1">
                <Send className="size-4" aria-hidden="true" />
                Pošalji upit
              </a>
              {settings.phone && (
                <a href={phoneHref(settings.phone)} className="btn btn-outline flex-1">
                  <Phone className="size-4" aria-hidden="true" />
                  Nazovite nas
                </a>
              )}
            </div>
          )}
          <div className="mt-4">
            <ShareButton title={v.title} url={shareUrl} />
          </div>
        </div>
      </div>

      {/* Ključni podaci — velike brojke */}
      <div className="bg-asphalt text-white">
        <dl className="wrap grid grid-cols-2 gap-y-6 py-8 sm:grid-cols-4">
          {keySpecs.map((s, i) => (
            <div key={s.label} className={`${i % 2 === 1 ? "border-l border-line-dark pl-5" : ""} sm:border-l sm:border-line-dark sm:pl-5 ${i === 0 ? "sm:border-l-0 sm:pl-0" : ""}`}>
              <dt className="text-sm text-fog">{s.label}</dt>
              <dd className="tabular mt-1 text-[1.25rem] font-bold leading-tight sm:text-[1.5rem]" style={{ fontStretch: "118%" }}>
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="wrap grid gap-12 py-12 lg:grid-cols-[minmax(0,1.55fr)_minmax(21.25rem,1fr)] lg:gap-12">
        <div className="min-w-0 space-y-12">
          {/* Tehnički podaci odmah ispod oglasa, prije opisa */}
          <section aria-labelledby="specifikacije">
            <h2 id="specifikacije" className="text-2xl">Tehnički podaci</h2>
            <dl className="mt-4 border-t border-line">
              <SpecRow label="Marka" value={v.brand} />
              <SpecRow label="Model" value={v.model} />
              <SpecRow label="Izvedba" value={v.variant} />
              <SpecRow label="Godina proizvodnje" value={`${v.year}.`} />
              <SpecRow label="Prijeđeni kilometri" value={formatKm(v.mileage_km)} />
              <SpecRow label="Gorivo" value={FUEL_LABELS[v.fuel_type]} />
              <SpecRow label="Mjenjač" value={TRANSMISSION_LABELS[v.transmission]} />
              <SpecRow label="Snaga motora" value={v.power_kw ? formatPower(v.power_kw) : null} />
              <SpecRow label="Obujam motora" value={v.engine_displacement_cc ? formatCc(v.engine_displacement_cc) : null} />
              <SpecRow label="Pogon" value={v.drivetrain ? DRIVETRAIN_LABELS[v.drivetrain] : null} />
              <SpecRow label="Karoserija" value={v.body_type ? BODY_LABELS[v.body_type] : null} />
              <SpecRow label="Boja" value={v.exterior_color} />
              <SpecRow label="Broj vrata" value={v.doors ? String(v.doors) : null} />
              <SpecRow label="Broj sjedala" value={v.seats ? String(v.seats) : null} />
              <SpecRow label="VIN" value={v.public_vin} />
              <SpecRow label="Šifra oglasa" value={v.stock_ref} />
            </dl>
          </section>

          {v.description && (
            <section aria-labelledby="opis">
              <h2 id="opis" className="text-2xl">Opis vozila</h2>
              <div className="mt-4 max-w-[68ch] whitespace-pre-line text-[1.0625rem] leading-relaxed">{v.description}</div>
            </section>
          )}

          {v.equipment.length > 0 && (
            <section aria-labelledby="oprema">
              <h2 id="oprema" className="text-2xl">Oprema</h2>
              <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                {v.equipment.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[0.9375rem]">
                    <Check className="mt-1 size-4 shrink-0 text-steel" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

        </div>

        {canInquire && (
          <aside id="upit" aria-labelledby="upit-naslov" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-sm border border-line bg-surface p-6">
              <h2 id="upit-naslov" className="text-xl" style={{ fontStretch: "110%" }}>Upit za ovo vozilo</h2>
              <p className="mb-5 mt-2 text-[0.9375rem] text-ink-muted">Dovoljna je vaša email adresa. Odgovaramo što prije.</p>
              <InquiryForm vehicleId={v.id} defaultMessage={defaultMessage} compact />
            </div>
          </aside>
        )}
      </div>

      {related.length > 0 && (
        <section className="border-t border-line bg-surface py-14" aria-labelledby="slicna">
          <div className="wrap">
            <h2 id="slicna" className="mb-8 text-2xl">Slična vozila</h2>
            <VehicleGrid vehicles={related} />
          </div>
        </section>
      )}

      {/* Mobilna traka s akcijama — iznad donje navigacije, ne prekriva sadržaj */}
      {canInquire && (
        <>
          <div className="h-[4.25rem] lg:hidden" aria-hidden="true" />
          <div
            className="fixed inset-x-0 z-30 flex gap-2 border-t border-line bg-paper/95 px-4 py-2.5 backdrop-blur-sm lg:hidden"
            style={{ bottom: "var(--bottom-nav-h)" }}
          >
            {settings.phone && (
              <a href={phoneHref(settings.phone)} className="btn btn-outline flex-1" aria-label={`Nazovite: ${settings.phone}`}>
                <Phone className="size-4" aria-hidden="true" />
                Nazovite
              </a>
            )}
            <a href="#upit" className="btn btn-primary flex-[1.4]">
              <Send className="size-4" aria-hidden="true" />
              Pošalji upit
            </a>
          </div>
        </>
      )}
    </article>
  );
}

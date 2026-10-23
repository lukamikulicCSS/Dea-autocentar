import { siteUrl } from "@/lib/env";
import { formatKm, formatPrice } from "@/lib/format";
import { vehicleImageUrl } from "@/lib/images";
import type { SiteSettings, VehicleDetail } from "@/lib/types";
import {
  BODY_LABELS,
  DRIVETRAIN_LABELS,
  FUEL_LABELS,
  TRANSMISSION_LABELS,
} from "@/lib/vehicles/constants";

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Skraćuje tekst na granici riječi (za meta opise). */
export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,.;:\s-]+$/, "")}…`;
}

export function vehicleMetaTitle(v: VehicleDetail, settings: SiteSettings): string {
  if (v.seo_title) return v.seo_title;
  const place = settings.city ? ` | ${settings.city}` : "";
  return truncate(`${v.title}, ${v.year}.${place}`, 60);
}

export function vehicleMetaDescription(v: VehicleDetail, settings: SiteSettings): string {
  if (v.seo_description) return v.seo_description;
  const parts = [
    `${v.title} (${v.year}.)`,
    formatKm(v.mileage_km),
    FUEL_LABELS[v.fuel_type],
    TRANSMISSION_LABELS[v.transmission].toLowerCase() + " mjenjač",
    v.status === "sold" ? "prodano" : formatPrice(v),
  ];
  const where = [settings.business_name, settings.city].filter(Boolean).join(", ");
  return truncate(`${parts.join(", ")}. ${where}.`, 158);
}

/** Sigurno umetanje JSON-LD-a u HTML (sprječava zatvaranje <script> taga). */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function postalAddress(s: SiteSettings) {
  if (!s.street_address && !s.city) return undefined;
  return {
    "@type": "PostalAddress",
    streetAddress: s.street_address ?? undefined,
    addressLocality: s.city ?? undefined,
    postalCode: s.postal_code ?? undefined,
    addressCountry: s.country_code,
  };
}

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Podaci o salonu (AutoDealer) — samo provjereni podaci iz postavki. */
export function dealerJsonLd(s: SiteSettings) {
  const sameAs = [s.instagram_url, s.facebook_url].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${absoluteUrl("/")}#salon`,
    name: s.business_name,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/icon-512.png"),
    image: absoluteUrl("/images/salon-audi-r8.jpg"),
    telephone: s.phone ?? undefined,
    email: s.email ?? undefined,
    address: postalAddress(s),
    geo:
      s.latitude !== null && s.longitude !== null
        ? { "@type": "GeoCoordinates", latitude: s.latitude, longitude: s.longitude }
        : undefined,
    hasMap: s.maps_url ?? undefined,
    openingHoursSpecification: s.open_24_7
      ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: ALL_DAYS, opens: "00:00", closes: "23:59" }]
      : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };
}

export function websiteJsonLd(s: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${absoluteUrl("/")}#web`,
    name: s.business_name,
    url: absoluteUrl("/"),
    inLanguage: "hr",
    publisher: { "@id": `${absoluteUrl("/")}#salon` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/vozila")}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * Vozilo (schema.org Car). Ponuda (Offer) se navodi samo kad je stvarno
 * istinita: dostupno ili u dolasku, s upisanom cijenom. Za rezervirana,
 * prodana i vozila "cijena na upit" ponuda se ne navodi.
 */
export function vehicleJsonLd(v: VehicleDetail, s: SiteSettings) {
  const url = absoluteUrl(`/vozila/${v.slug}`);
  const images = v.vehicle_images.map((i) => vehicleImageUrl(i.storage_path));
  const hasOffer =
    (v.status === "available" || v.status === "coming_soon") && !v.price_on_request && v.price_amount !== null;

  return {
    "@context": "https://schema.org",
    "@type": "Car",
    "@id": `${url}#vozilo`,
    name: v.title,
    url,
    image: images.length ? images : undefined,
    description: v.description ? truncate(v.description, 500) : undefined,
    brand: { "@type": "Brand", name: v.brand },
    model: v.variant ? `${v.model} ${v.variant}` : v.model,
    vehicleModelDate: String(v.year),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: v.mileage_km, unitCode: "KMT" },
    fuelType: FUEL_LABELS[v.fuel_type],
    vehicleTransmission: TRANSMISSION_LABELS[v.transmission],
    bodyType: v.body_type ? BODY_LABELS[v.body_type] : undefined,
    color: v.exterior_color ?? undefined,
    driveWheelConfiguration: v.drivetrain ? DRIVETRAIN_LABELS[v.drivetrain] : undefined,
    numberOfDoors: v.doors ?? undefined,
    seatingCapacity: v.seats ?? undefined,
    vehicleIdentificationNumber: v.public_vin ?? undefined,
    sku: v.stock_ref ?? undefined,
    vehicleEngine:
      v.power_kw || v.engine_displacement_cc
        ? {
            "@type": "EngineSpecification",
            enginePower: v.power_kw ? { "@type": "QuantitativeValue", value: v.power_kw, unitCode: "KWT" } : undefined,
            engineDisplacement: v.engine_displacement_cc
              ? { "@type": "QuantitativeValue", value: v.engine_displacement_cc, unitCode: "CMQ" }
              : undefined,
          }
        : undefined,
    offers: hasOffer
      ? {
          "@type": "Offer",
          url,
          price: (v.price_amount! / 100).toFixed(2),
          priceCurrency: v.currency,
          availability: v.status === "available" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
          seller: { "@type": "AutoDealer", "@id": `${absoluteUrl("/")}#salon`, name: s.business_name },
        }
      : undefined,
  };
}

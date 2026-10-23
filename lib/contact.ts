import type { SiteSettings } from "@/lib/types";

export function fullAddress(s: SiteSettings): string | null {
  const city = [s.postal_code, s.city].filter(Boolean).join(" ");
  const parts = [s.street_address, city].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

/** Poveznica za upute: upisani Google Maps URL ili pretraga po provjerenoj adresi. */
export function mapsHref(s: SiteSettings): string | null {
  if (s.maps_url) return s.maps_url;
  const address = fullAddress(s);
  if (!address) return null;
  const query = `${s.business_name}, ${address}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function whatsappHref(number: string, text?: string): string {
  const digits = number.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function viberHref(number: string): string {
  return `viber://chat?number=${encodeURIComponent(number.replace(/[^+0-9]/g, ""))}`;
}

export function openingHours(s: SiteSettings): string | null {
  return s.opening_hours ?? (s.open_24_7 ? "Svaki dan, 0–24" : null);
}

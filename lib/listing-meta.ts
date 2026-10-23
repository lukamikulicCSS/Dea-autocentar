import type { Metadata } from "next";
import { activeFilterCount, type VehicleFilters } from "@/lib/vehicles/filters";

/**
 * Pravila indeksiranja popisa: osnovna stranica i stranice paginacije se indeksiraju,
 * kombinacije filtera ne (sprječava tisuće tankih, dupliciranih stranica).
 */
export function listingMetadata(basePath: string, filters: VehicleFilters, meta: { title: string; description: string }): Metadata {
  const filtered = activeFilterCount(filters) > 0 || filters.sort !== "preporuceno";
  const canonical = !filtered && filters.stranica > 1 ? `${basePath}?stranica=${filters.stranica}` : basePath;
  return {
    title: filters.stranica > 1 ? `${meta.title} – stranica ${filters.stranica}` : meta.title,
    description: meta.description,
    alternates: { canonical },
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: { title: meta.title, description: meta.description, url: basePath },
  };
}

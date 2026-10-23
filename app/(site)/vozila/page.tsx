import type { Metadata } from "next";
import { JsonLd } from "@/components/site/JsonLd";
import { VehicleListing } from "@/components/site/Listing";
import { PageHeader } from "@/components/site/PageHeader";
import { listingMetadata } from "@/lib/listing-meta";
import { breadcrumbJsonLd } from "@/lib/seo";
import { parseFilters } from "@/lib/vehicles/filters";
import { filterableStatuses, getSiteSettings, searchVehicles } from "@/lib/vehicles/queries";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  const settings = await getSiteSettings();
  return listingMetadata("/vozila", filters, {
    title: `Ponuda vozila${settings.city ? ` – ${settings.city}` : ""}`,
    description: `Aktualna ponuda vozila ${settings.business_name}${settings.city ? ` u ${settings.city === "Zenica" ? "Zenici" : settings.city}` : ""}: pretražite po marki, cijeni, godini, kilometraži i gorivu.`,
  });
}

export default async function VehiclesPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  const settings = await getSiteSettings();
  const result = await searchVehicles(filters, settings);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Početna", path: "/" }, { name: "Vozila", path: "/vozila" }])} />
      <PageHeader
        title="Ponuda vozila"
        description="Sva vozila prije oglašavanja prolaze detaljan pregled. Filtrirajte ponudu i otvorite oglas za sve pojedinosti."
        crumbs={[{ name: "Početna", href: "/" }, { name: "Vozila" }]}
      />
      <VehicleListing result={result} filters={filters} statuses={filterableStatuses(settings)} basePath="/vozila" />
    </>
  );
}

import type { Metadata } from "next";
import { JsonLd } from "@/components/site/JsonLd";
import { VehicleListing } from "@/components/site/Listing";
import { PageHeader } from "@/components/site/PageHeader";
import { listingMetadata } from "@/lib/listing-meta";
import { breadcrumbJsonLd } from "@/lib/seo";
import { parseFilters } from "@/lib/vehicles/filters";
import { getSiteSettings, searchVehicles } from "@/lib/vehicles/queries";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  return listingMetadata("/u-dolasku", filters, {
    title: "Vozila u dolasku",
    description: "Vozila koja uskoro stižu u Auto Centar DEA u Zenici. Pošaljite upit unaprijed i javit ćemo vam čim vozilo stigne.",
  });
}

export default async function ComingSoonPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  const settings = await getSiteSettings();
  const result = await searchVehicles({ ...filters, sort: filters.sort === "preporuceno" ? "najnovije" : filters.sort }, settings, {
    fixedStatus: "coming_soon",
  });
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Početna", path: "/" }, { name: "Vozila u dolasku", path: "/u-dolasku" }])} />
      <PageHeader
        title="Vozila u dolasku"
        description="Vozila koja su na putu prema salonu. Navedeni datumi dolaska su okvirni i nisu zajamčeni. Upit možete poslati već sada."
        crumbs={[{ name: "Početna", href: "/" }, { name: "Vozila u dolasku" }]}
      />
      <VehicleListing
        result={result}
        filters={filters}
        statuses={["coming_soon"]}
        suggestScope={{ statuses: ["coming_soon"] }}
        basePath="/u-dolasku"
        showStatus={false}
        emptyTitle="Trenutno nema najavljenih vozila"
        emptyText="Kad nova vozila krenu prema salonu, ovdje ćete ih vidjeti prvi. Pogledajte i aktualnu ponudu."
      />
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VehicleListing } from "@/components/site/Listing";
import { PageHeader } from "@/components/site/PageHeader";
import { listingMetadata } from "@/lib/listing-meta";
import { parseFilters } from "@/lib/vehicles/filters";
import { getSiteSettings, searchVehicles } from "@/lib/vehicles/queries";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  const meta = listingMetadata("/prodana-vozila", filters, {
    title: "Prodana vozila",
    description: "Arhiva vozila koja su prodana preko Auto Centra DEA u Zenici.",
  });
  return { ...meta, robots: { index: false, follow: true } };
}

export default async function SoldPage({ searchParams }: Props) {
  const settings = await getSiteSettings();
  if (settings.sold_display === "hidden") notFound();
  const filters = parseFilters(await searchParams);
  const result = await searchVehicles({ ...filters, sort: filters.sort === "preporuceno" ? "najnovije" : filters.sort }, settings, {
    fixedStatus: "sold",
  });
  return (
    <>
      <PageHeader
        title="Prodana vozila"
        description="Vozila koja su pronašla nove vlasnike. Tražite nešto slično? Javite nam se."
        crumbs={[{ name: "Početna", href: "/" }, { name: "Prodana vozila" }]}
      />
      <VehicleListing result={result} filters={filters} statuses={["sold"]} suggestScope={{ statuses: ["sold"] }} basePath="/prodana-vozila" showStatus={false} emptyTitle="Arhiva je zasad prazna" emptyText="Prodana vozila pojavit će se ovdje." />
    </>
  );
}

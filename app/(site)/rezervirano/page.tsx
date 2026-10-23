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
  const meta = listingMetadata("/rezervirano", filters, {
    title: "Rezervirana vozila",
    description: "Vozila iz ponude Auto Centra DEA za koja trenutno postoji rezervacija.",
  });
  return { ...meta, robots: { index: false, follow: true } };
}

export default async function ReservedPage({ searchParams }: Props) {
  const settings = await getSiteSettings();
  if (settings.reserved_display === "hidden") notFound();
  const filters = parseFilters(await searchParams);
  const result = await searchVehicles(filters, settings, { fixedStatus: "reserved" });
  return (
    <>
      <PageHeader
        title="Rezervirana vozila"
        description="Za ova vozila trenutno postoji rezervacija. Ako rezervacija ne bude realizirana, vozilo se vraća u ponudu."
        crumbs={[{ name: "Početna", href: "/" }, { name: "Rezervirano" }]}
      />
      <VehicleListing result={result} filters={filters} statuses={["reserved"]} basePath="/rezervirano" showStatus={false} emptyTitle="Trenutno nema rezerviranih vozila" emptyText="Pogledajte aktualnu ponudu dostupnih vozila." />
    </>
  );
}

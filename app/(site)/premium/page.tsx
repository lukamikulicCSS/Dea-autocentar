import type { Metadata } from "next";
import { JsonLd } from "@/components/site/JsonLd";
import { VehicleListing } from "@/components/site/Listing";
import { PageHeader } from "@/components/site/PageHeader";
import { listingMetadata } from "@/lib/listing-meta";
import { breadcrumbJsonLd } from "@/lib/seo";
import { parseFilters } from "@/lib/vehicles/filters";
import { filterableStatuses, getSiteSettings, mainListingStatuses, searchVehicles } from "@/lib/vehicles/queries";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  return listingMetadata("/premium", filters, {
    title: "Premium vozila",
    description: "Izdvojena premium vozila Auto Centra DEA u Zenici, s detaljnim opisom, specifikacijama i fotogalerijom.",
  });
}

export default async function PremiumPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  const settings = await getSiteSettings();
  const result = await searchVehicles(filters, settings, { fixedCategory: "premium", pageSize: 8 });
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Početna", path: "/" }, { name: "Premium vozila", path: "/premium" }])} />
      <PageHeader
        title="Premium vozila"
        description="Izdvojena vozila iz naše ponude. Za svako možete dogovoriti razgledavanje i probnu vožnju u bilo koje doba."
        crumbs={[{ name: "Početna", href: "/" }, { name: "Premium vozila" }]}
      />
      <VehicleListing
        result={result}
        filters={filters}
        statuses={filterableStatuses(settings)}
        suggestScope={{ statuses: filters.status ? [filters.status] : mainListingStatuses(settings), category: "premium" }}
        basePath="/premium"
        showCategory={false}
        variant="editorial"
        emptyTitle="Trenutno nema premium vozila prema ovim kriterijima"
        emptyText="Premium ponuda se često mijenja. Javite nam što tražite i obavijestit ćemo vas kad stigne."
      />
    </>
  );
}

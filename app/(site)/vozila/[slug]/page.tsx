import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/site/JsonLd";
import { VehicleDetailView } from "@/components/site/VehicleDetailView";
import { vehicleImageUrl } from "@/lib/images";
import { absoluteUrl, breadcrumbJsonLd, vehicleJsonLd, vehicleMetaDescription, vehicleMetaTitle } from "@/lib/seo";
import { getRelatedVehicles, getSiteSettings, getVehicleBySlug } from "@/lib/vehicles/queries";

export const revalidate = 300;

// Stranice se generiraju pri prvom posjetu i keširaju (ISR); objava ili izmjena ih osvježava.
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [vehicle, settings] = await Promise.all([getVehicleBySlug(slug), getSiteSettings()]);
  if (!vehicle) return { title: "Vozilo nije pronađeno", robots: { index: false } };

  const title = vehicleMetaTitle(vehicle, settings);
  const description = vehicleMetaDescription(vehicle, settings);
  const cover = vehicle.vehicle_images[0];
  const path = `/vozila/${vehicle.slug}`;
  return {
    title: { absolute: title.includes(settings.business_name) ? title : `${title} | ${settings.business_name}` },
    description,
    alternates: { canonical: path },
    // Prodana vozila: stranica ostaje dostupna (poveznice), ali se ne indeksira
    robots: vehicle.status === "sold" ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      title,
      description,
      url: path,
      images: cover
        ? [{ url: vehicleImageUrl(cover.storage_path), width: cover.width ?? undefined, height: cover.height ?? undefined, alt: vehicle.title }]
        : undefined,
    },
  };
}

export default async function VehiclePage({ params }: Props) {
  const { slug } = await params;
  const [vehicle, settings] = await Promise.all([getVehicleBySlug(slug), getSiteSettings()]);
  if (!vehicle) notFound();
  const related = vehicle.status === "sold" || vehicle.status === "available" || vehicle.status === "reserved"
    ? await getRelatedVehicles(vehicle)
    : [];
  const listPath = vehicle.category === "premium" ? "/premium" : "/vozila";

  return (
    <>
      <JsonLd data={vehicleJsonLd(vehicle, settings)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Početna", path: "/" },
          { name: vehicle.category === "premium" ? "Premium vozila" : "Vozila", path: listPath },
          { name: vehicle.title, path: `/vozila/${vehicle.slug}` },
        ])}
      />
      <VehicleDetailView vehicle={vehicle} settings={settings} related={related} shareUrl={absoluteUrl(`/vozila/${vehicle.slug}`)} />
    </>
  );
}

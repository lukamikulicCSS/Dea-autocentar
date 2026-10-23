import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { VehicleDetailView } from "@/components/site/VehicleDetailView";
import { requireAdmin } from "@/lib/auth";
import type { VehicleDetail } from "@/lib/types";
import { DETAIL_COLUMNS, getSiteSettings } from "@/lib/vehicles/queries";
import { uuidSchema } from "@/lib/vehicles/schema";

export const metadata: Metadata = { title: "Pregled oglasa", robots: { index: false, follow: false } };

/** Pregled oglasa točno onako kako će ga vidjeti kupci — i prije objave. */
export default async function PreviewPage({ params }: PageProps<"/admin/vozila/[id]/pregled">) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const { supabase } = await requireAdmin(`/admin/vozila/${id}/pregled`);
  const [{ data }, settings] = await Promise.all([
    supabase.from("vehicles").select(DETAIL_COLUMNS).eq("id", id).order("sort_order", { referencedTable: "vehicle_images" }).maybeSingle(),
    getSiteSettings(),
  ]);
  if (!data) notFound();
  const vehicle = data as unknown as VehicleDetail;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-paper">
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-steel px-4 py-2 text-sm text-white">
        <span>
          <strong>Pregled</strong> — {vehicle.is_published ? "oglas je objavljen" : "oglas još nije objavljen i kupci ga ne vide"}.
        </span>
        <a href={`/admin/vozila/${id}`} className="btn btn-sm border border-white/40 text-white">Natrag na uređivanje</a>
      </div>
      <Header settings={settings} />
      <VehicleDetailView vehicle={vehicle} settings={settings} related={[]} shareUrl={`/vozila/${vehicle.slug}`} />
      <Footer settings={settings} />
    </div>
  );
}

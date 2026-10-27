import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { ImageManager } from "@/components/admin/ImageManager";
import { Notice } from "@/components/admin/Notice";
import { VehicleForm, type EditableVehicle } from "@/components/admin/VehicleForm";
import { StatusBadge } from "@/components/site/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import type { VehicleImage } from "@/lib/types";
import { uuidSchema } from "@/lib/vehicles/schema";

export const metadata: Metadata = { title: "Uređivanje vozila" };

export default async function EditVehiclePage({ params, searchParams }: PageProps<"/admin/vozila/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  if (!uuidSchema.safeParse(id).success) notFound();
  const { supabase } = await requireAdmin(`/admin/vozila/${id}`);

  const [{ data: vehicle }, { data: internal }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("*, vehicle_images(id,storage_path,width,height,alt_text,sort_order)")
      .eq("id", id)
      .order("sort_order", { referencedTable: "vehicle_images" })
      .maybeSingle(),
    supabase.from("vehicle_internal").select("vin,show_vin,internal_note").eq("vehicle_id", id).maybeSingle(),
  ]);
  if (!vehicle) notFound();

  const editable: EditableVehicle = {
    ...(vehicle as unknown as EditableVehicle),
    vin: internal?.vin ?? null,
    show_vin: internal?.show_vin ?? false,
    internal_note: internal?.internal_note ?? null,
  };
  const images = (vehicle.vehicle_images ?? []) as VehicleImage[];

  return (
    <>
      <AdminPageTitle title={vehicle.title}>
        {vehicle.is_published ? (
          <Link href={`/vozila/${vehicle.slug}`} target="_blank" className="btn btn-outline">Otvori na stranici</Link>
        ) : (
          <Link href={`/admin/vozila/${id}/pregled`} target="_blank" className="btn btn-outline">Pregled</Link>
        )}
        <Link href="/admin/vozila" className="btn btn-outline">Popis vozila</Link>
      </AdminPageTitle>

      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
        <StatusBadge status={vehicle.status} />
        <span className={`rounded-sm px-2 py-1 text-xs font-semibold ${vehicle.is_published ? "bg-[#e9f3ee] text-[#14532f] dark:bg-status-available/15 dark:text-[#8fd8ae]" : "border border-line text-ink-muted"}`}>
          {vehicle.is_published ? "Objavljeno" : "Nacrt — nije vidljivo kupcima"}
        </span>
        <span className="text-ink-muted">Adresa oglasa: /vozila/{vehicle.slug}</span>
      </div>

      {sp.novo && <div className="mb-5"><Notice tone="success">Vozilo je spremljeno kao nacrt. Dodajte fotografije, zatim kliknite „Spremi i objavi”.</Notice></div>}
      {sp.kopija && <div className="mb-5"><Notice tone="info">Ovo je kopija oglasa (nacrt, bez fotografija i VIN-a). Provjerite podatke i dodajte fotografije.</Notice></div>}

      <div className="space-y-5">
        <ImageManager vehicleId={id} vehicleTitle={vehicle.title} initialImages={images} isPublished={vehicle.is_published} />
        <VehicleForm vehicle={editable} />
      </div>
    </>
  );
}

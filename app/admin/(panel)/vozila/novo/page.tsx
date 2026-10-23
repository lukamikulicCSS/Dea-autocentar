import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { VehicleForm } from "@/components/admin/VehicleForm";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Novo vozilo" };

export default async function NewVehiclePage() {
  await requireAdmin("/admin/vozila/novo");
  return (
    <>
      <AdminPageTitle
        title="Novo vozilo"
        description="Upišite osnovne podatke i spremite. U sljedećem koraku dodajete fotografije i objavljujete oglas."
      >
        <Link href="/admin/vozila" className="btn btn-outline">Natrag na popis</Link>
      </AdminPageTitle>
      <VehicleForm vehicle={null} />
    </>
  );
}

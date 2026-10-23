import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { InquiryControls } from "@/components/admin/InquiryControls";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import type { Inquiry } from "@/lib/types";
import { uuidSchema } from "@/lib/vehicles/schema";

export const metadata: Metadata = { title: "Upit" };

export default async function InquiryPage({ params }: PageProps<"/admin/upiti/[id]">) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const { supabase } = await requireAdmin(`/admin/upiti/${id}`);
  const { data } = await supabase
    .from("inquiries")
    .select("id,vehicle_id,vehicle_label,email,message,status,is_read,internal_note,created_at,updated_at,vehicles(slug,title)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const inquiry = data as unknown as Inquiry;

  // Otvaranje upita označava ga pročitanim
  if (!inquiry.is_read) {
    await supabase.from("inquiries").update({ is_read: true }).eq("id", id);
  }

  const vehicleTitle = inquiry.vehicles?.title ?? inquiry.vehicle_label;
  return (
    <>
      <Link href="/admin/upiti" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-steel">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Svi upiti
      </Link>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-sm border border-line bg-white p-5 sm:p-6">
          <p className="tabular text-sm text-ink-muted">{formatDateTime(inquiry.created_at)}</p>
          <h1 className="mt-1 break-all text-2xl">{inquiry.email}</h1>
          <dl className="mt-5 space-y-4 text-[0.9375rem]">
            <div>
              <dt className="text-sm text-ink-muted">Vozilo</dt>
              <dd className="mt-0.5 font-medium">
                {inquiry.vehicles ? (
                  <Link href={`/admin/vozila/${inquiry.vehicle_id}`} className="underline underline-offset-2">{inquiry.vehicles.title}</Link>
                ) : (
                  vehicleTitle ?? "Opći upit (nije vezan uz vozilo)"
                )}
                {!inquiry.vehicles && inquiry.vehicle_label && <span className="ml-2 text-sm text-ink-muted">(vozilo je obrisano)</span>}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-muted">Poruka</dt>
              <dd className="mt-1 whitespace-pre-line rounded-sm bg-paper p-3">{inquiry.message ?? <span className="text-ink-muted">Kupac nije napisao poruku.</span>}</dd>
            </div>
          </dl>
        </section>
        <section className="rounded-sm border border-line bg-white p-5 sm:p-6">
          <InquiryControls
            id={inquiry.id}
            email={inquiry.email}
            subject={vehicleTitle ? `Re: ${vehicleTitle} – Auto Centar DEA` : "Re: Vaš upit – Auto Centar DEA"}
            initial={{ status: inquiry.status, is_read: true, internal_note: inquiry.internal_note }}
          />
        </section>
      </div>
    </>
  );
}

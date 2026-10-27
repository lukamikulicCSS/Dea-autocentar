import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { StatusBadge } from "@/components/site/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { VehicleStatus } from "@/lib/vehicles/constants";

export const metadata: Metadata = { title: "Pregled" };

type Stats = {
  active: number;
  available: number;
  premium: number;
  coming_soon: number;
  reserved: number;
  sold: number;
  drafts: number;
  unread_inquiries: number;
  open_inquiries: number;
};

export default async function DashboardPage() {
  const { supabase } = await requireAdmin("/admin");
  const [{ data: stats, error }, { data: recent }, { data: inquiries }] = await Promise.all([
    supabase.rpc("admin_dashboard_stats").single<Stats>(),
    supabase
      .from("vehicles")
      .select("id,title,status,is_published,price_amount,currency,price_on_request,updated_at")
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("inquiries")
      .select("id,email,vehicle_label,created_at,is_read")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const tiles: { label: string; value: number | undefined; href: string; emphasis?: boolean }[] = [
    { label: "Aktivni oglasi", value: stats?.active, href: "/admin/vozila?objava=da" },
    { label: "Dostupno", value: stats?.available, href: "/admin/vozila?status=available" },
    { label: "Premium", value: stats?.premium, href: "/admin/vozila?kategorija=premium" },
    { label: "U dolasku", value: stats?.coming_soon, href: "/admin/vozila?status=coming_soon" },
    { label: "Rezervirano", value: stats?.reserved, href: "/admin/vozila?status=reserved" },
    { label: "Prodano", value: stats?.sold, href: "/admin/vozila?status=sold" },
    { label: "Nacrti (neobjavljeno)", value: stats?.drafts, href: "/admin/vozila?objava=ne" },
    { label: "Nepročitani upiti", value: stats?.unread_inquiries, href: "/admin/upiti?filter=neprocitano", emphasis: true },
  ];

  return (
    <>
      <AdminPageTitle title="Pregled">
        <Link href="/admin/vozila/novo" className="btn btn-primary">
          <Plus className="size-4" aria-hidden="true" />
          Dodaj vozilo
        </Link>
      </AdminPageTitle>

      {error && <p className="error-text mb-6">Statistiku trenutno nije moguće učitati.</p>}

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link href={t.href} className={`block rounded-sm border p-4 transition-colors hover:border-ink ${t.emphasis && (t.value ?? 0) > 0 ? "border-red bg-surface" : "border-line bg-surface"}`}>
              <span className="block text-sm text-ink-muted">{t.label}</span>
              <span className={`tabular mt-1 block text-[1.75rem] font-bold leading-tight ${t.emphasis && (t.value ?? 0) > 0 ? "text-red" : ""}`} style={{ fontStretch: "115%" }}>
                {t.value ?? "–"}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-sm border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-lg" style={{ fontStretch: "105%" }}>Nedavno uređeno</h2>
            <Link href="/admin/vozila" className="text-sm font-medium text-steel">Sva vozila</Link>
          </div>
          {recent && recent.length > 0 ? (
            <ul className="divide-y divide-line">
              {recent.map((v) => (
                <li key={v.id}>
                  <Link href={`/admin/vozila/${v.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-paper">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{v.title}</p>
                      <p className="tabular text-sm text-ink-muted">
                        {formatPrice(v)} · {formatDateTime(v.updated_at)}
                      </p>
                    </div>
                    {!v.is_published && <span className="rounded-sm border border-line px-1.5 py-0.5 text-xs text-ink-muted">Nacrt</span>}
                    <StatusBadge status={v.status as VehicleStatus} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-ink-muted">
              Još nema vozila.{" "}
              <Link href="/admin/vozila/novo" className="font-medium text-steel underline">Dodajte prvo vozilo</Link>.
            </div>
          )}
        </section>

        <section className="rounded-sm border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-lg" style={{ fontStretch: "105%" }}>Novi upiti</h2>
            <Link href="/admin/upiti" className="text-sm font-medium text-steel">Svi upiti</Link>
          </div>
          {inquiries && inquiries.length > 0 ? (
            <ul className="divide-y divide-line">
              {inquiries.map((q) => (
                <li key={q.id}>
                  <Link href={`/admin/upiti/${q.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-paper">
                    <span className="size-2 shrink-0 rounded-full bg-red" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{q.email}</p>
                      <p className="truncate text-sm text-ink-muted">{q.vehicle_label ?? "Opći upit"} · {formatDateTime(q.created_at)}</p>
                    </div>
                    <ArrowRight className="size-4 text-ink-muted" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-6 text-ink-muted">Nema nepročitanih upita.</p>
          )}
        </section>
      </div>
    </>
  );
}

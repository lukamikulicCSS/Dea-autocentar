import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Plus, Search } from "lucide-react";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { Notice } from "@/components/admin/Notice";
import { VehicleQuickControls } from "@/components/admin/VehicleQuickControls";
import { Pagination } from "@/components/site/Pagination";
import { StatusBadge } from "@/components/site/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, formatKm, formatPrice } from "@/lib/format";
import { vehicleImageUrl } from "@/lib/images";
import { CATEGORY_LABELS, STATUS_LABELS, VEHICLE_STATUSES, isOneOf, type VehicleCategory, type VehicleStatus } from "@/lib/vehicles/constants";
import { sanitizeQuery } from "@/lib/vehicles/filters";

export const metadata: Metadata = { title: "Vozila" };

const PER_PAGE = 30;
const SORTS = { azurirano: "Zadnje uređeno", najnovije: "Najnovije dodano", cijena: "Cijena" } as const;

type Row = {
  id: string;
  slug: string;
  title: string;
  year: number;
  mileage_km: number;
  category: VehicleCategory;
  status: VehicleStatus;
  is_published: boolean;
  is_featured: boolean;
  price_amount: number | null;
  currency: "BAM" | "EUR";
  price_on_request: boolean;
  updated_at: string;
  vehicle_images: { storage_path: string; sort_order: number }[];
};

export default async function AdminVehiclesPage({ searchParams }: PageProps<"/admin/vozila">) {
  const { supabase } = await requireAdmin("/admin/vozila");
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const q = sanitizeQuery(str("q"));
  const status = isOneOf(VEHICLE_STATUSES, str("status")) ? (str("status") as VehicleStatus) : undefined;
  const kategorija = str("kategorija") === "premium" || str("kategorija") === "standard" ? (str("kategorija") as VehicleCategory) : undefined;
  const objava = str("objava") === "da" || str("objava") === "ne" ? str("objava") : undefined;
  const sort = (str("sort") ?? "azurirano") in SORTS ? ((str("sort") ?? "azurirano") as keyof typeof SORTS) : "azurirano";
  const page = Math.max(1, Math.min(100, Number(str("stranica")) || 1));

  let query = supabase
    .from("vehicles")
    .select(
      "id,slug,title,year,mileage_km,category,status,is_published,is_featured,price_amount,currency,price_on_request,updated_at,vehicle_images(storage_path,sort_order)",
      { count: "exact" },
    )
    .order("sort_order", { referencedTable: "vehicle_images" })
    .limit(1, { referencedTable: "vehicle_images" });
  if (status) query = query.eq("status", status);
  else if (!objava) query = query.neq("status", "archived");
  if (kategorija) query = query.eq("category", kategorija);
  if (objava) query = query.eq("is_published", objava === "da");
  if (q) for (const w of q.split(" ").slice(0, 5)) query = query.or(`title.ilike.%${w}%,brand.ilike.%${w}%,model.ilike.%${w}%,stock_ref.ilike.%${w}%`);
  query =
    sort === "najnovije"
      ? query.order("created_at", { ascending: false })
      : sort === "cijena"
        ? query.order("price_bam_minor", { ascending: false, nullsFirst: false })
        : query.order("updated_at", { ascending: false });
  const from = (page - 1) * PER_PAGE;
  const { data, count, error } = await query.order("id").range(from, from + PER_PAGE - 1);
  const rows = (data ?? []) as unknown as Row[];
  const total = count ?? 0;

  const qs = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (kategorija) params.set("kategorija", kategorija);
    if (objava) params.set("objava", objava);
    if (sort !== "azurirano") params.set("sort", sort);
    if (p > 1) params.set("stranica", String(p));
    const s = params.toString();
    return `/admin/vozila${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <AdminPageTitle title="Vozila" description="Status, objavu i izdvajanje mijenjate izravno u popisu. Promjene su odmah vidljive na stranici.">
        <Link href="/admin/vozila/novo" className="btn btn-primary">
          <Plus className="size-4" aria-hidden="true" />
          Dodaj vozilo
        </Link>
      </AdminPageTitle>

      {sp.obrisano && <div className="mb-6"><Notice tone="success">Vozilo je obrisano.</Notice></div>}

      <form method="get" className="mb-6 grid gap-2 rounded-sm border border-line bg-white p-3 sm:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto]">
        <div className="relative">
          <label htmlFor="aq" className="sr-only">Pretraga</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <input id="aq" name="q" type="search" defaultValue={q} placeholder="Naziv, marka, šifra…" className="field pl-9" />
        </div>
        <select name="status" defaultValue={status ?? ""} className="field" aria-label="Status">
          <option value="">Svi statusi (bez arhive)</option>
          {VEHICLE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select name="kategorija" defaultValue={kategorija ?? ""} className="field" aria-label="Kategorija">
          <option value="">Sve kategorije</option>
          <option value="premium">{CATEGORY_LABELS.premium}</option>
          <option value="standard">{CATEGORY_LABELS.standard}</option>
        </select>
        <select name="objava" defaultValue={objava ?? ""} className="field" aria-label="Objava">
          <option value="">Objavljeno i nacrti</option>
          <option value="da">Samo objavljeno</option>
          <option value="ne">Samo nacrti</option>
        </select>
        <select name="sort" defaultValue={sort} className="field" aria-label="Poredak">
          {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn btn-dark">Primijeni</button>
      </form>

      <p className="tabular mb-3 text-sm text-ink-muted">{total} {total === 1 ? "vozilo" : "vozila"}</p>
      {error && <Notice tone="error">Popis trenutno nije moguće učitati.</Notice>}

      {rows.length === 0 && !error ? (
        <div className="rounded-sm border border-dashed border-line bg-white p-10 text-center">
          <p className="font-semibold">Nema vozila za odabrane kriterije.</p>
          <Link href="/admin/vozila/novo" className="btn btn-primary mt-5">Dodaj vozilo</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((v) => {
            const cover = v.vehicle_images[0];
            return (
              <li key={v.id} className="grid gap-4 rounded-sm border border-line bg-white p-3 sm:p-4 md:grid-cols-[120px_1fr_auto] md:items-center">
                <Link href={`/admin/vozila/${v.id}`} className="relative block aspect-[4/3] w-full overflow-hidden rounded-sm bg-[#e7e7e2] md:w-[120px]" tabIndex={-1} aria-hidden="true">
                  {cover ? (
                    <Image src={vehicleImageUrl(cover.storage_path)} alt="" fill sizes="(min-width: 768px) 120px, 100vw" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-ink-muted"><ImageOff className="size-6" /></span>
                  )}
                </Link>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={v.status} />
                    {v.category === "premium" && <span className="rounded-sm border border-line px-1.5 py-0.5 text-xs font-semibold">Premium</span>}
                    {!cover && <span className="rounded-sm bg-[#f6efe4] px-1.5 py-0.5 text-xs text-status-reserved">Bez fotografija</span>}
                  </div>
                  <Link href={`/admin/vozila/${v.id}`} className="mt-1.5 block truncate text-[1.0625rem] font-semibold hover:underline">{v.title}</Link>
                  <p className="tabular mt-0.5 text-sm text-ink-muted">
                    {v.year}. · {formatKm(v.mileage_km)} · <span className="font-semibold text-ink">{formatPrice(v)}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">Uređeno {formatDateTime(v.updated_at)}</p>
                </div>
                <VehicleQuickControls
                  id={v.id}
                  slug={v.slug}
                  title={v.title}
                  imageCount={v.vehicle_images.length}
                  initial={{ status: v.status, is_published: v.is_published, is_featured: v.is_featured }}
                />
              </li>
            );
          })}
        </ul>
      )}
      <Pagination page={page} pageCount={Math.ceil(total / PER_PAGE)} hrefFor={qs} />
    </>
  );
}

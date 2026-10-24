import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { Notice } from "@/components/admin/Notice";
import { Pagination } from "@/components/site/Pagination";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import type { Inquiry } from "@/lib/types";
import { INQUIRY_STATUS_LABELS, INQUIRY_STATUSES, isOneOf, type InquiryStatus } from "@/lib/vehicles/constants";

export const metadata: Metadata = { title: "Upiti" };
const PER_PAGE = 30;

const STATUS_STYLE: Record<InquiryStatus, string> = {
  new: "bg-red text-white",
  in_progress: "bg-steel text-white",
  answered: "bg-status-available text-white",
  closed: "bg-ink-muted text-white",
};

export default async function InquiriesPage({ searchParams }: PageProps<"/admin/upiti">) {
  const { supabase } = await requireAdmin("/admin/upiti");
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const status = isOneOf(INQUIRY_STATUSES, str("status")) ? (str("status") as InquiryStatus) : undefined;
  const unreadOnly = str("filter") === "neprocitano";
  const q = (str("q") ?? "").replace(/[^\p{L}\p{N}@._+-]/gu, "").slice(0, 80);
  const page = Math.max(1, Math.min(200, Number(str("stranica")) || 1));

  let query = supabase
    .from("inquiries")
    .select("id,vehicle_id,vehicle_label,email,message,status,is_read,internal_note,created_at,updated_at,vehicles(slug,title)", { count: "exact" })
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (unreadOnly) query = query.eq("is_read", false);
  if (q) query = query.or(`email.ilike.%${q}%,vehicle_label.ilike.%${q}%`);
  const from = (page - 1) * PER_PAGE;
  const { data, count, error } = await query.range(from, from + PER_PAGE - 1);
  const rows = (data ?? []) as unknown as Inquiry[];
  const total = count ?? 0;

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (unreadOnly) params.set("filter", "neprocitano");
    if (q) params.set("q", q);
    if (p > 1) params.set("stranica", String(p));
    const s = params.toString();
    return `/admin/upiti${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <AdminPageTitle title="Upiti" description="Upiti kupaca s web stranice. Vidljivi su samo administratorima." />
      {sp.obrisano && <div className="mb-5"><Notice tone="success">Upit je obrisan.</Notice></div>}

      <form method="get" className="mb-6 grid gap-2 rounded-sm border border-line bg-surface p-3 sm:grid-cols-[1.6fr_1fr_1fr_auto]">
        <div className="relative">
          <label htmlFor="iq" className="sr-only">Pretraga po emailu ili vozilu</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <input id="iq" name="q" type="search" defaultValue={q} placeholder="Email ili vozilo" className="field pl-9" />
        </div>
        <select name="status" defaultValue={status ?? ""} className="field" aria-label="Status">
          <option value="">Svi statusi</option>
          {INQUIRY_STATUSES.map((s) => <option key={s} value={s}>{INQUIRY_STATUS_LABELS[s]}</option>)}
        </select>
        <select name="filter" defaultValue={unreadOnly ? "neprocitano" : ""} className="field" aria-label="Pročitano">
          <option value="">Pročitani i nepročitani</option>
          <option value="neprocitano">Samo nepročitani</option>
        </select>
        <button className="btn btn-dark">Primijeni</button>
      </form>

      {error && <Notice tone="error">Upite trenutno nije moguće učitati.</Notice>}
      {rows.length === 0 && !error ? (
        <div className="rounded-sm border border-dashed border-line bg-surface p-10 text-center text-ink-muted">Nema upita za odabrane kriterije.</div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-sm border border-line bg-surface">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/upiti/${r.id}`} className={`grid gap-1 px-4 py-3.5 hover:bg-paper sm:grid-cols-[1fr_auto] sm:items-center ${r.is_read ? "" : "bg-[#fdf6f6]"}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!r.is_read && <span className="size-2 shrink-0 rounded-full bg-red" aria-label="Nepročitano" />}
                    <span className={`truncate ${r.is_read ? "" : "font-semibold"}`}>{r.email}</span>
                  </div>
                  <p className="truncate text-sm text-ink-muted">
                    {r.vehicles?.title ?? r.vehicle_label ?? "Opći upit"}
                    {r.message ? ` — ${r.message}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>{INQUIRY_STATUS_LABELS[r.status]}</span>
                  <span className="tabular text-ink-muted">{formatDateTime(r.created_at)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="tabular mt-3 text-sm text-ink-muted">Ukupno: {total}</p>
      <Pagination page={page} pageCount={Math.ceil(total / PER_PAGE)} hrefFor={href} />
    </>
  );
}

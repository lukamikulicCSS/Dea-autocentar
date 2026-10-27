import "server-only";
import { cache } from "react";
import { publicClient } from "@/lib/supabase/public";
import type { SiteSettings, VehicleCard, VehicleDetail } from "@/lib/types";
import { PAGE_SIZE, type VehicleStatus } from "@/lib/vehicles/constants";
import type { VehicleFilters } from "@/lib/vehicles/filters";

/** Samo stupci potrebni za karticu (bez nepotrebnih podataka prema klijentu). */
export const CARD_COLUMNS =
  "id,slug,title,brand,model,variant,category,status,price_amount,currency,price_on_request,year,mileage_km,fuel_type,transmission,power_kw,body_type,arrival_date,arrival_note,is_featured,created_at,vehicle_images(storage_path,width,height,alt_text,sort_order)";

export const DETAIL_COLUMNS =
  "id,slug,title,brand,model,variant,category,status,is_published,price_amount,currency,price_on_request,year,mileage_km,fuel_type,transmission,engine_displacement_cc,power_kw,body_type,exterior_color,drivetrain,doors,seats,description,equipment,stock_ref,public_vin,arrival_date,arrival_note,sold_at,seo_title,seo_description,is_featured,created_at,updated_at,vehicle_images(id,storage_path,width,height,alt_text,sort_order)";

const SETTINGS_COLUMNS =
  "business_name,street_address,city,postal_code,country_code,phone,email,open_24_7,opening_hours,instagram_url,facebook_url,viber_number,whatsapp_number,maps_url,latitude,longitude,hero_title,hero_subtitle,about_text,reserved_display,sold_display,default_currency";

const FALLBACK_SETTINGS: SiteSettings = {
  business_name: "Auto Centar DEA",
  street_address: null,
  city: null,
  postal_code: null,
  country_code: "BA",
  phone: null,
  email: null,
  open_24_7: false,
  opening_hours: null,
  instagram_url: null,
  facebook_url: null,
  viber_number: null,
  whatsapp_number: null,
  maps_url: null,
  latitude: null,
  longitude: null,
  hero_title: null,
  hero_subtitle: null,
  about_text: null,
  reserved_display: "inline",
  sold_display: "archive",
  default_currency: "BAM",
};

class DataError extends Error {
  constructor(context: string, cause: { message: string; code?: string }) {
    super(`Greška pri dohvaćanju podataka (${context}): ${cause.code ?? ""} ${cause.message}`);
    this.name = "DataError";
  }
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const { data, error } = await publicClient().from("site_settings").select(SETTINGS_COLUMNS).eq("id", 1).maybeSingle();
  if (error) throw new DataError("postavke", error);
  return (data as SiteSettings | null) ?? FALLBACK_SETTINGS;
});

/** Koji se statusi prikazuju u glavnoj javnoj ponudi, prema postavkama salona. */
export function mainListingStatuses(settings: Pick<SiteSettings, "reserved_display" | "sold_display">): VehicleStatus[] {
  const statuses: VehicleStatus[] = ["available", "coming_soon"];
  if (settings.reserved_display === "inline") statuses.push("reserved");
  if (settings.sold_display === "inline") statuses.push("sold");
  return statuses;
}

/** Statusi koje kupac smije izričito filtrirati (skriveni nikad). */
export function filterableStatuses(settings: Pick<SiteSettings, "reserved_display" | "sold_display">): VehicleStatus[] {
  const statuses: VehicleStatus[] = ["available", "coming_soon"];
  if (settings.reserved_display !== "hidden") statuses.push("reserved");
  if (settings.sold_display !== "hidden") statuses.push("sold");
  return statuses;
}

function cardQuery() {
  return publicClient()
    .from("vehicles")
    .select(CARD_COLUMNS, { count: "exact" })
    .eq("is_published", true)
    .order("sort_order", { referencedTable: "vehicle_images", ascending: true })
    .limit(1, { referencedTable: "vehicle_images" });
}

export type ListingResult = { vehicles: VehicleCard[]; total: number; page: number; pageCount: number };

export async function searchVehicles(
  filters: VehicleFilters,
  settings: SiteSettings,
  options: { fixedStatus?: VehicleStatus; fixedCategory?: "premium" | "standard"; pageSize?: number } = {},
): Promise<ListingResult> {
  const pageSize = options.pageSize ?? PAGE_SIZE;
  let query = cardQuery();

  const allowed = filterableStatuses(settings);
  const requested = options.fixedStatus ?? filters.status;
  if (requested) {
    if (!allowed.includes(requested)) return { vehicles: [], total: 0, page: 1, pageCount: 0 };
    query = query.eq("status", requested);
  } else {
    query = query.in("status", mainListingStatuses(settings));
  }

  const category = options.fixedCategory ?? filters.kategorija;
  if (category) query = query.eq("category", category);
  if (filters.gorivo) query = query.eq("fuel_type", filters.gorivo);
  if (filters.mjenjac) query = query.eq("transmission", filters.mjenjac);
  if (filters.karoserija) query = query.eq("body_type", filters.karoserija);
  if (filters.cijenaOd !== undefined) query = query.gte("price_bam_minor", filters.cijenaOd * 100);
  if (filters.cijenaDo !== undefined) query = query.lte("price_bam_minor", filters.cijenaDo * 100);
  if (filters.godinaOd !== undefined) query = query.gte("year", filters.godinaOd);
  if (filters.godinaDo !== undefined) query = query.lte("year", filters.godinaDo);
  if (filters.kmOd !== undefined) query = query.gte("mileage_km", filters.kmOd);
  if (filters.kmDo !== undefined) query = query.lte("mileage_km", filters.kmDo);
  if (filters.q) {
    // Svaka riječ mora se pojaviti u nazivu, marki, modelu ili izvedbi.
    for (const word of filters.q.split(" ").slice(0, 5)) {
      const w = word.replace(/[%_]/g, "");
      if (w) query = query.or(`title.ilike.%${w}%,brand.ilike.%${w}%,model.ilike.%${w}%,variant.ilike.%${w}%`);
    }
  }

  switch (filters.sort) {
    case "najnovije":
      query = query.order("created_at", { ascending: false });
      break;
    case "cijena-uzlazno":
      query = query
        .order("price_on_request", { ascending: true })
        .order("price_bam_minor", { ascending: true, nullsFirst: false });
      break;
    case "cijena-silazno":
      query = query
        .order("price_on_request", { ascending: true })
        .order("price_bam_minor", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query
        .order("status_rank", { ascending: true })
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
  }
  query = query.order("id", { ascending: true }); // stabilan redoslijed za paginaciju

  const page = filters.stranica;
  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  // PostgREST vraća 416 kad je stranica izvan raspona — tretiramo kao prazan rezultat
  if (error && error.code !== "PGRST103") throw new DataError("popis vozila", error);
  const total = count ?? 0;
  return {
    vehicles: (data ?? []) as unknown as VehicleCard[],
    total,
    page,
    pageCount: Math.ceil(total / pageSize),
  };
}

async function list(
  build: (q: ReturnType<typeof cardQuery>) => ReturnType<typeof cardQuery>,
  context: string,
): Promise<VehicleCard[]> {
  const { data, error } = await build(cardQuery());
  if (error) throw new DataError(context, error);
  return (data ?? []) as unknown as VehicleCard[];
}

export async function getHomeSections(settings: SiteSettings) {
  const activeStatuses: VehicleStatus[] = settings.reserved_display === "inline" ? ["available", "reserved"] : ["available"];
  const [premium, latest, comingSoon, reserved, sold] = await Promise.all([
    list(
      (q) =>
        q
          .eq("category", "premium")
          .in("status", activeStatuses)
          .order("is_featured", { ascending: false })
          .order("status_rank", { ascending: true })
          .order("created_at", { ascending: false })
          .limit(3),
      "premium",
    ),
    list(
      (q) =>
        q
          .eq("category", "standard")
          .in("status", activeStatuses)
          .order("is_featured", { ascending: false })
          .order("status_rank", { ascending: true })
          .order("created_at", { ascending: false })
          .limit(6),
      "najnovije",
    ),
    list((q) => q.eq("status", "coming_soon").order("arrival_date", { ascending: true, nullsFirst: false }).limit(6), "u dolasku"),
    settings.reserved_display === "separate"
      ? list((q) => q.eq("status", "reserved").order("created_at", { ascending: false }).limit(3), "rezervirano")
      : Promise.resolve([]),
    settings.sold_display === "archive"
      ? list((q) => q.eq("status", "sold").order("sold_at", { ascending: false, nullsFirst: false }).limit(4), "prodano")
      : Promise.resolve([]),
  ]);
  return { premium, latest, comingSoon, reserved, sold };
}

export const getVehicleBySlug = cache(async (slug: string): Promise<VehicleDetail | null> => {
  if (!/^[a-z0-9-]{3,120}$/.test(slug)) return null;
  const { data, error } = await publicClient()
    .from("vehicles")
    .select(DETAIL_COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .order("sort_order", { referencedTable: "vehicle_images", ascending: true })
    .maybeSingle();
  if (error) throw new DataError("vozilo", error);
  return data as unknown as VehicleDetail | null;
});

export async function getRelatedVehicles(v: Pick<VehicleDetail, "id" | "category">): Promise<VehicleCard[]> {
  return list(
    (q) =>
      q
        .eq("category", v.category)
        .eq("status", "available")
        .neq("id", v.id)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3),
    "slična vozila",
  );
}

/** Vozila za sitemap: samo objavljena i indeksirana (bez prodanih i arhiviranih). */
export async function getIndexableVehicles(settings: SiteSettings) {
  const statuses: VehicleStatus[] = ["available", "coming_soon"];
  if (settings.reserved_display !== "hidden") statuses.push("reserved");
  const { data, error } = await publicClient()
    .from("vehicles")
    .select("slug,updated_at")
    .eq("is_published", true)
    .in("status", statuses)
    .order("updated_at", { ascending: false })
    .limit(5000);
  if (error) throw new DataError("sitemap", error);
  return (data ?? []) as { slug: string; updated_at: string }[];
}

/** Vrijednosti za padajuće izbornike filtera (samo marke koje stvarno postoje). */
export async function getAvailableBrands(): Promise<string[]> {
  const { data, error } = await publicClient()
    .from("vehicles")
    .select("brand")
    .eq("is_published", true)
    .in("status", ["available", "coming_soon", "reserved"])
    .limit(1000);
  if (error) throw new DataError("marke", error);
  return [...new Set((data ?? []).map((r) => (r as { brand: string }).brand))].sort((a, b) => a.localeCompare(b, "hr"));
}

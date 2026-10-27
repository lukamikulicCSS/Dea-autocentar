import {
  BODY_TYPES,
  CATEGORIES,
  FUEL_TYPES,
  PUBLIC_STATUSES,
  TRANSMISSIONS,
  isOneOf,
  type BodyType,
  type FuelType,
  type Transmission,
  type VehicleCategory,
} from "@/lib/vehicles/constants";

export const SORTS = ["preporuceno", "najnovije", "cijena-uzlazno", "cijena-silazno"] as const;
export type Sort = (typeof SORTS)[number];
export const SORT_LABELS: Record<Sort, string> = {
  preporuceno: "Preporučeno",
  najnovije: "Najnovije",
  "cijena-uzlazno": "Cijena: od najniže",
  "cijena-silazno": "Cijena: od najviše",
};

export type PublicStatusFilter = (typeof PUBLIC_STATUSES)[number];

export type VehicleFilters = {
  q?: string;
  kategorija?: VehicleCategory;
  status?: PublicStatusFilter;
  gorivo?: FuelType;
  mjenjac?: Transmission;
  karoserija?: BodyType;
  cijenaOd?: number; // KM (cijeli iznos)
  cijenaDo?: number;
  godinaOd?: number;
  godinaDo?: number;
  kmOd?: number;
  kmDo?: number;
  sort: Sort;
  stranica: number;
};

type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s === undefined ? undefined : s.trim();
}

function int(v: string | undefined, min: number, max: number): number | undefined {
  if (!v || !/^\d{1,10}$/.test(v)) return undefined;
  const n = Number(v);
  return n >= min && n <= max ? n : undefined;
}

/**
 * Čišćenje teksta pretrage: dopušta slova, brojke, razmak i crticu.
 * Uklanja znakove koji imaju posebno značenje u PostgREST filterima (, . ( ) * : %).
 */
export function sanitizeQuery(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return cleaned.length >= 1 ? cleaned : undefined;
}

export function parseFilters(params: RawParams): VehicleFilters {
  const sort = first(params.sort);
  const kategorija = first(params.kategorija);
  const status = first(params.status);
  const gorivo = first(params.gorivo);
  const mjenjac = first(params.mjenjac);
  const karoserija = first(params.karoserija);
  return {
    q: sanitizeQuery(first(params.q)),
    kategorija: isOneOf(CATEGORIES, kategorija) ? kategorija : undefined,
    status: isOneOf(PUBLIC_STATUSES, status) ? status : undefined,
    gorivo: isOneOf(FUEL_TYPES, gorivo) ? gorivo : undefined,
    mjenjac: isOneOf(TRANSMISSIONS, mjenjac) ? mjenjac : undefined,
    karoserija: isOneOf(BODY_TYPES, karoserija) ? karoserija : undefined,
    cijenaOd: int(first(params.cijenaOd), 0, 100_000_000),
    cijenaDo: int(first(params.cijenaDo), 0, 100_000_000),
    godinaOd: int(first(params.godinaOd), 1900, 2100),
    godinaDo: int(first(params.godinaDo), 1900, 2100),
    kmOd: int(first(params.kmOd), 0, 5_000_000),
    kmDo: int(first(params.kmDo), 0, 5_000_000),
    sort: isOneOf(SORTS, sort) ? sort : "preporuceno",
    stranica: int(first(params.stranica), 1, 1000) ?? 1,
  };
}

/** Pretvara filtere natrag u URL (dijeljivi linkovi). Izostavlja zadane vrijednosti. */
export function filtersToSearch(f: Partial<VehicleFilters>): string {
  const p = new URLSearchParams();
  const entries: [string, string | number | undefined][] = [
    ["q", f.q],
    ["kategorija", f.kategorija],
    ["status", f.status],
    ["gorivo", f.gorivo],
    ["mjenjac", f.mjenjac],
    ["karoserija", f.karoserija],
    ["cijenaOd", f.cijenaOd],
    ["cijenaDo", f.cijenaDo],
    ["godinaOd", f.godinaOd],
    ["godinaDo", f.godinaDo],
    ["kmOd", f.kmOd],
    ["kmDo", f.kmDo],
    ["sort", f.sort && f.sort !== "preporuceno" ? f.sort : undefined],
    ["stranica", f.stranica && f.stranica > 1 ? f.stranica : undefined],
  ];
  for (const [k, v] of entries) if (v !== undefined && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function activeFilterCount(f: VehicleFilters): number {
  return [
    f.q,
    f.kategorija,
    f.status,
    f.gorivo,
    f.mjenjac,
    f.karoserija,
    f.cijenaOd,
    f.cijenaDo,
    f.godinaOd,
    f.godinaDo,
    f.kmOd,
    f.kmDo,
  ].filter((v) => v !== undefined).length;
}

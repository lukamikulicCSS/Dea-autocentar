import Link from "next/link";
import { ImageOff } from "lucide-react";
import { formatArrival, formatKm, formatPower, formatPrice } from "@/lib/format";
import { vehicleAlt, vehicleImageUrl } from "@/lib/images";
import type { VehicleCard as Card } from "@/lib/types";
import { FUEL_LABELS, TRANSMISSION_LABELS, type VehicleStatus } from "@/lib/vehicles/constants";
import { activeFilterCount, filtersToSearch, type VehicleFilters } from "@/lib/vehicles/filters";
import type { ListingResult } from "@/lib/vehicles/queries";
import type { SuggestScope } from "@/lib/vehicles/suggest";
import { CoverPhoto, fitsNaturalFrame, photoRatio } from "./CoverPhoto";
import { EmptyState } from "./EmptyState";
import { Filters, SortSelect } from "./Filters";
import { Pagination } from "./Pagination";
import { StatusBadge } from "./StatusBadge";
import { Specs, VehicleGrid } from "./VehicleCard";

function resultLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} vozilo`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} vozila`;
  return `${n} vozila`;
}

/**
 * Urednički prikaz premium vozila: veća fotografija i više podataka.
 *
 * Fotografija se prikazuje CIJELA i bez zamućenih traka sa strane: okvir uvijek ima
 * omjer same fotografije. Na velikom ekranu širina stupca s fotografijom računa se iz
 * tog omjera (najviše 46 % kartice i najviše 28rem visine), pa kartica ostaje
 * kompaktna, a tekst dobiva ostatak širine. Fotografija je okomito centrirana uz tekst.
 */
export function EditorialCard({ vehicle, priority }: { vehicle: Card; priority?: boolean }) {
  const cover = vehicle.vehicle_images[0];
  const natural = fitsNaturalFrame(cover);
  return (
    <article
      className="group relative grid overflow-hidden rounded-sm bg-asphalt text-white lg:grid-cols-[min(46%,calc(var(--ar)*28rem))_minmax(0,1fr)] lg:items-center"
      style={{ "--ar": String(photoRatio(cover)) } as React.CSSProperties}
    >
      <div className="relative aspect-[var(--ar)] w-full overflow-hidden bg-graphite">
        {cover ? (
          <CoverPhoto
            src={vehicleImageUrl(cover.storage_path)}
            alt={vehicleAlt(vehicle, cover, 0)}
            priority={priority}
            sizes="(min-width: 1024px) 46vw, 100vw"
            backdrop={natural ? "never" : "always"}
            className="transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-fog">
            <ImageOff className="size-8" aria-hidden="true" />
          </div>
        )}
        {vehicle.status !== "available" && <StatusBadge status={vehicle.status} className="absolute left-4 top-4" />}
      </div>
      <div className="flex flex-col justify-center gap-7 p-6 sm:p-8 lg:px-10">
        <div>
          <p className="text-sm font-medium text-fog">{vehicle.brand}</p>
          <h3 className="mt-1 text-[1.5rem] leading-tight sm:text-[1.625rem]">
            <Link href={`/vozila/${vehicle.slug}`} className="after:absolute after:inset-0 after:content-['']">
              {vehicle.title}
            </Link>
          </h3>
          {vehicle.variant && <p className="mt-2 text-fog">{vehicle.variant}</p>}
          {vehicle.status === "coming_soon" && formatArrival(vehicle) && (
            <p className="mt-3 text-sm font-medium text-steel-light">{formatArrival(vehicle)}</p>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line-dark pt-6 text-sm xl:grid-cols-4">
          <div>
            <dt className="text-fog">Godina</dt>
            <dd className="tabular mt-0.5 font-semibold">{vehicle.year}.</dd>
          </div>
          <div>
            <dt className="text-fog">Kilometraža</dt>
            <dd className="tabular mt-0.5 font-semibold">{formatKm(vehicle.mileage_km)}</dd>
          </div>
          {vehicle.power_kw && (
            <div>
              <dt className="text-fog">Snaga</dt>
              <dd className="tabular mt-0.5 font-semibold">{formatPower(vehicle.power_kw)}</dd>
            </div>
          )}
          <div>
            <dt className="text-fog">Pogon i mjenjač</dt>
            <dd className="mt-0.5 font-semibold">
              {FUEL_LABELS[vehicle.fuel_type]}, {TRANSMISSION_LABELS[vehicle.transmission].toLowerCase()}
            </dd>
          </div>
        </dl>
        <p className="tabular text-2xl font-bold" style={{ fontStretch: "112%" }}>
          {vehicle.status === "sold" ? "Prodano" : formatPrice(vehicle)}
        </p>
      </div>
    </article>
  );
}

export function VehicleListing({
  result,
  filters,
  statuses,
  suggestScope,
  basePath,
  showCategory = true,
  showStatus = true,
  variant = "grid",
  emptyTitle = "Nema vozila prema odabranim kriterijima",
  emptyText = "Pokušajte proširiti raspon cijene ili godine, ili uklonite neki od filtera.",
}: {
  result: ListingResult;
  filters: VehicleFilters;
  statuses: VehicleStatus[];
  suggestScope: SuggestScope;
  basePath: string;
  showCategory?: boolean;
  showStatus?: boolean;
  variant?: "grid" | "editorial";
  emptyTitle?: string;
  emptyText?: string;
}) {
  const active = activeFilterCount(filters);
  return (
    <div className="wrap grid gap-8 py-10 lg:grid-cols-[320px_1fr] lg:gap-10 lg:py-14">
      <Filters filters={filters} statuses={statuses} showCategory={showCategory} showStatus={showStatus} activeCount={active} suggestScope={suggestScope} />

      <div>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <p className="tabular font-semibold" aria-live="polite">
            {result.total === 0 ? "Nema rezultata" : resultLabel(result.total)}
            {active > 0 && (
              <a href={basePath} className="ml-3 text-sm font-normal text-steel underline underline-offset-2">
                Očisti filtere
              </a>
            )}
          </p>
          <SortSelect value={filters.sort} />
        </div>

        {result.vehicles.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            text={emptyText}
            action={active > 0 ? { href: basePath, label: "Očisti filtere" } : { href: "/kontakt", label: "Javite nam što tražite" }}
          />
        ) : variant === "editorial" ? (
          <ul className="space-y-8">
            {result.vehicles.map((v, i) => (
              <li key={v.id}>
                <EditorialCard vehicle={v} priority={i === 0} />
              </li>
            ))}
          </ul>
        ) : (
          <VehicleGrid vehicles={result.vehicles} priorityFirst />
        )}

        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          hrefFor={(p) => `${basePath}${filtersToSearch({ ...filters, stranica: p })}`}
        />
      </div>
    </div>
  );
}

export { Specs };

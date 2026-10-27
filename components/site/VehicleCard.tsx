import Link from "next/link";
import { ImageOff } from "lucide-react";
import { formatArrival, formatKm, formatPrice } from "@/lib/format";
import { vehicleAlt, vehicleImageUrl } from "@/lib/images";
import type { VehicleCard as Card } from "@/lib/types";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/vehicles/constants";
import { CoverPhoto, fitsNaturalFrame, photoRatio } from "./CoverPhoto";
import { StatusBadge } from "./StatusBadge";

export function Specs({ items, className = "" }: { items: (string | null | undefined)[]; className?: string }) {
  const list = items.filter(Boolean) as string[];
  return (
    <ul className={`flex flex-wrap items-center text-[0.8125rem] text-ink-muted ${className}`}>
      {list.map((item, i) => (
        <li key={item + i} className={`tabular ${i > 0 ? "ml-2.5 border-l border-line pl-2.5" : ""}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function VehicleCard({
  vehicle,
  priority = false,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  tone = "light",
  compact = false,
}: {
  vehicle: Card;
  priority?: boolean;
  sizes?: string;
  tone?: "light" | "dark";
  /** Više kartica u retku i na mobitelu → jednak okvir 4:3 (inače mobitel prati omjer fotografije) */
  compact?: boolean;
}) {
  const cover = vehicle.vehicle_images[0];
  const arrival = vehicle.status === "coming_soon" ? formatArrival(vehicle) : null;
  const dark = tone === "dark";
  return (
    <article className="group relative">
      <div
        className={`relative overflow-hidden rounded-sm ${compact ? "aspect-[4/3]" : "aspect-[var(--ar)] sm:aspect-[4/3]"} ${dark ? "bg-graphite" : "bg-asphalt"}`}
        style={{ "--ar": String(photoRatio(cover)) } as React.CSSProperties}
      >
        {cover ? (
          <CoverPhoto
            src={vehicleImageUrl(cover.storage_path)}
            alt={vehicleAlt(vehicle, cover, 0)}
            sizes={sizes}
            priority={priority}
            backdrop={!compact && fitsNaturalFrame(cover) ? "sm" : "always"}
            className={`transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.025] ${
              vehicle.status === "sold" ? "grayscale-[35%]" : ""
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-muted">
            <ImageOff className="size-8" aria-hidden="true" />
            <span className="sr-only">Fotografija još nije dodana</span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {vehicle.status !== "available" && <StatusBadge status={vehicle.status} />}
          {vehicle.category === "premium" && (
            <span className="inline-flex items-center rounded-sm bg-asphalt/85 px-2 py-1 text-[0.6875rem] font-bold uppercase leading-none tracking-[0.04em] text-white">
              Premium
            </span>
          )}
        </div>
      </div>

      <div className="pt-4">
        <h3 className={`text-[1.0625rem] leading-snug ${dark ? "text-white" : "text-ink"}`} style={{ fontStretch: "112%" }}>
          <Link href={`/vozila/${vehicle.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {vehicle.title}
          </Link>
        </h3>
        <Specs
          className={`mt-2 ${dark ? "[&_li]:border-line-dark [&_li]:text-fog" : ""}`}
          items={[
            String(vehicle.year),
            formatKm(vehicle.mileage_km),
            FUEL_LABELS[vehicle.fuel_type],
            TRANSMISSION_LABELS[vehicle.transmission],
          ]}
        />
        {arrival && <p className={`mt-2 text-[0.8125rem] font-medium ${dark ? "text-steel-light" : "text-steel"}`}>{arrival}</p>}
        <p className={`tabular mt-3 text-xl font-bold ${dark ? "text-white" : "text-ink"} ${vehicle.status === "sold" ? "opacity-60" : ""}`} style={{ fontStretch: "110%" }}>
          {vehicle.status === "sold" ? "Prodano" : formatPrice(vehicle)}
        </p>
      </div>
    </article>
  );
}

export function VehicleGrid({ vehicles, tone = "light", priorityFirst = false }: { vehicles: Card[]; tone?: "light" | "dark"; priorityFirst?: boolean }) {
  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((v, i) => (
        <li key={v.id}>
          <VehicleCard vehicle={v} tone={tone} priority={priorityFirst && i < 2} />
        </li>
      ))}
    </ul>
  );
}

import { STATUS_LABELS, type VehicleStatus } from "@/lib/vehicles/constants";

const STYLES: Record<VehicleStatus, string> = {
  available: "bg-status-available text-white",
  coming_soon: "bg-status-coming text-white",
  reserved: "bg-status-reserved text-white",
  sold: "bg-status-sold text-white",
  archived: "bg-ink-muted text-white",
};

/** Oznaka statusa: boja + tekst (nikad samo boja). */
export function StatusBadge({ status, className = "" }: { status: VehicleStatus; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-1 text-[0.6875rem] font-bold uppercase leading-none tracking-[0.04em] ${STYLES[status]} ${className}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

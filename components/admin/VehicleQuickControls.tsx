"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { Copy, Eye, Pencil, Star, Trash2 } from "lucide-react";
import { deleteVehicle, duplicateVehicle, quickUpdateVehicle } from "@/app/admin/actions/vehicles";
import { STATUS_LABELS, VEHICLE_STATUSES, type VehicleStatus } from "@/lib/vehicles/constants";
import { ConfirmButton } from "./ConfirmButton";

type State = { status: VehicleStatus; is_published: boolean; is_featured: boolean };

/** Brze radnje u popisu vozila: status, objava i izdvajanje bez otvaranja forme. */
export function VehicleQuickControls({
  id,
  title,
  slug,
  initial,
  imageCount,
}: {
  id: string;
  title: string;
  slug: string;
  initial: State;
  imageCount: number;
}) {
  const [state, setOptimistic] = useOptimistic(initial, (s: State, patch: Partial<State>) => ({ ...s, ...patch }));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function update(field: keyof State, value: string, patch: Partial<State>) {
    setError(null);
    start(async () => {
      setOptimistic(patch);
      const res = await quickUpdateVehicle(id, field, value);
      if (!res.ok) setError(res.message);
    });
  }

  return (
    <div className="flex flex-col gap-2" aria-busy={pending}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`st-${id}`}>Status vozila {title}</label>
        <select
          id={`st-${id}`}
          value={state.status}
          onChange={(e) => update("status", e.target.value, { status: e.target.value as VehicleStatus })}
          className="field min-h-10 w-auto py-1.5 text-sm"
        >
          {VEHICLE_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <button
          type="button"
          role="switch"
          aria-checked={state.is_published}
          onClick={() => update("is_published", String(!state.is_published), { is_published: !state.is_published })}
          className={`btn btn-sm ${state.is_published ? "bg-status-available text-white" : "btn-outline"}`}
          title={imageCount === 0 && !state.is_published ? "Za objavu dodajte barem jednu fotografiju" : undefined}
        >
          {state.is_published ? "Objavljeno" : "Nacrt"}
        </button>

        <button
          type="button"
          role="switch"
          aria-checked={state.is_featured}
          aria-label={state.is_featured ? "Ukloni s početne" : "Izdvoji na početnoj"}
          disabled={state.status === "sold" || state.status === "archived"}
          onClick={() => update("is_featured", String(!state.is_featured), { is_featured: !state.is_featured })}
          className={`btn btn-sm px-2.5 ${state.is_featured ? "btn-dark" : "btn-outline"}`}
          title="Izdvojeno na početnoj"
        >
          <Star className={`size-4 ${state.is_featured ? "fill-current" : ""}`} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Link href={`/admin/vozila/${id}`} className="btn btn-sm btn-outline">
          <Pencil className="size-3.5" aria-hidden="true" />
          Uredi
        </Link>
        <Link href={state.is_published ? `/vozila/${slug}` : `/admin/vozila/${id}/pregled`} target="_blank" className="btn btn-sm btn-outline">
          <Eye className="size-3.5" aria-hidden="true" />
          {state.is_published ? "Otvori" : "Pregled"}
        </Link>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => start(async () => { const r = await duplicateVehicle(id); if (r && !r.ok) setError(r.message); })}>
          <Copy className="size-3.5" aria-hidden="true" />
          Kopiraj
        </button>
        <ConfirmButton
          label="Obriši"
          title="Trajno obrisati vozilo?"
          description={`„${title}” i sve njegove fotografije bit će trajno obrisani. Ako je vozilo prodano, umjesto brisanja možete promijeniti status u „Prodano” ili „Arhivirano”.`}
          confirmLabel="Obriši trajno"
          requireText="OBRIŠI"
          onConfirm={(typed) => deleteVehicle(id, typed)}
          className="btn btn-sm btn-outline text-red-deep"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          Obriši
        </ConfirmButton>
      </div>
      {error && <p role="alert" className="error-text mt-0">{error}</p>}
    </div>
  );
}

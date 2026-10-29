"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import {
  BODY_LABELS,
  BODY_TYPES,
  CATEGORY_LABELS,
  FUEL_LABELS,
  FUEL_TYPES,
  STATUS_LABELS,
  TRANSMISSION_LABELS,
  TRANSMISSIONS,
  type VehicleStatus,
} from "@/lib/vehicles/constants";
import { SORT_LABELS, SORTS, type VehicleFilters } from "@/lib/vehicles/filters";
import type { SuggestScope } from "@/lib/vehicles/suggest";
import { KmRange } from "./KmRange";
import { SearchSuggest } from "./SearchSuggest";

type Props = {
  filters: VehicleFilters;
  statuses: VehicleStatus[];
  showCategory?: boolean;
  showStatus?: boolean;
  activeCount: number;
  suggestScope: SuggestScope;
};

const FIRST_YEAR = 1990;
function years(): number[] {
  const last = new Date().getFullYear() + 1;
  return Array.from({ length: last - FIRST_YEAR + 1 }, (_, i) => last - i);
}

/** Pretvara formu u čisti URL (bez praznih parametara) — dijeljive poveznice. */
function useSubmit() {
  const router = useRouter();
  const pathname = usePathname();
  return (form: HTMLFormElement) => {
    const params = new URLSearchParams();
    for (const [k, v] of new FormData(form).entries()) {
      if (typeof v === "string" && v.trim() !== "" && !(k === "sort" && v === "preporuceno")) params.set(k, v.trim());
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
}

function FilterFields({ filters, statuses, showCategory = true, showStatus = true, suggestScope, idPrefix }: Props & { idPrefix: string }) {
  const id = (n: string) => `${idPrefix}-${n}`;
  const yearList = years();
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor={id("q")} className="label">Marka, model ili ključna riječ</label>
        <SearchSuggest id={id("q")} defaultValue={filters.q} placeholder="npr. Porsche" scope={suggestScope} className="field" />
      </div>

      {showCategory && (
        <div>
          <label htmlFor={id("kategorija")} className="label">Kategorija</label>
          <select id={id("kategorija")} name="kategorija" defaultValue={filters.kategorija ?? ""} className="field">
            <option value="">Sve kategorije</option>
            <option value="premium">{CATEGORY_LABELS.premium}</option>
            <option value="standard">{CATEGORY_LABELS.standard}</option>
          </select>
        </div>
      )}

      {showStatus && (
        <div>
          <label htmlFor={id("status")} className="label">Dostupnost</label>
          <select id={id("status")} name="status" defaultValue={filters.status ?? ""} className="field">
            <option value="">Aktualna ponuda</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={id("godinaOd")} className="label">Godina od</label>
          <select id={id("godinaOd")} name="godinaOd" defaultValue={filters.godinaOd ?? ""} className="field tabular">
            <option value="">—</option>
            {yearList.map((y) => (
              <option key={y} value={y}>{y}.</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={id("godinaDo")} className="label">Godina do</label>
          <select id={id("godinaDo")} name="godinaDo" defaultValue={filters.godinaDo ?? ""} className="field tabular">
            <option value="">—</option>
            {yearList.map((y) => (
              <option key={y} value={y}>{y}.</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={id("cijenaOd")} className="label">Cijena od (KM)</label>
          <input id={id("cijenaOd")} name="cijenaOd" inputMode="numeric" pattern="[0-9]*" defaultValue={filters.cijenaOd} className="field tabular" placeholder="npr. 10000" />
        </div>
        <div>
          <label htmlFor={id("cijenaDo")} className="label">Cijena do (KM)</label>
          <input id={id("cijenaDo")} name="cijenaDo" inputMode="numeric" pattern="[0-9]*" defaultValue={filters.cijenaDo} className="field tabular" placeholder="npr. 50000" />
        </div>
      </div>

      {/* key: klizač se vraća na početak kad se filteri promijene izvana */}
      <KmRange key={`${filters.kmOd ?? ""}-${filters.kmDo ?? ""}`} idPrefix={idPrefix} kmOd={filters.kmOd} kmDo={filters.kmDo} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={id("gorivo")} className="label">Gorivo</label>
          <select id={id("gorivo")} name="gorivo" defaultValue={filters.gorivo ?? ""} className="field">
            <option value="">Sva goriva</option>
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f}>{FUEL_LABELS[f]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={id("mjenjac")} className="label">Mjenjač</label>
          <select id={id("mjenjac")} name="mjenjac" defaultValue={filters.mjenjac ?? ""} className="field">
            <option value="">Svi mjenjači</option>
            {TRANSMISSIONS.map((t) => (
              <option key={t} value={t}>{TRANSMISSION_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={id("karoserija")} className="label">Karoserija</label>
        <select id={id("karoserija")} name="karoserija" defaultValue={filters.karoserija ?? ""} className="field">
          <option value="">Sve karoserije</option>
          {BODY_TYPES.map((b) => (
            <option key={b} value={b}>{BODY_LABELS[b]}</option>
          ))}
        </select>
      </div>
      <input type="hidden" name="sort" value={filters.sort} />
    </div>
  );
}

/** Bočni filteri (desktop) + gumb koji otvara panel s filterima (mobitel/tablet). */
export function Filters(props: Props) {
  const submit = useSubmit();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit(e.currentTarget);
    dialogRef.current?.close();
  };

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block" aria-label="Filteri">
        <form method="get" action={pathname} onSubmit={onSubmit} className="sticky top-24 rounded-md border border-line bg-surface p-5">
          <FilterFields {...props} idPrefix="d" />
          <div className="mt-6 flex gap-2">
            <button type="submit" className="btn btn-dark flex-1">Prikaži vozila</button>
            {props.activeCount > 0 && (
              <a href={pathname} className="btn btn-outline px-3" aria-label="Resetiraj filtere" title="Resetiraj filtere">
                <RotateCcw className="size-4" aria-hidden="true" />
              </a>
            )}
          </div>
        </form>
      </aside>

      {/* Mobitel i tablet: pravokutni gumb (nije hamburger) otvara panel */}
      <div className="lg:hidden">
        <button type="button" onClick={() => dialogRef.current?.showModal()} className="btn btn-outline w-full justify-between">
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            Filteri i pretraga
          </span>
          {props.activeCount > 0 && (
            <span className="tabular rounded-sm bg-red px-2 py-1 text-xs text-white">{props.activeCount}</span>
          )}
        </button>
        <dialog ref={dialogRef} className="sheet" aria-labelledby="filteri-naslov">
          <div className="flex h-full flex-col justify-end">
            <form
              method="get"
              action={pathname}
              onSubmit={onSubmit}
              className="sheet-panel flex max-h-[92dvh] flex-col rounded-t-md bg-paper"
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h2 id="filteri-naslov" className="text-lg" style={{ fontStretch: "110%" }}>Filteri</h2>
                <button type="button" onClick={() => dialogRef.current?.close()} className="btn btn-sm btn-outline" aria-label="Zatvori filtere">
                  <X className="size-4" aria-hidden="true" />
                  Zatvori
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
                <FilterFields {...props} idPrefix="m" />
                {props.activeCount > 0 && (
                  <a href={pathname} className="btn btn-outline mt-6 w-full">
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Resetiraj filtere
                  </a>
                )}
              </div>
              <div className="border-t border-line bg-surface px-4 py-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
                <button type="submit" className="btn btn-primary w-full">Prikaži vozila</button>
              </div>
            </form>
          </div>
        </dialog>
      </div>
    </>
  );
}

/** Sortiranje rezultata — mijenja URL odmah pri odabiru. */
export function SortSelect({ value }: { value: VehicleFilters["sort"] }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="shrink-0 text-sm text-ink-muted">Poredaj:</label>
      <select
        id="sort"
        value={value}
        onChange={(e) => {
          const params = new URLSearchParams(window.location.search);
          params.delete("stranica");
          if (e.target.value === "preporuceno") params.delete("sort");
          else params.set("sort", e.target.value);
          const qs = params.toString();
          router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        }}
        className="field min-h-10 w-auto py-1.5 text-[0.9375rem]"
      >
        {SORTS.map((s) => (
          <option key={s} value={s}>{SORT_LABELS[s]}</option>
        ))}
      </select>
    </div>
  );
}

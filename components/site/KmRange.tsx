"use client";

import { useState } from "react";

export const KM_MAX = 300_000;
const STEP = 5_000;

const fmt = (n: number) => n.toLocaleString("hr-HR");

/**
 * Klizač kilometraže s dva hvatišta (od–do).
 * Vrijednosti idu u skrivena polja kmOd/kmDo; krajnje vrijednosti (0 i 300.000+)
 * znače "bez ograničenja" i ne dodaju se u URL.
 */
export function KmRange({ idPrefix, kmOd, kmDo }: { idPrefix: string; kmOd?: number; kmDo?: number }) {
  const [lo, setLo] = useState(() => Math.min(kmOd ?? 0, KM_MAX - STEP));
  const [hi, setHi] = useState(() => Math.min(Math.max(kmDo ?? KM_MAX, (kmOd ?? 0) + STEP), KM_MAX));

  const loPct = (lo / KM_MAX) * 100;
  const hiPct = (hi / KM_MAX) * 100;
  const hiLabel = hi >= KM_MAX ? `${fmt(KM_MAX)}+` : fmt(hi);
  const summary =
    lo === 0 && hi >= KM_MAX ? "Sve kilometraže" : lo === 0 ? `do ${hiLabel} km` : hi >= KM_MAX ? `od ${fmt(lo)} km` : `${fmt(lo)} – ${hiLabel} km`;

  return (
    <fieldset>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <legend className="label mb-0">Kilometraža</legend>
        <output htmlFor={`${idPrefix}-km-od ${idPrefix}-km-do`} className="tabular text-sm font-semibold text-ink" aria-live="polite">
          {summary}
        </output>
      </div>

      <div className="range-dual relative h-11">
        {/* Staza i označeni raspon */}
        <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line" />
        <div
          aria-hidden="true"
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-red"
          style={{ left: `${loPct}%`, right: `${100 - hiPct}%` }}
        />
        <input
          id={`${idPrefix}-km-od`}
          type="range"
          min={0}
          max={KM_MAX}
          step={STEP}
          value={lo}
          aria-label="Kilometraža od"
          aria-valuetext={`${fmt(lo)} km`}
          onChange={(e) => setLo(Math.min(Number(e.target.value), hi - STEP))}
          // Kad su hvatišta na desnom kraju, donje mora biti iznad da se može pomaknuti
          style={{ zIndex: lo > KM_MAX - STEP * 4 ? 3 : 2 }}
        />
        <input
          id={`${idPrefix}-km-do`}
          type="range"
          min={0}
          max={KM_MAX}
          step={STEP}
          value={hi}
          aria-label="Kilometraža do"
          aria-valuetext={hi >= KM_MAX ? "bez ograničenja" : `${fmt(hi)} km`}
          onChange={(e) => setHi(Math.max(Number(e.target.value), lo + STEP))}
        />
      </div>

      <div aria-hidden="true" className="tabular mt-1 flex justify-between text-xs text-ink-muted">
        <span>0 km</span>
        <span>{fmt(KM_MAX)}+ km</span>
      </div>

      <input type="hidden" name="kmOd" value={lo > 0 ? String(lo) : ""} />
      <input type="hidden" name="kmDo" value={hi < KM_MAX ? String(hi) : ""} />
    </fieldset>
  );
}

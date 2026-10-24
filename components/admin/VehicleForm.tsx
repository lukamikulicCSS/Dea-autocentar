"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, LoaderCircle } from "lucide-react";
import { saveVehicle, type VehicleFormState } from "@/app/admin/actions/vehicles";
import { moneyToInput } from "@/lib/format";
import {
  BODY_LABELS,
  BODY_TYPES,
  CATEGORY_LABELS,
  DRIVETRAIN_LABELS,
  DRIVETRAINS,
  FUEL_LABELS,
  FUEL_TYPES,
  STATUS_LABELS,
  TRANSMISSION_LABELS,
  TRANSMISSIONS,
  VEHICLE_STATUSES,
  type VehicleStatus,
} from "@/lib/vehicles/constants";
import { Notice } from "./Notice";

export type EditableVehicle = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  model: string;
  variant: string | null;
  category: "premium" | "standard";
  status: VehicleStatus;
  is_published: boolean;
  is_featured: boolean;
  price_amount: number | null;
  currency: "BAM" | "EUR";
  price_on_request: boolean;
  year: number;
  mileage_km: number;
  fuel_type: string;
  transmission: string;
  engine_displacement_cc: number | null;
  power_kw: number | null;
  body_type: string | null;
  exterior_color: string | null;
  drivetrain: string | null;
  doors: number | null;
  seats: number | null;
  description: string | null;
  equipment: string[];
  stock_ref: string | null;
  arrival_date: string | null;
  arrival_note: string | null;
  seo_title: string | null;
  seo_description: string | null;
  vin: string | null;
  show_vin: boolean;
  internal_note: string | null;
};

function toFormValues(v: EditableVehicle | null): Record<string, string> {
  if (!v) return { category: "standard", status: "available", currency: "BAM", fuel_type: "", transmission: "" };
  const s = (x: string | number | null | undefined) => (x === null || x === undefined ? "" : String(x));
  return {
    title: v.title,
    brand: v.brand,
    model: v.model,
    variant: s(v.variant),
    category: v.category,
    status: v.status,
    is_featured: v.is_featured ? "on" : "",
    price: moneyToInput(v.price_amount),
    currency: v.currency,
    price_on_request: v.price_on_request ? "on" : "",
    year: s(v.year),
    mileage_km: s(v.mileage_km),
    fuel_type: v.fuel_type,
    transmission: v.transmission,
    engine_displacement_cc: s(v.engine_displacement_cc),
    power_kw: s(v.power_kw),
    body_type: s(v.body_type),
    exterior_color: s(v.exterior_color),
    drivetrain: s(v.drivetrain),
    doors: s(v.doors),
    seats: s(v.seats),
    description: s(v.description),
    equipment: v.equipment.join("\n"),
    stock_ref: s(v.stock_ref),
    arrival_date: s(v.arrival_date),
    arrival_note: s(v.arrival_note),
    seo_title: s(v.seo_title),
    seo_description: s(v.seo_description),
    vin: s(v.vin),
    show_vin: v.show_vin ? "on" : "",
    internal_note: s(v.internal_note),
  };
}

function Section({ letter, title, description, children }: { letter: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-sm border border-line bg-surface p-4 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <div className="mb-5 flex items-baseline gap-3">
        <span className="tabular text-sm font-bold text-red" aria-hidden="true">{letter}</span>
        <div>
          <h2 className="text-lg" style={{ fontStretch: "105%" }}>{title}</h2>
          {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function VehicleForm({ vehicle }: { vehicle: EditableVehicle | null }) {
  const action = saveVehicle.bind(null, vehicle?.id ?? null);
  const [state, formAction, pending] = useActionState<VehicleFormState, FormData>(action, null);
  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const values = state && !state.ok && state.values ? state.values : toFormValues(vehicle);
  const [dirty, setDirty] = useState(false);
  const [priceOnRequest, setPriceOnRequest] = useState(values.price_on_request === "on");
  const [status, setStatus] = useState(values.status ?? "available");
  const formRef = useRef<HTMLFormElement>(null);
  const isNew = !vehicle;

  // Upozorenje na nespremljene promjene
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Pomakni na prvu grešku
  useEffect(() => {
    if (state && !state.ok && state.fieldErrors) {
      const first = Object.keys(state.fieldErrors)[0];
      const el = first ? formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`) : null;
      el?.focus();
    }
  }, [state]);

  const err = (name: string) =>
    errors[name] ? (
      <p id={`${name}-err`} className="error-text">{errors[name]}</p>
    ) : null;
  const inv = (name: string) => (errors[name] ? { "aria-invalid": true as const, "aria-describedby": `${name}-err` } : {});

  return (
    <form ref={formRef} action={formAction} onInput={() => setDirty(true)} onSubmit={() => setDirty(false)} className="space-y-5" noValidate>
      {state && (
        <div aria-live="polite">
          <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>
        </div>
      )}

      <Section letter="A" title="Osnovni podaci">
        <div className="sm:col-span-2">
          <label htmlFor="title" className="label">Naziv oglasa *</label>
          <input id="title" name="title" defaultValue={values.title} required maxLength={120} className="field" placeholder="npr. Audi A6 Avant 40 TDI quattro S line" {...inv("title")} />
          <p className="hint">Kratko i opisno — ovaj naziv vide kupci i Google.</p>
          {err("title")}
        </div>
        <div>
          <label htmlFor="brand" className="label">Marka *</label>
          <input id="brand" name="brand" defaultValue={values.brand} required maxLength={60} className="field" placeholder="Audi" {...inv("brand")} />
          {err("brand")}
        </div>
        <div>
          <label htmlFor="model" className="label">Model *</label>
          <input id="model" name="model" defaultValue={values.model} required maxLength={60} className="field" placeholder="A6" {...inv("model")} />
          {err("model")}
        </div>
        <div>
          <label htmlFor="variant" className="label">Izvedba / oprema</label>
          <input id="variant" name="variant" defaultValue={values.variant} maxLength={80} className="field" placeholder="40 TDI quattro S line" {...inv("variant")} />
          {err("variant")}
        </div>
        <div>
          <label htmlFor="stock_ref" className="label">Šifra oglasa</label>
          <input id="stock_ref" name="stock_ref" defaultValue={values.stock_ref} maxLength={40} className="field" placeholder="neobavezno" {...inv("stock_ref")} />
          <p className="hint">Prikazuje se kupcima ako je upisana.</p>
        </div>
      </Section>

      <Section letter="B" title="Cijena">
        <div>
          <label htmlFor="price" className="label">Cijena</label>
          <div className="flex">
            <input id="price" name="price" inputMode="decimal" defaultValue={values.price} readOnly={priceOnRequest} className={`field tabular rounded-r-none ${priceOnRequest ? "opacity-50" : ""}`} placeholder="45900" {...inv("price")} />
            <select name="currency" defaultValue={values.currency ?? "BAM"} className="field w-28 rounded-l-none border-l-0" aria-label="Valuta">
              <option value="BAM">KM</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <p className="hint">Upišite iznos bez točaka ili s točkama (45900 ili 45.900).</p>
          {err("price")}
        </div>
        <div className="flex items-start pt-0 sm:pt-7">
          <label className="flex min-h-12 cursor-pointer items-center gap-3">
            <input type="checkbox" name="price_on_request" defaultChecked={values.price_on_request === "on"} onChange={(e) => setPriceOnRequest(e.target.checked)} className="size-5 accent-[#d71920]" />
            <span>Cijena na upit <span className="block text-sm text-ink-muted">Cijena se ne prikazuje kupcima.</span></span>
          </label>
        </div>
      </Section>

      <Section letter="C" title="Kategorija i status" description="Status možete mijenjati i izravno iz popisa vozila.">
        <div>
          <label htmlFor="category" className="label">Kategorija *</label>
          <select id="category" name="category" defaultValue={values.category} className="field">
            <option value="standard">{CATEGORY_LABELS.standard}</option>
            <option value="premium">{CATEGORY_LABELS.premium}</option>
          </select>
          <p className="hint">Premium vozila imaju vlastitu stranicu i istaknuti prikaz.</p>
        </div>
        <div>
          <label htmlFor="status" className="label">Status *</label>
          <select id="status" name="status" defaultValue={values.status} onChange={(e) => setStatus(e.target.value as VehicleStatus)} className="field">
            {VEHICLE_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        {status === "coming_soon" && (
          <>
            <div>
              <label htmlFor="arrival_date" className="label">Očekivani datum dolaska</label>
              <input id="arrival_date" name="arrival_date" type="date" defaultValue={values.arrival_date} className="field" {...inv("arrival_date")} />
              {err("arrival_date")}
            </div>
            <div>
              <label htmlFor="arrival_note" className="label">ili približno razdoblje</label>
              <input id="arrival_note" name="arrival_note" defaultValue={values.arrival_note} maxLength={80} className="field" placeholder="npr. krajem studenog" />
              <p className="hint">Kupcima se uvijek prikazuje kao okvirni, nezajamčeni datum.</p>
            </div>
          </>
        )}
        {status !== "coming_soon" && (
          <>
            <input type="hidden" name="arrival_date" value={values.arrival_date ?? ""} />
            <input type="hidden" name="arrival_note" value={values.arrival_note ?? ""} />
          </>
        )}
        <label className="flex min-h-12 cursor-pointer items-center gap-3 sm:col-span-2">
          <input type="checkbox" name="is_featured" defaultChecked={values.is_featured === "on"} disabled={status === "sold" || status === "archived"} className="size-5 accent-[#d71920]" />
          <span>Izdvoji na početnoj stranici</span>
        </label>
      </Section>

      <Section letter="D" title="Tehnički podaci" description="Nepoznata neobavezna polja ostavite prazna — neće se prikazati.">
        <div>
          <label htmlFor="year" className="label">Godina proizvodnje *</label>
          <input id="year" name="year" inputMode="numeric" defaultValue={values.year} maxLength={4} className="field tabular" placeholder="2021" {...inv("year")} />
          {err("year")}
        </div>
        <div>
          <label htmlFor="mileage_km" className="label">Prijeđeni kilometri *</label>
          <input id="mileage_km" name="mileage_km" inputMode="numeric" defaultValue={values.mileage_km} className="field tabular" placeholder="85000" {...inv("mileage_km")} />
          {err("mileage_km")}
        </div>
        <div>
          <label htmlFor="fuel_type" className="label">Gorivo *</label>
          <select id="fuel_type" name="fuel_type" defaultValue={values.fuel_type} className="field" {...inv("fuel_type")}>
            <option value="" disabled>Odaberite</option>
            {FUEL_TYPES.map((f) => <option key={f} value={f}>{FUEL_LABELS[f]}</option>)}
          </select>
          {err("fuel_type")}
        </div>
        <div>
          <label htmlFor="transmission" className="label">Mjenjač *</label>
          <select id="transmission" name="transmission" defaultValue={values.transmission} className="field" {...inv("transmission")}>
            <option value="" disabled>Odaberite</option>
            {TRANSMISSIONS.map((t) => <option key={t} value={t}>{TRANSMISSION_LABELS[t]}</option>)}
          </select>
          {err("transmission")}
        </div>
        <div>
          <label htmlFor="power_kw" className="label">Snaga motora (kW)</label>
          <input id="power_kw" name="power_kw" inputMode="numeric" defaultValue={values.power_kw} className="field tabular" placeholder="150" {...inv("power_kw")} />
          <p className="hint">Konjske snage (KS) izračunavaju se automatski.</p>
          {err("power_kw")}
        </div>
        <div>
          <label htmlFor="engine_displacement_cc" className="label">Obujam motora (cm³)</label>
          <input id="engine_displacement_cc" name="engine_displacement_cc" inputMode="numeric" defaultValue={values.engine_displacement_cc} className="field tabular" placeholder="1968" {...inv("engine_displacement_cc")} />
          {err("engine_displacement_cc")}
        </div>
        <div>
          <label htmlFor="body_type" className="label">Karoserija</label>
          <select id="body_type" name="body_type" defaultValue={values.body_type} className="field">
            <option value="">Nije navedeno</option>
            {BODY_TYPES.map((b) => <option key={b} value={b}>{BODY_LABELS[b]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="drivetrain" className="label">Pogon</label>
          <select id="drivetrain" name="drivetrain" defaultValue={values.drivetrain} className="field">
            <option value="">Nije navedeno</option>
            {DRIVETRAINS.map((d) => <option key={d} value={d}>{DRIVETRAIN_LABELS[d]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="exterior_color" className="label">Boja</label>
          <input id="exterior_color" name="exterior_color" defaultValue={values.exterior_color} maxLength={40} className="field" placeholder="Crna metalik" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="doors" className="label">Vrata</label>
            <input id="doors" name="doors" inputMode="numeric" defaultValue={values.doors} maxLength={1} className="field tabular" {...inv("doors")} />
          </div>
          <div>
            <label htmlFor="seats" className="label">Sjedala</label>
            <input id="seats" name="seats" inputMode="numeric" defaultValue={values.seats} maxLength={2} className="field tabular" {...inv("seats")} />
          </div>
          {err("doors")}
          {err("seats")}
        </div>
      </Section>

      <Section letter="E" title="Opis i oprema">
        <div className="sm:col-span-2">
          <label htmlFor="description" className="label">Opis vozila</label>
          <textarea id="description" name="description" defaultValue={values.description} maxLength={8000} rows={7} className="field" placeholder="Stanje vozila, servisna povijest, broj vlasnika, što je zamijenjeno…" {...inv("description")} />
          <p className="hint">Činjenični opis pomaže kupcima i tražilicama. Ne navodite ništa što nije provjereno.</p>
          {err("description")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="equipment" className="label">Oprema</label>
          <textarea id="equipment" name="equipment" defaultValue={values.equipment} rows={6} className="field" placeholder={"Navigacija\nKamera za vožnju unatrag\nGrijana sjedala"} {...inv("equipment")} />
          <p className="hint">Jedna stavka po retku.</p>
          {err("equipment")}
        </div>
      </Section>

      <Section letter="F" title="Interni podaci" description="Vidljivo samo administratorima.">
        <div>
          <label htmlFor="vin" className="label">VIN (broj šasije)</label>
          <input id="vin" name="vin" defaultValue={values.vin} maxLength={17} autoCapitalize="characters" className="field tabular uppercase" {...inv("vin")} />
          {err("vin")}
        </div>
        <div className="flex items-start sm:pt-7">
          <label className="flex min-h-12 cursor-pointer items-center gap-3">
            <input type="checkbox" name="show_vin" defaultChecked={values.show_vin === "on"} className="size-5 accent-[#d71920]" />
            <span>Prikaži VIN kupcima <span className="block text-sm text-ink-muted">Zadano je skriveno.</span></span>
          </label>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="internal_note" className="label">Interna bilješka</label>
          <textarea id="internal_note" name="internal_note" defaultValue={values.internal_note} maxLength={2000} rows={3} className="field" placeholder="npr. nabavna cijena, napomene za prodaju" />
        </div>
      </Section>

      <Section letter="G" title="Tražilice (neobavezno)" description="Ako ostavite prazno, naslov i opis za Google sastavljaju se automatski iz podataka vozila.">
        <div className="sm:col-span-2">
          <label htmlFor="seo_title" className="label">SEO naslov</label>
          <input id="seo_title" name="seo_title" defaultValue={values.seo_title} maxLength={70} className="field" {...inv("seo_title")} />
          <p className="hint">Do 60–70 znakova.</p>
          {err("seo_title")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="seo_description" className="label">SEO opis</label>
          <textarea id="seo_description" name="seo_description" defaultValue={values.seo_description} maxLength={170} rows={2} className="field" {...inv("seo_description")} />
          <p className="hint">Do 160 znakova.</p>
          {err("seo_description")}
        </div>
      </Section>

      {/* Traka s akcijama — uvijek dostupna pri dnu */}
      <div className="sticky bottom-[calc(62px+env(safe-area-inset-bottom))] z-20 -mx-4 flex flex-wrap items-center gap-2 border-t border-line bg-[#efefeb]/95 px-4 py-3 backdrop-blur-sm sm:mx-0 sm:rounded-sm sm:border lg:bottom-4">
        {isNew ? (
          <button name="intent" value="save" className="btn btn-primary" disabled={pending}>
            {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            Spremi i dodaj fotografije
          </button>
        ) : (
          <>
            <button name="intent" value="save" className="btn btn-dark" disabled={pending}>
              {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
              Spremi
            </button>
            {vehicle.is_published ? (
              <button name="intent" value="unpublish" className="btn btn-outline" disabled={pending}>Spremi i povuci objavu</button>
            ) : (
              <button name="intent" value="publish" className="btn btn-primary" disabled={pending}>Spremi i objavi</button>
            )}
            <Link href={`/admin/vozila/${vehicle.id}/pregled`} target="_blank" className="btn btn-outline">
              <Eye className="size-4" aria-hidden="true" />
              Pregled
            </Link>
          </>
        )}
        {dirty && !pending && <span className="text-sm text-status-reserved">Imate nespremljene promjene</span>}
      </div>
    </form>
  );
}

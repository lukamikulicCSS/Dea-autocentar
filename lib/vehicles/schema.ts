import { z } from "zod";
import { parseMoneyInput } from "@/lib/format";
import {
  BODY_TYPES,
  CATEGORIES,
  CURRENCIES,
  DRIVETRAINS,
  FUEL_TYPES,
  TRANSMISSIONS,
  VEHICLE_STATUSES,
} from "@/lib/vehicles/constants";

const CURRENT_YEAR = new Date().getFullYear();

/** Prazan string iz forme → undefined. */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label}: najviše ${max} znakova`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

const optionalInt = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      const n = Number(v.replace(/[.\s]/g, ""));
      if (!Number.isInteger(n) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: `${label}: unesite cijeli broj od ${min} do ${max}` });
        return z.NEVER;
      }
      return n;
    })
    .optional()
    .transform((v) => v ?? null);

const requiredInt = (min: number, max: number, label: string) =>
  z
    .string({ message: `${label} je obavezno polje` })
    .trim()
    .min(1, `${label} je obavezno polje`)
    .transform((v, ctx) => {
      const n = Number(v.replace(/[.\s]/g, ""));
      if (!Number.isInteger(n) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: `${label}: unesite cijeli broj od ${min} do ${max}` });
        return z.NEVER;
      }
      return n;
    });

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T, label: string) =>
  z
    .string()
    .transform((v, ctx) => {
      if (v === "") return null;
      if (!(values as readonly string[]).includes(v)) {
        ctx.addIssue({ code: "custom", message: `${label}: neispravna vrijednost` });
        return z.NEVER;
      }
      return v as T[number];
    })
    .optional()
    .transform((v) => v ?? null);

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("")])
  .optional()
  .transform((v) => v === "on" || v === "true");

/** Polja vozila iz administratorske forme. */
export const vehicleFormSchema = z
  .object({
    title: z.string().trim().min(2, "Naziv oglasa je obavezan (najmanje 2 znaka)").max(120, "Naziv: najviše 120 znakova"),
    brand: z.string().trim().min(1, "Marka je obavezna").max(60, "Marka: najviše 60 znakova"),
    model: z.string().trim().min(1, "Model je obavezan").max(60, "Model: najviše 60 znakova"),
    variant: optionalText(80, "Izvedba"),
    category: z.enum(CATEGORIES, { message: "Odaberite kategoriju" }),
    status: z.enum(VEHICLE_STATUSES, { message: "Odaberite status" }),
    is_featured: checkbox,
    price: z.string().trim().max(20).optional().default(""),
    currency: z.enum(CURRENCIES, { message: "Odaberite valutu" }),
    price_on_request: checkbox,
    year: requiredInt(1900, CURRENT_YEAR + 1, "Godina proizvodnje"),
    mileage_km: requiredInt(0, 5_000_000, "Prijeđeni kilometri"),
    fuel_type: z.enum(FUEL_TYPES, { message: "Odaberite vrstu goriva" }),
    transmission: z.enum(TRANSMISSIONS, { message: "Odaberite mjenjač" }),
    engine_displacement_cc: optionalInt(50, 10_000, "Obujam motora"),
    power_kw: optionalInt(1, 2000, "Snaga"),
    body_type: optionalEnum(BODY_TYPES, "Karoserija"),
    exterior_color: optionalText(40, "Boja"),
    drivetrain: optionalEnum(DRIVETRAINS, "Pogon"),
    doors: optionalInt(1, 9, "Broj vrata"),
    seats: optionalInt(1, 12, "Broj sjedala"),
    description: optionalText(8000, "Opis"),
    equipment: z
      .string()
      .max(12_000, "Oprema: previše teksta")
      .optional()
      .default("")
      .transform((v) =>
        [...new Set(v.split(/\r?\n/).map((s) => s.replace(/^[-•*\s]+/, "").trim()).filter(Boolean))].map((s) =>
          s.slice(0, 120),
        ),
      )
      .refine((list) => list.length <= 150, "Oprema: najviše 150 stavki"),
    stock_ref: optionalText(40, "Šifra oglasa"),
    arrival_date: z
      .string()
      .trim()
      .optional()
      .transform((v, ctx) => {
        if (!v) return null;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) {
          ctx.addIssue({ code: "custom", message: "Datum dolaska nije ispravan" });
          return z.NEVER;
        }
        return v;
      }),
    arrival_note: optionalText(80, "Napomena o dolasku"),
    seo_title: optionalText(70, "SEO naslov"),
    seo_description: optionalText(170, "SEO opis"),
    vin: z
      .string()
      .trim()
      .toUpperCase()
      .optional()
      .transform((v, ctx) => {
        if (!v) return null;
        if (!/^[A-HJ-NPR-Z0-9]{11,17}$/.test(v)) {
          ctx.addIssue({ code: "custom", message: "VIN smije sadržavati 11–17 znakova (slova bez I, O, Q i brojke)" });
          return z.NEVER;
        }
        return v;
      }),
    show_vin: checkbox,
    internal_note: optionalText(2000, "Interna bilješka"),
  })
  .transform((data, ctx) => {
    let price_amount: number | null = null;
    if (data.price) {
      price_amount = parseMoneyInput(data.price);
      if (price_amount === null || price_amount > 100_000_000_000) {
        ctx.addIssue({ code: "custom", path: ["price"], message: "Cijena nije ispravna (npr. 45900 ili 45.900)" });
        return z.NEVER;
      }
    }
    if (!data.price_on_request && price_amount === null) {
      ctx.addIssue({ code: "custom", path: ["price"], message: "Upišite cijenu ili označite „Cijena na upit”" });
      return z.NEVER;
    }
    if (data.show_vin && !data.vin) {
      ctx.addIssue({ code: "custom", path: ["vin"], message: "Za javni prikaz VIN-a najprije ga upišite" });
      return z.NEVER;
    }
    const { price: _price, vin, show_vin, internal_note, ...vehicle } = data;
    void _price;
    return {
      vehicle: { ...vehicle, price_amount },
      internal: { vin, show_vin, internal_note },
    };
  });

export type VehicleFormValues = z.input<typeof vehicleFormSchema>;
export type ParsedVehicleForm = z.output<typeof vehicleFormSchema>;

export const VEHICLE_FORM_FIELDS = [
  "title",
  "brand",
  "model",
  "variant",
  "category",
  "status",
  "is_featured",
  "price",
  "currency",
  "price_on_request",
  "year",
  "mileage_km",
  "fuel_type",
  "transmission",
  "engine_displacement_cc",
  "power_kw",
  "body_type",
  "exterior_color",
  "drivetrain",
  "doors",
  "seats",
  "description",
  "equipment",
  "stock_ref",
  "arrival_date",
  "arrival_note",
  "seo_title",
  "seo_description",
  "vin",
  "show_vin",
  "internal_note",
] as const;

/** FormData → običan objekt samo s poznatim poljima (ostalo se ignorira). */
export function formDataToVehicleInput(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of VEHICLE_FORM_FIELDS) {
    const v = fd.get(key);
    if (typeof v === "string") out[key] = v;
  }
  return out;
}

export const uuidSchema = z.uuid({ message: "Neispravan identifikator" });

/** Brza promjena statusa / objave / izdvajanja iz popisa. */
export const quickUpdateSchema = z.object({
  id: uuidSchema,
  field: z.enum(["status", "is_published", "is_featured", "category"]),
  value: z.string().max(20),
});

export const inquirySchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Upišite email adresu")
    .max(254, "Email adresa je predugačka")
    .pipe(z.email({ message: "Email adresa nije ispravna" })),
  message: z
    .string()
    .trim()
    .max(2000, "Poruka može imati najviše 2000 znakova")
    .optional()
    .transform((v) => (v ? v : null)),
  vehicleId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(uuidSchema.nullable()),
  website: z.string().optional(), // honeypot — ljudi ga ne vide
  turnstileToken: z.string().max(4096).optional(),
});

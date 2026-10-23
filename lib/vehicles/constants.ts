/** Stabilne interne vrijednosti (iste kao u bazi) i hrvatske oznake za sučelje. */

export const VEHICLE_STATUSES = ["available", "coming_soon", "reserved", "sold", "archived"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const STATUS_LABELS: Record<VehicleStatus, string> = {
  available: "Dostupno",
  coming_soon: "U dolasku",
  reserved: "Rezervirano",
  sold: "Prodano",
  archived: "Arhivirano",
};

/** Statusi koje kupac može birati u filteru javne ponude. */
export const PUBLIC_STATUSES = ["available", "coming_soon", "reserved", "sold"] as const;

export const CATEGORIES = ["premium", "standard"] as const;
export type VehicleCategory = (typeof CATEGORIES)[number];
export const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  premium: "Premium",
  standard: "Standard",
};

export const FUEL_TYPES = ["benzin", "dizel", "hibrid", "plug_in_hibrid", "elektricni", "plin"] as const;
export type FuelType = (typeof FUEL_TYPES)[number];
export const FUEL_LABELS: Record<FuelType, string> = {
  benzin: "Benzin",
  dizel: "Dizel",
  hibrid: "Hibrid",
  plug_in_hibrid: "Plug-in hibrid",
  elektricni: "Električni",
  plin: "Plin (LPG/CNG)",
};

export const TRANSMISSIONS = ["manualni", "automatski"] as const;
export type Transmission = (typeof TRANSMISSIONS)[number];
export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  manualni: "Manualni",
  automatski: "Automatski",
};

export const BODY_TYPES = [
  "limuzina",
  "karavan",
  "hatchback",
  "suv",
  "terenac",
  "coupe",
  "kabriolet",
  "monovolumen",
  "pickup",
  "kombi",
  "ostalo",
] as const;
export type BodyType = (typeof BODY_TYPES)[number];
export const BODY_LABELS: Record<BodyType, string> = {
  limuzina: "Limuzina",
  karavan: "Karavan",
  hatchback: "Hatchback",
  suv: "SUV",
  terenac: "Terenac",
  coupe: "Coupé",
  kabriolet: "Kabriolet",
  monovolumen: "Monovolumen",
  pickup: "Pick-up",
  kombi: "Kombi",
  ostalo: "Ostalo",
};

export const DRIVETRAINS = ["prednji", "straznji", "4x4"] as const;
export type Drivetrain = (typeof DRIVETRAINS)[number];
export const DRIVETRAIN_LABELS: Record<Drivetrain, string> = {
  prednji: "Prednji pogon",
  straznji: "Stražnji pogon",
  "4x4": "Pogon na sve kotače (4x4)",
};

export const CURRENCIES = ["BAM", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const INQUIRY_STATUSES = ["new", "in_progress", "answered", "closed"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];
export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "Novi",
  in_progress: "U obradi",
  answered: "Odgovoreno",
  closed: "Zatvoreno",
};

export const RESERVED_DISPLAY = ["inline", "separate", "hidden"] as const;
export type ReservedDisplay = (typeof RESERVED_DISPLAY)[number];
export const RESERVED_DISPLAY_LABELS: Record<ReservedDisplay, string> = {
  inline: "U ponudi, s oznakom „Rezervirano”",
  separate: "Izdvojeno u zasebnoj sekciji (ne u glavnoj pretrazi)",
  hidden: "Skriveno s javne stranice",
};

export const SOLD_DISPLAY = ["inline", "archive", "hidden"] as const;
export type SoldDisplay = (typeof SOLD_DISPLAY)[number];
export const SOLD_DISPLAY_LABELS: Record<SoldDisplay, string> = {
  inline: "U ponudi, s oznakom „Prodano”",
  archive: "Zasebna stranica „Prodana vozila”",
  hidden: "Skriveno s javne stranice",
};

export const PAGE_SIZE = 12;

export function isOneOf<T extends readonly string[]>(list: T, value: unknown): value is T[number] {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

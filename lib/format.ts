import type { Currency } from "@/lib/vehicles/constants";

const CURRENCY_SUFFIX: Record<Currency, string> = { BAM: "KM", EUR: "€" };

const integerFormat = new Intl.NumberFormat("hr-HR", { maximumFractionDigits: 0, useGrouping: true });
const decimalFormat = new Intl.NumberFormat("hr-HR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
});

/** Grupiranje tisućica točkom i za četveroznamenkaste brojeve (npr. 1.250). */
function group(n: number, fmt: Intl.NumberFormat): string {
  return fmt.format(n).replace(/ /g, ".");
}

/** Iznos u najmanjoj jedinici (feninzi/centi) → "45.900 KM". */
export function formatMoney(amountMinor: number, currency: Currency): string {
  const major = amountMinor / 100;
  const text = Number.isInteger(major) ? group(major, integerFormat) : group(major, decimalFormat);
  return `${text} ${CURRENCY_SUFFIX[currency]}`;
}

export function formatPrice(v: {
  price_amount: number | null;
  currency: Currency;
  price_on_request: boolean;
}): string {
  if (v.price_on_request || v.price_amount === null) return "Cijena na upit";
  return formatMoney(v.price_amount, v.currency);
}

export function formatNumber(n: number): string {
  return group(n, integerFormat);
}

export function formatKm(km: number): string {
  return `${formatNumber(km)} km`;
}

/** Snaga: kW i konjske snage (KS). */
export function kwToHp(kw: number): number {
  return Math.round(kw * 1.35962);
}

export function formatPower(kw: number): string {
  return `${formatNumber(kw)} kW (${formatNumber(kwToHp(kw))} KS)`;
}

export function formatCc(cc: number): string {
  return `${formatNumber(cc)} cm³`;
}

const dateFormat = new Intl.DateTimeFormat("hr-HR", { day: "numeric", month: "long", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat("hr-HR", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Sarajevo",
});

export function formatDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  return dateFormat.format(d);
}

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

/**
 * Procijenjeni dolazak — nikad kao zajamčeni datum.
 * Ako je upisana približna napomena (npr. "sredina studenog"), ona ima prednost.
 */
export function formatArrival(v: { arrival_date: string | null; arrival_note: string | null }): string | null {
  if (v.arrival_note) return `Očekivani dolazak: ${v.arrival_note}`;
  if (v.arrival_date) return `Očekivani dolazak: oko ${formatDate(v.arrival_date)}`;
  return null;
}

/** "+387 61 310 330" → "+38761310330" za tel: poveznice. */
export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^+0-9]/g, "")}`;
}

/** Major iznos iz forme ("45.900" / "45900,50") → najmanja jedinica. */
export function parseMoneyInput(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s|KM|€/gi, "");
  if (!cleaned) return null;
  // Hrvatski zapis: točka za tisućice, zarez za decimale
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(cleaned)
      ? cleaned.replace(/\./g, "")
      : cleaned;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

/** Najmanja jedinica → tekst za polje forme ("45900" ili "45900,50"). */
export function moneyToInput(amountMinor: number | null): string {
  if (amountMinor === null) return "";
  const major = amountMinor / 100;
  return Number.isInteger(major) ? String(major) : major.toFixed(2).replace(".", ",");
}

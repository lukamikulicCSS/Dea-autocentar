import { describe, expect, it } from "vitest";
import { formatKm, formatMoney, formatPower, formatPrice, moneyToInput, parseMoneyInput, formatArrival } from "@/lib/format";
import { sniffImageType } from "@/lib/images";
import { activeFilterCount, filtersToSearch, parseFilters, sanitizeQuery } from "@/lib/vehicles/filters";
import { inquirySchema, vehicleFormSchema } from "@/lib/vehicles/schema";
import { jsonLd, truncate } from "@/lib/seo";
import { safeAdminRedirect } from "@/lib/auth-redirect";

describe("formatiranje", () => {
  it("cijene u KM i EUR iz najmanje jedinice", () => {
    expect(formatMoney(4590000, "BAM")).toBe("45.900 KM");
    expect(formatMoney(125000, "BAM")).toBe("1.250 KM");
    expect(formatMoney(4590050, "BAM")).toBe("45.900,50 KM");
    expect(formatMoney(1999900, "EUR")).toBe("19.999 €");
  });

  it("cijena na upit", () => {
    expect(formatPrice({ price_amount: 100, currency: "BAM", price_on_request: true })).toBe("Cijena na upit");
    expect(formatPrice({ price_amount: null, currency: "BAM", price_on_request: false })).toBe("Cijena na upit");
  });

  it("kilometri i snaga", () => {
    expect(formatKm(85000)).toBe("85.000 km");
    expect(formatPower(150)).toBe("150 kW (204 KS)");
  });

  it("unos cijene u hrvatskom zapisu", () => {
    expect(parseMoneyInput("45900")).toBe(4590000);
    expect(parseMoneyInput("45.900")).toBe(4590000);
    expect(parseMoneyInput("1.250.000")).toBe(125000000);
    expect(parseMoneyInput("45900,50")).toBe(4590050);
    expect(parseMoneyInput("45.900,5")).toBe(4590050);
    expect(parseMoneyInput("45 900 KM")).toBe(4590000);
    expect(parseMoneyInput("abc")).toBeNull();
    expect(parseMoneyInput("-5")).toBeNull();
    expect(parseMoneyInput("")).toBeNull();
    expect(moneyToInput(4590050)).toBe("45900,50");
    expect(moneyToInput(4590000)).toBe("45900");
  });

  it("dolazak je uvijek okviran", () => {
    expect(formatArrival({ arrival_date: null, arrival_note: "krajem studenog" })).toBe("Očekivani dolazak: krajem studenog");
    expect(formatArrival({ arrival_date: "2026-11-20", arrival_note: null })).toMatch(/^Očekivani dolazak: oko 20\. studenoga 2026\.?$/);
  });
});

describe("filteri pretrage", () => {
  it("odbacuje neispravne vrijednosti iz URL-a", () => {
    const f = parseFilters({
      kategorija: "luksuz",
      status: "archived",
      gorivo: "dizel",
      cijenaDo: "50000",
      godinaOd: "1800",
      kmDo: "-1",
      sort: "drop table",
      stranica: "0",
    });
    expect(f.kategorija).toBeUndefined();
    expect(f.status).toBeUndefined(); // arhivirano se nikad ne može tražiti javno
    expect(f.gorivo).toBe("dizel");
    expect(f.cijenaDo).toBe(50000);
    expect(f.godinaOd).toBeUndefined();
    expect(f.kmDo).toBeUndefined();
    expect(f.sort).toBe("preporuceno");
    expect(f.stranica).toBe(1);
  });

  it("čisti tekst pretrage od PostgREST znakova", () => {
    expect(sanitizeQuery("audi,a6).or(id.eq.1")).toBe("audi a6 or id eq 1");
    expect(sanitizeQuery("Škoda Octavia")).toBe("Škoda Octavia");
    expect(sanitizeQuery("%_*")).toBeUndefined();
    expect(sanitizeQuery("x".repeat(200))?.length).toBe(60);
  });

  it("dijeljivi URL bez zadanih vrijednosti", () => {
    const f = parseFilters({ q: "golf", gorivo: "dizel", sort: "preporuceno", stranica: "2" });
    expect(filtersToSearch(f)).toBe("?q=golf&gorivo=dizel&stranica=2");
    expect(activeFilterCount(f)).toBe(2);
    expect(filtersToSearch(parseFilters({}))).toBe("");
  });
});

describe("validacija vozila", () => {
  const base = {
    title: "Audi A6 Avant",
    brand: "Audi",
    model: "A6",
    category: "premium",
    status: "available",
    price: "45.900",
    currency: "BAM",
    year: "2021",
    mileage_km: "85.000",
    fuel_type: "dizel",
    transmission: "automatski",
    equipment: "Navigacija\n- Kamera\n\nNavigacija\n• Grijana sjedala",
  };

  it("pretvara formu u podatke za bazu", () => {
    const r = vehicleFormSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.vehicle.price_amount).toBe(4590000);
    expect(r.data.vehicle.mileage_km).toBe(85000);
    expect(r.data.vehicle.equipment).toEqual(["Navigacija", "Kamera", "Grijana sjedala"]);
    expect(r.data.vehicle.variant).toBeNull();
    expect(r.data.internal).toEqual({ vin: null, show_vin: false, internal_note: null });
    expect("vin" in r.data.vehicle).toBe(false);
  });

  it("traži cijenu ili oznaku 'na upit'", () => {
    const r = vehicleFormSchema.safeParse({ ...base, price: "" });
    expect(r.success).toBe(false);
    expect(vehicleFormSchema.safeParse({ ...base, price: "", price_on_request: "on" }).success).toBe(true);
  });

  it("odbija nepoznate vrijednosti i neispravan VIN", () => {
    expect(vehicleFormSchema.safeParse({ ...base, fuel_type: "nuklearno" }).success).toBe(false);
    expect(vehicleFormSchema.safeParse({ ...base, status: "obrisano" }).success).toBe(false);
    expect(vehicleFormSchema.safeParse({ ...base, year: "3000" }).success).toBe(false);
    expect(vehicleFormSchema.safeParse({ ...base, vin: "WVWZZZ1KZAW00000O" }).success).toBe(false); // slovo O nije dopušteno
    expect(vehicleFormSchema.safeParse({ ...base, vin: "wvwzzz1kzaw000001" }).success).toBe(true); // velika slova automatski
    expect(vehicleFormSchema.safeParse({ ...base, show_vin: "on" }).success).toBe(false); // VIN prikaz bez VIN-a
  });

  it("ograničava duljinu teksta", () => {
    expect(vehicleFormSchema.safeParse({ ...base, title: "x".repeat(121) }).success).toBe(false);
    expect(vehicleFormSchema.safeParse({ ...base, description: "x".repeat(8001) }).success).toBe(false);
  });
});

describe("upit kupca", () => {
  it("traži samo ispravan email", () => {
    expect(inquirySchema.safeParse({ email: "kupac@example.com" }).success).toBe(true);
    expect(inquirySchema.safeParse({ email: "" }).success).toBe(false);
    expect(inquirySchema.safeParse({ email: "nije-email" }).success).toBe(false);
    expect(inquirySchema.safeParse({ email: "a@b.co", message: "x".repeat(2001) }).success).toBe(false);
    expect(inquirySchema.safeParse({ email: "a@b.co", vehicleId: "1; drop table" }).success).toBe(false);
    expect(inquirySchema.safeParse({ email: "a@b.co", vehicleId: "6f1c2a4e-8b7d-4c3a-9e2f-1a2b3c4d5e6f" }).success).toBe(true);
  });
});

describe("prepoznavanje vrste datoteke po sadržaju", () => {
  const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);
  const ascii = (s: string) => Array.from(s).map((c) => c.charCodeAt(0));

  it("prepoznaje JPG, PNG, WebP i HEIC", () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("jpeg");
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("png");
    expect(sniffImageType(new Uint8Array([...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP"), 0, 0]))).toBe("webp");
    expect(sniffImageType(new Uint8Array([0, 0, 0, 24, ...ascii("ftypheic"), 0, 0]))).toBe("heic");
  });

  it("odbija SVG, HTML, PDF i izvršne datoteke čak i s lažnim imenom", () => {
    expect(sniffImageType(new Uint8Array(ascii('<svg xmlns="http://www.w3.org/2000/svg">')))).toBeNull();
    expect(sniffImageType(new Uint8Array(ascii("<!doctype html><script>")))).toBeNull();
    expect(sniffImageType(new Uint8Array(ascii("%PDF-1.7 ........")))).toBeNull();
    expect(sniffImageType(bytes(0x4d, 0x5a, 0x90, 0x00))).toBeNull(); // Windows .exe
    expect(sniffImageType(new Uint8Array([0xff, 0xd8]))).toBeNull(); // prekratko
  });
});

describe("SEO i sigurnost", () => {
  it("JSON-LD ne može zatvoriti script tag", () => {
    const out = jsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });

  it("skraćuje meta opis na granici riječi", () => {
    const t = truncate("Audi A6 Avant 40 TDI quattro S line, 2021., 85.000 km, dizel, automatski mjenjač", 40);
    expect(t.length).toBeLessThanOrEqual(40);
    expect(t.endsWith("…")).toBe(true);
  });

  it("preusmjeravanje nakon prijave ostaje unutar administracije", () => {
    expect(safeAdminRedirect("/admin/vozila")).toBe("/admin/vozila");
    expect(safeAdminRedirect("https://evil.com")).toBe("/admin");
    expect(safeAdminRedirect("//evil.com/admin")).toBe("/admin");
    expect(safeAdminRedirect("/admin\\@evil.com")).toBe("/admin");
    expect(safeAdminRedirect("/vozila")).toBe("/admin");
    expect(safeAdminRedirect("/admin/prijava?next=/admin")).toBe("/admin");
    expect(safeAdminRedirect(undefined)).toBe("/admin");
  });
});

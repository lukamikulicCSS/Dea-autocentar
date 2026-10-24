import { describe, expect, it } from "vitest";
import { normalize, suggest, vehiclesLabel, type IndexRow } from "@/lib/vehicles/suggest";

const rows: IndexRow[] = [
  ["BMW", "X5", "available", "premium"],
  ["BMW", "X5", "available", "premium"],
  ["BMW", "320d", "available", "standard"],
  ["BMW", "530e", "sold", "standard"],
  ["Škoda", "Octavia", "available", "standard"],
  ["Škoda", "Superb", "coming_soon", "standard"],
  ["Mercedes-Benz", "G 400 d", "coming_soon", "premium"],
  ["Volkswagen", "Golf", "reserved", "standard"],
];
const main = { statuses: ["available", "coming_soon", "reserved"] as const };
const scope = { statuses: [...main.statuses] };

describe("prijedlozi pretrage", () => {
  it("već od dva slova nudi marku s brojem vozila u ponudi (bez prodanih)", () => {
    const r = suggest(rows, "bm", scope);
    expect(r[0]).toEqual({ kind: "brand", label: "BMW", query: "BMW", count: 3 });
    // jednoznačna marka → prikazuje i njene modele
    expect(r.filter((s) => s.kind === "model").map((s) => [s.label, s.count])).toEqual([
      ["BMW X5", 2],
      ["BMW 320d", 1],
    ]);
  });

  it("ne ovisi o dijakriticima ni velikim slovima", () => {
    expect(suggest(rows, "sko", scope)[0]).toMatchObject({ label: "Škoda", count: 2 });
    expect(suggest(rows, "ŠKO", scope)[0]).toMatchObject({ label: "Škoda", count: 2 });
    expect(normalize("Citroën Đ")).toBe("citroen d");
  });

  it("pronalazi marku po drugoj riječi i model po nazivu", () => {
    expect(suggest(rows, "benz", scope)[0]).toMatchObject({ kind: "brand", label: "Mercedes-Benz" });
    expect(suggest(rows, "golf", scope)).toEqual([{ kind: "model", label: "Volkswagen Golf", query: "Volkswagen Golf", count: 1 }]);
    expect(suggest(rows, "bmw x", scope)).toEqual([{ kind: "model", label: "BMW X5", query: "BMW X5", count: 2 }]);
  });

  it("broji samo vozila iz opsega stranice", () => {
    expect(suggest(rows, "b", { statuses: ["available"], category: "premium" })[0]).toMatchObject({ label: "BMW", count: 2 });
    expect(suggest(rows, "s", { statuses: ["coming_soon"] })[0]).toMatchObject({ label: "Škoda", count: 1 });
    expect(suggest(rows, "audi", scope)).toEqual([]);
    expect(suggest(rows, "  ", scope)).toEqual([]);
  });

  it("hrvatski oblik broja", () => {
    expect(vehiclesLabel(1)).toBe("1 vozilo");
    expect(vehiclesLabel(3)).toBe("3 vozila");
  });
});

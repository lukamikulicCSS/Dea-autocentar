import type { VehicleCategory, VehicleStatus } from "@/lib/vehicles/constants";

export type SuggestScope = { statuses: VehicleStatus[]; category?: VehicleCategory };
export type IndexRow = [brand: string, model: string, status: string, category: string];
export type Suggestion = { kind: "brand" | "model"; label: string; query: string; count: number };

/** Usporedba bez obzira na velika slova i dijakritike (Škoda = skoda, Citroën = citroen). */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function vehiclesLabel(n: number): string {
  return n === 1 ? "1 vozilo" : `${n} vozila`;
}

/**
 * Marke (i modeli) koji odgovaraju upisanom tekstu, s brojem vozila u zadanom opsegu
 * (npr. samo premium ili samo "u dolasku"). Marke koje počinju upisanim tekstom su prve.
 */
export function suggest(rows: IndexRow[], input: string, scope: SuggestScope, limit = 7): Suggestion[] {
  const q = normalize(input);
  if (!q) return [];
  const inScope = rows.filter(
    ([, , status, category]) =>
      scope.statuses.includes(status as VehicleStatus) && (!scope.category || scope.category === category),
  );

  const brands = new Map<string, { label: string; count: number; score: number }>();
  const models = new Map<string, { label: string; brand: string; count: number; score: number }>();

  for (const [brand, model] of inScope) {
    const nb = normalize(brand);
    const nm = normalize(model);
    const full = `${nb} ${nm}`;

    // Marka: počinje upisanim tekstom (0) ili ga sadrži u nekoj riječi (1)
    const brandScore = nb.startsWith(q) ? 0 : nb.split(" ").some((w) => w.startsWith(q)) ? 1 : -1;
    if (brandScore >= 0 && !q.includes(" ")) {
      const b = brands.get(nb) ?? { label: brand, count: 0, score: brandScore };
      b.count += 1;
      brands.set(nb, b);
    }

    // Model: "bmw x5", "x5" ili "golf"
    const modelScore = full.startsWith(q) && q.length > nb.length ? 0 : nm.startsWith(q) ? 1 : -1;
    if (modelScore >= 0) {
      const key = full;
      const m = models.get(key) ?? { label: `${brand} ${model}`, brand, count: 0, score: modelScore };
      m.count += 1;
      models.set(key, m);
    }
  }

  const brandList: Suggestion[] = [...brands.values()]
    .sort((a, b) => a.score - b.score || b.count - a.count || a.label.localeCompare(b.label, "hr"))
    .map((b) => ({ kind: "brand", label: b.label, query: b.label, count: b.count }));

  // Modeli: kad je marka jednoznačna prikaži njene modele, inače modele koji se izravno poklapaju
  const singleBrand = brandList.length === 1 ? normalize(brandList[0]!.label) : null;
  if (singleBrand) {
    for (const [brand, model] of inScope) {
      if (normalize(brand) !== singleBrand) continue;
      const key = `${normalize(brand)} ${normalize(model)}`;
      if (!models.has(key)) models.set(key, { label: `${brand} ${model}`, brand, count: 0, score: 2 });
      models.get(key)!.count += models.get(key)!.score === 2 ? 1 : 0;
    }
  }
  const modelList: Suggestion[] = [...models.values()]
    .sort((a, b) => a.score - b.score || b.count - a.count || a.label.localeCompare(b.label, "hr"))
    .map((m) => ({ kind: "model", label: m.label, query: m.label, count: m.count }));

  return [...brandList.slice(0, 4), ...modelList].slice(0, limit);
}

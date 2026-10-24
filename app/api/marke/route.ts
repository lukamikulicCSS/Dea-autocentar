import { NextResponse } from "next/server";
import { publicClient } from "@/lib/supabase/public";

/**
 * Sažetak javne ponude za prijedloge pretrage: marka, model, status i kategorija
 * svakog objavljenog vozila (bez cijena i drugih podataka). Za 30–100 vozila to su
 * svega par KB pa preglednik filtrira trenutno, pri svakom slovu, bez novih zahtjeva.
 * RLS u bazi već skriva neobjavljena, arhivirana i skrivena vozila.
 * Statično i keširano; svaka izmjena u adminu ga osvježava (revalidatePublicSite).
 */
export const revalidate = 300;

export type BrandIndexRow = [brand: string, model: string, status: string, category: string];

export async function GET() {
  const { data, error } = await publicClient()
    .from("vehicles")
    .select("brand,model,status,category")
    .eq("is_published", true)
    .neq("status", "archived")
    .limit(5000);

  if (error) {
    return NextResponse.json({ rows: [] }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  const rows: BrandIndexRow[] = (data ?? []).map((v) => [v.brand, v.model, v.status, v.category]);
  return NextResponse.json({ rows });
}

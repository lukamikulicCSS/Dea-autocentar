import { NextResponse } from "next/server";
import { assertAdmin, UnauthorizedError } from "@/lib/auth";
import type { BrandIndexRow } from "@/app/api/marke/route";

/**
 * Prijedlozi pretrage u administraciji: marka, model, status i kategorija SVIH vozila
 * (i nacrta i arhive). Samo za administratore, nikad se ne kešira.
 */
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "private, no-store" };

export async function GET() {
  let admin;
  try {
    admin = await assertAdmin();
  } catch (e) {
    const status = e instanceof UnauthorizedError ? 401 : 500;
    return NextResponse.json({ rows: [] }, { status, headers: noStore });
  }

  const { data, error } = await admin.supabase.from("vehicles").select("brand,model,status,category").limit(5000);
  if (error) return NextResponse.json({ rows: [] }, { status: 503, headers: noStore });

  const rows: BrandIndexRow[] = (data ?? []).map((v) => [v.brand, v.model, v.status, v.category]);
  return NextResponse.json({ rows }, { headers: noStore });
}

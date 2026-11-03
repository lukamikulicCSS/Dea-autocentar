import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { serviceClient } from "@/lib/supabase/service";

/**
 * Dnevno brisanje isteklih podataka iz upita (rokovi u lib/legal.ts → RETENTION).
 * Poziva ga Cloudflare Cron Trigger (wrangler.jsonc → worker.ts) sa zaglavljem
 * `Authorization: Bearer <CRON_SECRET>`.
 * Bez postavljenog CRON_SECRET ruta odbija svaki poziv.
 */
export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const got = Buffer.from(request.headers.get("authorization") ?? "");
  return got.length === expected.length && timingSafeEqual(got, expected);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const { data, error } = await serviceClient().rpc("purge_expired_inquiry_data");
    if (error) {
      console.error("[čišćenje] Brisanje nije uspjelo:", error.code);
      return NextResponse.json({ error: "purge_failed" }, { status: 500 });
    }
    console.info("[čišćenje] Gotovo:", JSON.stringify(data));
    return NextResponse.json({ ok: true, result: data });
  } catch {
    console.error("[čišćenje] SUPABASE_SECRET_KEY nije postavljen");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }
}

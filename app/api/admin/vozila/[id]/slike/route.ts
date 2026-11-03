import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { assertAdmin, UnauthorizedError } from "@/lib/auth";
import { friendlyDbError } from "@/lib/db-errors";
import { ImageProcessingError, reencodeToWebp } from "@/lib/image-processing";
import { MAX_UPLOAD_BYTES, VEHICLE_BUCKET, sniffImageType } from "@/lib/images";
import { revalidatePublicSite } from "@/lib/revalidate";
import { uuidSchema } from "@/lib/vehicles/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(message: string, status: number) {
  return NextResponse.json({ ok: false, message }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Upload jedne fotografije vozila.
 * 1. provjera administratora (server), 2. ograničenje veličine, 3. provjera potpisa datoteke
 * (ne vjerujemo MIME tipu ni imenu), 4. dekodiranje i ponovno kodiranje u WebP preko
 * Cloudflare Images (uklanja EXIF/GPS i odbija oštećene ili zlonamjerne datoteke), 5. nasumična putanja,
 * 6. zapis u bazu; ako zapis ne uspije, datoteka se briše.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/vozila/[id]/slike">) {
  let admin;
  try {
    admin = await assertAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) return fail(e.message, 401);
    return fail("Provjera prijave nije uspjela.", 500);
  }

  const { id } = await ctx.params;
  if (!uuidSchema.safeParse(id).success) return fail("Neispravno vozilo.", 400);

  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) return fail("Fotografija je prevelika (najviše 4 MB nakon smanjivanja).", 413);

  let file: File | null = null;
  try {
    const form = await request.formData();
    const f = form.get("file");
    file = f instanceof File ? f : null;
  } catch {
    return fail("Neispravan zahtjev.", 400);
  }
  if (!file || file.size === 0) return fail("Datoteka nije poslana.", 400);
  if (file.size > MAX_UPLOAD_BYTES) return fail("Fotografija je prevelika (najviše 4 MB).", 413);

  const input = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImageType(input);
  if (kind === "heic") {
    return fail("HEIC format nije podržan. Na iPhoneu odaberite Postavke → Kamera → Formati → Najkompatibilnije.", 415);
  }
  if (kind !== "jpeg" && kind !== "png" && kind !== "webp") {
    return fail("Dopuštene su samo fotografije u formatu JPG, PNG ili WebP.", 415);
  }

  // Vozilo mora postojati (i biti dostupno ovom administratoru preko RLS-a)
  const { data: vehicle, error: vErr } = await admin.supabase.from("vehicles").select("id").eq("id", id).maybeSingle();
  if (vErr) return fail(friendlyDbError(vErr), 500);
  if (!vehicle) return fail("Vozilo nije pronađeno.", 404);

  let output: Uint8Array;
  let width: number;
  let height: number;
  try {
    ({ data: output, width, height } = await reencodeToWebp(input));
  } catch (e) {
    if (e instanceof ImageProcessingError) return fail(e.message, 422);
    console.error("[upload] Obrada fotografije nije uspjela:", e);
    return fail("Obrada fotografije nije uspjela. Pokušajte ponovno.", 500);
  }

  const imageId = randomUUID();
  const storagePath = `vehicles/${id}/${imageId}.webp`;
  const { error: upErr } = await admin.supabase.storage.from(VEHICLE_BUCKET).upload(storagePath, output, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });
  if (upErr) return fail("Spremanje fotografije nije uspjelo. Pokušajte ponovno.", 502);

  const { data: row, error: dbErr } = await admin.supabase
    .from("vehicle_images")
    .insert({ id: imageId, vehicle_id: id, storage_path: storagePath, width, height, sort_order: 0 })
    .select("id,storage_path,width,height,alt_text,sort_order")
    .single();

  if (dbErr || !row) {
    // Kompenzacija: ne ostavljamo napuštenu datoteku u storageu
    await admin.supabase.storage.from(VEHICLE_BUCKET).remove([storagePath]);
    return fail(friendlyDbError(dbErr, "Spremanje fotografije nije uspjelo."), dbErr?.code === "P0001" ? 409 : 500);
  }

  revalidatePublicSite();
  return NextResponse.json({ ok: true, image: row }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { actionError, friendlyDbError, type ActionResult } from "@/lib/db-errors";
import { VEHICLE_BUCKET } from "@/lib/images";
import { revalidatePublicSite } from "@/lib/revalidate";
import { uuidSchema } from "@/lib/vehicles/schema";

const reorderSchema = z.object({ vehicleId: uuidSchema, imageIds: z.array(uuidSchema).max(40) });

/** Novi redoslijed slika (prva je naslovna) — atomski u bazi. */
export async function reorderImages(vehicleId: string, imageIds: string[]): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    const parsed = reorderSchema.safeParse({ vehicleId, imageIds });
    if (!parsed.success) return { ok: false, message: "Neispravan redoslijed." };
    const { error } = await supabase.rpc("admin_reorder_vehicle_images", {
      p_vehicle_id: parsed.data.vehicleId,
      p_image_ids: parsed.data.imageIds,
    });
    if (error) return { ok: false, message: friendlyDbError(error) };
    revalidatePublicSite();
    return { ok: true, message: "Redoslijed je spremljen." };
  } catch (e) {
    return { ok: false, message: actionError(e) };
  }
}

export async function updateImageAlt(imageId: string, altText: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    if (!uuidSchema.safeParse(imageId).success) return { ok: false, message: "Neispravna slika." };
    const alt = altText.trim().slice(0, 200) || null;
    const { error } = await supabase.from("vehicle_images").update({ alt_text: alt }).eq("id", imageId);
    if (error) return { ok: false, message: friendlyDbError(error) };
    revalidatePublicSite();
    return { ok: true, message: "Opis slike je spremljen." };
  } catch (e) {
    return { ok: false, message: actionError(e) };
  }
}

/** Briše zapis slike, zatim datoteku (samo ako je zapis stvarno obrisan). */
export async function deleteImage(imageId: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    if (!uuidSchema.safeParse(imageId).success) return { ok: false, message: "Neispravna slika." };
    const { data, error } = await supabase.from("vehicle_images").delete().eq("id", imageId).select("storage_path");
    if (error) return { ok: false, message: friendlyDbError(error, "Brisanje slike nije uspjelo.") };
    const path = data?.[0]?.storage_path as string | undefined;
    if (!path) return { ok: false, message: "Slika nije pronađena. Osvježite stranicu." };
    const { error: storageError } = await supabase.storage.from(VEHICLE_BUCKET).remove([path]);
    if (storageError) console.error("[slike] Datoteka nije obrisana iz storagea");
    revalidatePublicSite();
    return { ok: true, message: "Slika je obrisana." };
  } catch (e) {
    return { ok: false, message: actionError(e) };
  }
}

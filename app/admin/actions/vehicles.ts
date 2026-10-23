"use server";

import { redirect } from "next/navigation";
import { assertAdmin } from "@/lib/auth";
import { actionError, friendlyDbError, type ActionResult } from "@/lib/db-errors";
import { VEHICLE_BUCKET } from "@/lib/images";
import { revalidatePublicSite } from "@/lib/revalidate";
import { CATEGORIES, VEHICLE_STATUSES, isOneOf } from "@/lib/vehicles/constants";
import { formDataToVehicleInput, quickUpdateSchema, uuidSchema, vehicleFormSchema } from "@/lib/vehicles/schema";

export type VehicleFormState = ActionResult | null;

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/** Spremanje vozila (novo ili postojeće). `intent`: save | publish | unpublish. */
export async function saveVehicle(vehicleId: string | null, _prev: VehicleFormState, formData: FormData): Promise<ActionResult> {
  const values = formDataToVehicleInput(formData);
  let savedId: string | null = null;
  let isNew = false;
  try {
    const { supabase } = await assertAdmin();
    if (vehicleId !== null && !uuidSchema.safeParse(vehicleId).success) {
      return { ok: false, message: "Neispravno vozilo." };
    }

    const parsed = vehicleFormSchema.safeParse(values);
    if (!parsed.success) {
      return { ok: false, message: "Provjerite označena polja.", fieldErrors: fieldErrorsFrom(parsed.error.issues), values };
    }

    const intent = String(formData.get("intent") ?? "save");
    const publish = intent === "publish" ? true : intent === "unpublish" ? false : null;

    const { data, error } = await supabase
      .rpc("admin_save_vehicle", {
        p_id: vehicleId,
        p_vehicle: parsed.data.vehicle,
        p_internal: parsed.data.internal,
        p_publish: vehicleId ? publish : null,
      })
      .single<{ id: string; slug: string }>();

    if (error || !data) {
      return { ok: false, message: friendlyDbError(error), values };
    }
    savedId = data.id;
    isNew = vehicleId === null;
    revalidatePublicSite();

    if (!isNew) {
      const message =
        publish === true ? "Vozilo je objavljeno." : publish === false ? "Objava je povučena." : "Promjene su spremljene.";
      return { ok: true, message };
    }
  } catch (e) {
    return { ok: false, message: actionError(e), values };
  }
  // Novo vozilo: nastavak na uređivanje gdje se dodaju fotografije
  redirect(`/admin/vozila/${savedId}?novo=1`);
}

/** Brza promjena iz popisa vozila (status, objava, izdvajanje, kategorija). */
export async function quickUpdateVehicle(id: string, field: string, value: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    const parsed = quickUpdateSchema.safeParse({ id, field, value });
    if (!parsed.success) return { ok: false, message: "Neispravan zahtjev." };

    let patch: Record<string, unknown>;
    switch (parsed.data.field) {
      case "status":
        if (!isOneOf(VEHICLE_STATUSES, value)) return { ok: false, message: "Neispravan status." };
        patch = { status: value };
        break;
      case "category":
        if (!isOneOf(CATEGORIES, value)) return { ok: false, message: "Neispravna kategorija." };
        patch = { category: value };
        break;
      case "is_published":
      case "is_featured":
        if (value !== "true" && value !== "false") return { ok: false, message: "Neispravna vrijednost." };
        patch = { [parsed.data.field]: value === "true" };
        break;
    }

    const { data, error } = await supabase.from("vehicles").update(patch).eq("id", parsed.data.id).select("id");
    if (error) return { ok: false, message: friendlyDbError(error) };
    if (!data?.length) return { ok: false, message: "Vozilo nije pronađeno. Osvježite stranicu." };
    revalidatePublicSite();
    return { ok: true, message: "Spremljeno." };
  } catch (e) {
    return { ok: false, message: actionError(e) };
  }
}

export async function duplicateVehicle(id: string): Promise<ActionResult> {
  let newId: string;
  try {
    const { supabase } = await assertAdmin();
    if (!uuidSchema.safeParse(id).success) return { ok: false, message: "Neispravno vozilo." };
    const { data, error } = await supabase.rpc("admin_duplicate_vehicle", { p_id: id });
    if (error || typeof data !== "string") return { ok: false, message: friendlyDbError(error, "Kopiranje nije uspjelo.") };
    newId = data;
  } catch (e) {
    return { ok: false, message: actionError(e) };
  }
  redirect(`/admin/vozila/${newId}?kopija=1`);
}

/** Trajno brisanje vozila, njegovih zapisa slika i datoteka u storageu. */
export async function deleteVehicle(id: string, confirmation: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    if (!uuidSchema.safeParse(id).success) return { ok: false, message: "Neispravno vozilo." };
    if (confirmation !== "OBRIŠI") return { ok: false, message: "Za potvrdu upišite OBRIŠI." };

    const { data: images, error: imgError } = await supabase
      .from("vehicle_images")
      .select("storage_path")
      .eq("vehicle_id", id);
    if (imgError) return { ok: false, message: friendlyDbError(imgError) };

    const { data: deleted, error } = await supabase.from("vehicles").delete().eq("id", id).select("id");
    if (error) return { ok: false, message: friendlyDbError(error, "Brisanje nije uspjelo.") };
    if (!deleted?.length) return { ok: false, message: "Vozilo nije pronađeno." };

    // Zapisi su obrisani; datoteke su jedinstvene po slici (UUID) pa ih nitko drugi ne koristi.
    const paths = (images ?? []).map((i) => i.storage_path as string);
    if (paths.length) {
      const { error: storageError } = await supabase.storage.from(VEHICLE_BUCKET).remove(paths);
      if (storageError) console.error("[vozila] Datoteke nisu obrisane iz storagea:", paths.length);
    }
    revalidatePublicSite();
  } catch (e) {
    return { ok: false, message: actionError(e) };
  }
  redirect("/admin/vozila?obrisano=1");
}

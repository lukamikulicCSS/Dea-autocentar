"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { actionError, friendlyDbError, type ActionResult } from "@/lib/db-errors";
import { INQUIRY_STATUSES } from "@/lib/vehicles/constants";
import { uuidSchema } from "@/lib/vehicles/schema";

const patchSchema = z
  .object({
    status: z.enum(INQUIRY_STATUSES).optional(),
    is_read: z.boolean().optional(),
    internal_note: z.string().max(2000).nullable().optional(),
  })
  .strict();

export async function updateInquiry(id: string, patch: z.input<typeof patchSchema>): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    if (!uuidSchema.safeParse(id).success) return { ok: false, message: "Neispravan upit." };
    const parsed = patchSchema.safeParse(patch);
    if (!parsed.success) return { ok: false, message: "Neispravan zahtjev." };
    const data = { ...parsed.data };
    if (typeof data.internal_note === "string") data.internal_note = data.internal_note.trim() || null;
    // Označavanje kao odgovoreno ili zatvoreno znači i da je pročitano
    if (data.status === "answered" || data.status === "closed") data.is_read = true;

    const { data: rows, error } = await supabase.from("inquiries").update(data).eq("id", id).select("id");
    if (error) return { ok: false, message: friendlyDbError(error) };
    if (!rows?.length) return { ok: false, message: "Upit nije pronađen." };
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Spremljeno." };
  } catch (e) {
    return { ok: false, message: actionError(e) };
  }
}

export async function deleteInquiry(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    if (!uuidSchema.safeParse(id).success) return { ok: false, message: "Neispravan upit." };
    const { error } = await supabase.from("inquiries").delete().eq("id", id);
    if (error) return { ok: false, message: friendlyDbError(error) };
    revalidatePath("/admin", "layout");
  } catch (e) {
    return { ok: false, message: actionError(e) };
  }
  redirect("/admin/upiti?obrisano=1");
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { actionError, friendlyDbError, type ActionResult } from "@/lib/db-errors";
import { revalidatePublicSite } from "@/lib/revalidate";
import { hasServiceKey, serviceClient } from "@/lib/supabase/service";
import { RESERVED_DISPLAY, SOLD_DISPLAY } from "@/lib/vehicles/constants";
import { uuidSchema } from "@/lib/vehicles/schema";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Najviše ${max} znakova`)
    .transform((v) => (v === "" ? null : v));
const url = z
  .string()
  .trim()
  .max(500)
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || /^https:\/\/[^\s]+$/.test(v), "Poveznica mora počinjati s https://");
const intlPhone = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v.replace(/[\s()/-]/g, "")))
  .refine((v) => v === null || /^\+[0-9]{8,15}$/.test(v), "Upišite broj u međunarodnom obliku, npr. +38761310330");
const coord = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v.replace(",", "."))))
    .refine((v) => v === null || (Number.isFinite(v) && v >= min && v <= max), "Neispravna koordinata");

const settingsSchema = z.object({
  business_name: z.string().trim().min(2, "Naziv je obavezan").max(80),
  street_address: text(120),
  city: text(60),
  postal_code: text(12),
  phone: text(24).refine((v) => v === null || /^\+?[0-9 ()/-]{6,24}$/.test(v), "Neispravan broj telefona"),
  email: text(254).refine((v) => v === null || z.email().safeParse(v).success, "Neispravna email adresa"),
  open_24_7: z.boolean(),
  opening_hours: text(300),
  instagram_url: url,
  facebook_url: url,
  maps_url: url,
  viber_number: intlPhone,
  whatsapp_number: intlPhone,
  latitude: coord(-90, 90),
  longitude: coord(-180, 180),
  hero_title: text(90),
  hero_subtitle: text(220),
  about_text: text(4000),
  reserved_display: z.enum(RESERVED_DISPLAY),
  sold_display: z.enum(SOLD_DISPLAY),
});

const notifySchema = z
  .string()
  .max(2000)
  .transform((v) => [...new Set(v.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean))])
  .refine((list) => list.length <= 10, "Najviše 10 adresa")
  .refine((list) => list.every((e) => z.email().safeParse(e).success), "Jedna od adresa nije ispravna");

export async function saveSettings(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string") values[k] = v;
  try {
    const { supabase } = await assertAdmin();
    const parsed = settingsSchema.safeParse({ ...values, open_24_7: values.open_24_7 === "on" });
    const notify = notifySchema.safeParse(values.notification_emails ?? "");
    if (!parsed.success || !notify.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error?.issues ?? []) fieldErrors[String(issue.path[0])] ??= issue.message;
      if (!notify.success) fieldErrors.notification_emails = notify.error.issues[0]?.message ?? "Neispravno";
      return { ok: false, message: "Provjerite označena polja.", fieldErrors, values };
    }

    const { error } = await supabase.from("site_settings").update(parsed.data).eq("id", 1);
    if (error) return { ok: false, message: friendlyDbError(error), values };
    const { error: e2 } = await supabase
      .from("private_settings")
      .update({ notification_emails: notify.data })
      .eq("id", 1);
    if (e2) return { ok: false, message: friendlyDbError(e2), values };

    revalidatePublicSite();
    return { ok: true, message: "Postavke su spremljene i vidljive na stranici." };
  } catch (e) {
    return { ok: false, message: actionError(e), values };
  }
}

const newAdminSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email({ message: "Upišite ispravnu email adresu" })),
  password: z.string().min(12, "Privremena lozinka mora imati najmanje 12 znakova").max(200),
});

/**
 * Dodavanje administratora: stvara korisnički račun (Auth Admin API, server)
 * i upisuje ga u tablicu admins. Smije samo postojeći administrator.
 */
export async function addAdmin(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const { supabase, userId } = await assertAdmin();
    const parsed = newAdminSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Provjerite unos." };
    if (!hasServiceKey()) return { ok: false, message: "Na serveru nije postavljen SUPABASE_SECRET_KEY." };

    const service = serviceClient();
    const { data: created, error } = await service.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
    });
    if (error || !created.user) {
      const exists = error?.code === "email_exists" || error?.status === 422;
      return { ok: false, message: exists ? "Korisnik s tom email adresom već postoji." : "Račun nije bilo moguće stvoriti." };
    }

    // Upis preko sesije administratora → RLS potvrđuje ovlast
    const { error: insErr } = await supabase
      .from("admins")
      .insert({ user_id: created.user.id, email: parsed.data.email, created_by: userId });
    if (insErr) {
      await service.auth.admin.deleteUser(created.user.id);
      return { ok: false, message: friendlyDbError(insErr) };
    }
    revalidatePath("/admin/postavke");
    return { ok: true, message: `Administrator ${parsed.data.email} je dodan. Pošaljite mu privremenu lozinku sigurnim putem.` };
  } catch (e) {
    return { ok: false, message: actionError(e) };
  }
}

export async function removeAdmin(targetUserId: string): Promise<ActionResult> {
  try {
    const { supabase, userId } = await assertAdmin();
    if (!uuidSchema.safeParse(targetUserId).success) return { ok: false, message: "Neispravan korisnik." };
    if (targetUserId === userId) return { ok: false, message: "Ne možete ukloniti sami sebe." };

    const { data, error } = await supabase.from("admins").delete().eq("user_id", targetUserId).select("user_id");
    if (error) return { ok: false, message: friendlyDbError(error) };
    if (!data?.length) return { ok: false, message: "Administrator nije pronađen." };

    if (hasServiceKey()) {
      // Račun se briše da se ne može ponovno prijaviti
      await serviceClient().auth.admin.deleteUser(targetUserId);
    }
    revalidatePath("/admin/postavke");
    return { ok: true, message: "Administrator je uklonjen." };
  } catch (e) {
    return { ok: false, message: actionError(e) };
  }
}

"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { assertAdmin, safeAdminRedirect } from "@/lib/auth";
import { actionError, type ActionResult } from "@/lib/db-errors";
import { siteUrl } from "@/lib/env";
import { sessionClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email({ message: "Upišite ispravnu email adresu" })),
  password: z.string().min(1, "Upišite lozinku").max(200),
});

export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  const email = String(formData.get("email") ?? "").slice(0, 254);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Provjerite unos.", values: { email } };
  }

  const supabase = await sessionClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const msg =
      error.status === 429
        ? "Previše pokušaja prijave. Pričekajte nekoliko minuta."
        : "Email ili lozinka nisu ispravni.";
    return { ok: false, message: msg, values: { email } };
  }

  // Prijava uspješna — ali pristup ima samo administrator
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return { ok: false, message: "Ovaj račun nema pristup administraciji.", values: { email } };
  }

  redirect(safeAdminRedirect(String(formData.get("next") ?? "")));
}

export async function signOut() {
  const supabase = await sessionClient();
  await supabase.auth.signOut();
  redirect("/admin/prijava");
}

export async function requestPasswordReset(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { ok: false, message: "Upišite ispravnu email adresu." };

  const supabase = await sessionClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl()}/auth/potvrda?next=/admin/nova-lozinka`,
  });
  // Isti odgovor bez obzira postoji li račun (ne otkrivamo koji emailovi postoje)
  return {
    ok: true,
    message: "Ako za tu adresu postoji račun, poslali smo poveznicu za postavljanje nove lozinke.",
  };
}

const passwordSchema = z
  .object({
    password: z.string().min(12, "Lozinka mora imati najmanje 12 znakova").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Lozinke se ne podudaraju", path: ["confirm"] });

export async function updatePassword(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    const parsed = passwordSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Provjerite unos." };
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) {
      return {
        ok: false,
        message: error.code === "same_password" ? "Nova lozinka mora se razlikovati od stare." : "Lozinku nije bilo moguće promijeniti.",
      };
    }
    return { ok: true, message: "Lozinka je promijenjena." };
  } catch (e) {
    return { ok: false, message: actionError(e) };
  }
}

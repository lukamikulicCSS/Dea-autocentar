"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { siteUrl } from "@/lib/env";
import { sendInquiryNotification } from "@/lib/notify";
import { serviceClient } from "@/lib/supabase/service";
import { verifyTurnstile } from "@/lib/turnstile";
import { inquirySchema } from "@/lib/vehicles/schema";

export type InquiryState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string; fieldErrors?: { email?: string; message?: string }; values?: { email: string; message: string } };

function clientIp(h: Headers): string {
  // Na Cloudflareu je CF-Connecting-IP pouzdana adresa posjetitelja (postavlja je Cloudflare,
  // posjetitelj je ne može podmetnuti); X-Forwarded-For je rezerva za lokalni razvoj.
  const cf = h.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "nepoznato";
}

/** IP adresa se nikad ne sprema u izvornom obliku — samo HMAC sažetak za ograničenje učestalosti. */
function hashIp(ip: string): string {
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHmac("sha256", `dea-upiti:${secret}`).update(ip).digest("hex");
}

export async function submitInquiry(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    message: String(formData.get("message") ?? ""),
    vehicleId: String(formData.get("vehicleId") ?? ""),
    website: String(formData.get("website") ?? ""),
    turnstileToken: String(formData.get("cf-turnstile-response") ?? "") || undefined,
  };
  const values = { email: raw.email.slice(0, 254), message: raw.message.slice(0, 2000) };

  const parsed = inquirySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: { email?: string; message?: string } = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if ((key === "email" || key === "message") && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Provjerite označena polja.", fieldErrors, values };
  }

  // Honeypot: popunjavaju ga samo botovi. Ne otkrivamo da je upit odbijen.
  if (parsed.data.website) return { status: "success" };

  const h = await headers();
  const ip = clientIp(h);

  if (!(await verifyTurnstile(parsed.data.turnstileToken, ip === "nepoznato" ? null : ip))) {
    return { status: "error", message: "Sigurnosna provjera nije uspjela. Osvježite stranicu i pokušajte ponovno.", values };
  }

  let supabase: ReturnType<typeof serviceClient>;
  try {
    supabase = serviceClient();
  } catch {
    console.error("[upiti] SUPABASE_SECRET_KEY nije postavljen");
    return { status: "error", message: "Upit trenutno nije moguće poslati. Pokušajte ponovno ili nas nazovite.", values };
  }
  const { error } = await supabase.rpc("submit_inquiry", {
    p_email: parsed.data.email,
    p_message: parsed.data.message,
    p_vehicle_id: parsed.data.vehicleId,
    p_ip_hash: hashIp(ip),
  });

  if (error) {
    if (error.message.includes("rate_limited")) {
      return { status: "error", message: "Poslali ste više upita u kratkom vremenu. Pokušajte ponovno za desetak minuta ili nas nazovite.", values };
    }
    if (error.message.includes("vehicle_unavailable")) {
      return { status: "error", message: "Ovo vozilo više nije dostupno za upit. Pogledajte ostalu ponudu ili nas nazovite.", values };
    }
    console.error("[upiti] Spremanje nije uspjelo:", error.code);
    return { status: "error", message: "Upit trenutno nije moguće poslati. Pokušajte ponovno ili nas nazovite.", values };
  }

  // Obavijest administratorima (ako je Resend konfiguriran). Ne utječe na odgovor kupcu.
  try {
    const [{ data: priv }, vehicle] = await Promise.all([
      supabase.from("private_settings").select("notification_emails").eq("id", 1).maybeSingle(),
      parsed.data.vehicleId
        ? supabase.from("vehicles").select("title").eq("id", parsed.data.vehicleId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    await sendInquiryNotification({
      to: (priv?.notification_emails as string[] | undefined) ?? [],
      customerEmail: parsed.data.email,
      message: parsed.data.message,
      vehicleTitle: (vehicle.data as { title?: string } | null)?.title ?? null,
      adminUrl: `${siteUrl()}/admin/upiti`,
    });
  } catch {
    console.error("[upiti] Obavijest nije poslana");
  }

  return { status: "success" };
}

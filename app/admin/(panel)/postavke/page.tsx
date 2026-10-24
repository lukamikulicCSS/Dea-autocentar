import type { Metadata } from "next";
import { CircleCheck, CircleDashed } from "lucide-react";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { PasswordForm } from "@/components/admin/AuthForms";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireAdmin } from "@/lib/auth";
import { indexingAllowed, siteUrl } from "@/lib/env";
import { emailNotificationsEnabled } from "@/lib/notify";
import { hasServiceKey } from "@/lib/supabase/service";
import { turnstileEnabled } from "@/lib/turnstile";
import type { SiteSettings } from "@/lib/types";

export const metadata: Metadata = { title: "Postavke" };

function StatusRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  const Icon = ok ? CircleCheck : CircleDashed;
  return (
    <li className="flex gap-3 py-3">
      <Icon className={`mt-0.5 size-5 shrink-0 ${ok ? "text-status-available" : "text-ink-muted"}`} aria-hidden="true" />
      <div>
        <p className="font-medium">{label}: {ok ? "uključeno" : "nije postavljeno"}</p>
        <p className="text-sm text-ink-muted">{detail}</p>
      </div>
    </li>
  );
}

export default async function SettingsPage() {
  const { supabase, userId } = await requireAdmin("/admin/postavke");
  const [{ data: settings }, { data: priv }, { data: admins }] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", 1).single(),
    supabase.from("private_settings").select("notification_emails").eq("id", 1).single(),
    supabase.from("admins").select("user_id,email,created_at").order("created_at"),
  ]);

  return (
    <>
      <AdminPageTitle title="Postavke" description="Podaci o salonu, tekstovi na stranici, obavijesti i pristup administraciji." />
      {settings && <SettingsForm settings={settings as SiteSettings} notificationEmails={(priv?.notification_emails as string[]) ?? []} />}

      <section className="mt-10 rounded-sm border border-line bg-surface p-4 sm:p-6" aria-labelledby="admini">
        <h2 id="admini" className="text-lg" style={{ fontStretch: "105%" }}>Administratori</h2>
        <div className="mt-5">
          <AdminUsers admins={admins ?? []} currentUserId={userId} />
        </div>
      </section>

      <section className="mt-5 rounded-sm border border-line bg-surface p-4 sm:p-6" aria-labelledby="lozinka">
        <h2 id="lozinka" className="mb-5 text-lg" style={{ fontStretch: "105%" }}>Promjena vaše lozinke</h2>
        <PasswordForm />
      </section>

      <section className="mt-5 rounded-sm border border-line bg-surface p-4 sm:p-6" aria-labelledby="integracije">
        <h2 id="integracije" className="text-lg" style={{ fontStretch: "105%" }}>Stanje integracija</h2>
        <p className="mt-1 text-sm text-ink-muted">Postavlja ih developer preko varijabli okruženja na hostingu.</p>
        <ul className="mt-3 divide-y divide-line">
          <StatusRow ok={emailNotificationsEnabled()} label="Email obavijesti (Resend)" detail="Kad nije postavljeno, upiti se spremaju i vidljivi su ovdje, ali se email ne šalje." />
          <StatusRow ok={turnstileEnabled()} label="Zaštita od botova (Cloudflare Turnstile)" detail="Do tada upite štite ograničenje učestalosti i skriveno polje za botove." />
          <StatusRow ok={hasServiceKey()} label="Serverski ključ (Supabase)" detail="Potreban za zaprimanje upita i dodavanje administratora." />
          <StatusRow ok={indexingAllowed()} label="Indeksiranje u tražilicama" detail={`Adresa stranice: ${siteUrl()}. Uključuje se tek na pravoj domeni.`} />
        </ul>
      </section>
    </>
  );
}

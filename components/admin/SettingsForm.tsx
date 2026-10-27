"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { saveSettings } from "@/app/admin/actions/settings";
import type { ActionResult } from "@/lib/db-errors";
import type { SiteSettings } from "@/lib/types";
import { RESERVED_DISPLAY, RESERVED_DISPLAY_LABELS, SOLD_DISPLAY, SOLD_DISPLAY_LABELS } from "@/lib/vehicles/constants";
import { Notice } from "./Notice";

function toValues(s: SiteSettings, notify: string[]): Record<string, string> {
  const v = (x: string | number | null) => (x === null ? "" : String(x));
  return {
    business_name: s.business_name,
    street_address: v(s.street_address),
    city: v(s.city),
    postal_code: v(s.postal_code),
    phone: v(s.phone),
    email: v(s.email),
    open_24_7: s.open_24_7 ? "on" : "",
    opening_hours: v(s.opening_hours),
    instagram_url: v(s.instagram_url),
    facebook_url: v(s.facebook_url),
    maps_url: v(s.maps_url),
    viber_number: v(s.viber_number),
    whatsapp_number: v(s.whatsapp_number),
    latitude: v(s.latitude),
    longitude: v(s.longitude),
    hero_title: v(s.hero_title),
    hero_subtitle: v(s.hero_subtitle),
    about_text: v(s.about_text),
    reserved_display: s.reserved_display,
    sold_display: s.sold_display,
    notification_emails: notify.join(", "),
  };
}

function Group({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-sm border border-line bg-surface p-4 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <h2 className="text-lg" style={{ fontStretch: "105%" }}>{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function SettingsForm({ settings, notificationEmails }: { settings: SiteSettings; notificationEmails: string[] }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(saveSettings, null);
  const values = state && !state.ok && state.values ? state.values : toValues(settings, notificationEmails);
  const errors = state && !state.ok ? state.fieldErrors ?? {} : {};

  const input = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: string, wide = false) => (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label htmlFor={`s-${name}`} className="label">{label}</label>
      <input id={`s-${name}`} name={name} defaultValue={values[name]} className="field" aria-invalid={errors[name] ? true : undefined} {...props} />
      {hint && <p className="hint">{hint}</p>}
      {errors[name] && <p className="error-text">{errors[name]}</p>}
    </div>
  );

  return (
    <form action={action} className="space-y-5">
      {state && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}

      <Group title="Podaci o salonu" description="Prikazuju se u podnožju, na stranici Kontakt i u podacima za Google. Upisujte samo provjerene podatke.">
        {input("business_name", "Naziv salona *", { required: true, maxLength: 80 }, undefined, true)}
        {input("street_address", "Ulica i broj", { maxLength: 120 })}
        <div className="grid grid-cols-[1fr_2fr] gap-3">
          {input("postal_code", "Poštanski broj", { maxLength: 12, inputMode: "numeric" })}
          {input("city", "Grad", { maxLength: 60 })}
        </div>
        {input("phone", "Telefon", { maxLength: 24, inputMode: "tel" }, "npr. +387 61 310 330")}
        {input("email", "Email za kupce", { maxLength: 254, type: "email" })}
        <div className="sm:col-span-2">
          <label className="flex min-h-12 cursor-pointer items-center gap-3">
            <input type="checkbox" name="open_24_7" defaultChecked={values.open_24_7 === "on"} className="size-5 accent-[#d71920]" />
            <span>Salon je dostupan 0–24 (posjet po dogovoru)</span>
          </label>
        </div>
        {input("opening_hours", "Radno vrijeme (tekst)", { maxLength: 300 }, "npr. „Svaki dan, 0–24” ili „Pon–Pet 8–17, Sub 8–13”", true)}
      </Group>

      <Group title="Društvene mreže i poruke" description="Gumbi se prikazuju samo za upisane kanale.">
        {input("instagram_url", "Instagram (poveznica)", { maxLength: 300, inputMode: "url", placeholder: "https://www.instagram.com/…" })}
        {input("facebook_url", "Facebook (poveznica)", { maxLength: 300, inputMode: "url", placeholder: "https://www.facebook.com/…" })}
        {input("viber_number", "Viber broj", { maxLength: 20, inputMode: "tel", placeholder: "+38761310330" }, "Ostavite prazno dok Viber nije aktivan.")}
        {input("whatsapp_number", "WhatsApp broj", { maxLength: 20, inputMode: "tel", placeholder: "+38761310330" }, "Ostavite prazno dok WhatsApp nije aktivan.")}
      </Group>

      <Group title="Lokacija" description="Poveznica na Google Maps i koordinate poboljšavaju lokalnu vidljivost. Ako ostavite prazno, upute se traže prema adresi.">
        {input("maps_url", "Google Maps poveznica", { maxLength: 500, inputMode: "url" }, undefined, true)}
        {input("latitude", "Geografska širina", { inputMode: "decimal", placeholder: "44.2…" })}
        {input("longitude", "Geografska dužina", { inputMode: "decimal", placeholder: "17.9…" })}
      </Group>

      <Group title="Tekstovi na stranici">
        {input("hero_title", "Naslov na početnoj", { maxLength: 90 }, undefined, true)}
        <div className="sm:col-span-2">
          <label htmlFor="s-hero_subtitle" className="label">Podnaslov na početnoj</label>
          <textarea id="s-hero_subtitle" name="hero_subtitle" defaultValue={values.hero_subtitle} maxLength={220} rows={2} className="field" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="s-about_text" className="label">Tekst „O nama”</label>
          <textarea id="s-about_text" name="about_text" defaultValue={values.about_text} maxLength={4000} rows={9} className="field" />
          <p className="hint">Odlomke odvojite praznim retkom.</p>
        </div>
      </Group>

      <Group title="Prikaz rezerviranih i prodanih vozila">
        <div>
          <label htmlFor="s-reserved_display" className="label">Rezervirana vozila</label>
          <select id="s-reserved_display" name="reserved_display" defaultValue={values.reserved_display} className="field">
            {RESERVED_DISPLAY.map((v) => <option key={v} value={v}>{RESERVED_DISPLAY_LABELS[v]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="s-sold_display" className="label">Prodana vozila</label>
          <select id="s-sold_display" name="sold_display" defaultValue={values.sold_display} className="field">
            {SOLD_DISPLAY.map((v) => <option key={v} value={v}>{SOLD_DISPLAY_LABELS[v]}</option>)}
          </select>
          <p className="hint">Prodana vozila se nikad ne brišu automatski.</p>
        </div>
      </Group>

      <Group title="Obavijesti o upitima" description="Na ove adrese stiže obavijest o svakom novom upitu (kad je slanje emailova uključeno).">
        <div className="sm:col-span-2">
          <label htmlFor="s-notification_emails" className="label">Email adrese</label>
          <input id="s-notification_emails" name="notification_emails" defaultValue={values.notification_emails} className="field" aria-invalid={errors.notification_emails ? true : undefined} placeholder="info@dea.ba, prodaja@dea.ba" />
          <p className="hint">Više adresa odvojite zarezom (najviše 10).</p>
          {errors.notification_emails && <p className="error-text">{errors.notification_emails}</p>}
        </div>
      </Group>

      <div className="sticky bottom-[calc(62px+env(safe-area-inset-bottom))] z-20 -mx-4 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur-sm sm:mx-0 sm:rounded-sm sm:border lg:bottom-4">
        <button className="btn btn-primary" disabled={pending}>
          {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          Spremi postavke
        </button>
      </div>
    </form>
  );
}

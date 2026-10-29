import { Clock, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { fullAddress, mapsHref, openingHours, viberHref, whatsappHref } from "@/lib/contact";
import { phoneHref } from "@/lib/format";
import type { SiteSettings } from "@/lib/types";
import { FacebookIcon, InstagramIcon } from "./SocialIcons";
import { LocationMap } from "./LocationMap";

/** Kontakt podaci — prikazuju se samo podaci upisani u postavkama. */
export function ContactDetails({ settings, tone = "dark" }: { settings: SiteSettings; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  const muted = dark ? "text-fog" : "text-ink-muted";
  const address = fullAddress(settings);
  const directions = mapsHref(settings);
  const hours = openingHours(settings);
  const outline = dark ? "btn-outline-dark" : "btn-outline";

  return (
    <div>
      {settings.phone && (
        <div>
          <p className={`text-sm ${muted}`}>Telefon</p>
          <a href={phoneHref(settings.phone)} className={`tabular mt-1 block text-[1.875rem] font-bold leading-tight sm:text-[2.25rem] ${dark ? "text-white" : "text-ink"}`} style={{ fontStretch: "120%" }}>
            {settings.phone}
          </a>
        </div>
      )}

      <dl className={`mt-8 space-y-4 text-[0.9375rem] ${dark ? "text-white" : "text-ink"}`}>
        {address && (
          <div className="flex gap-3">
            <dt><MapPin className={`mt-0.5 size-4 ${muted}`} aria-hidden="true" /><span className="sr-only">Adresa</span></dt>
            <dd className="min-w-0 flex-1">
              {address}
              <LocationMap query={`${settings.business_name}, ${address}`} label={address} href={directions} dark={dark} />
            </dd>
          </div>
        )}
        {hours && (
          <div className="flex gap-3">
            <dt><Clock className={`mt-0.5 size-4 ${muted}`} aria-hidden="true" /><span className="sr-only">Radno vrijeme</span></dt>
            <dd>{hours}{settings.open_24_7 && <span className={`block text-sm ${muted}`}>Posjet salonu dogovorite telefonom u bilo koje doba.</span>}</dd>
          </div>
        )}
        {settings.email && (
          <div className="flex gap-3">
            <dt><Mail className={`mt-0.5 size-4 ${muted}`} aria-hidden="true" /><span className="sr-only">Email</span></dt>
            <dd><a href={`mailto:${settings.email}`} className="underline decoration-1 underline-offset-4">{settings.email}</a></dd>
          </div>
        )}
      </dl>

      <div className="mt-8 flex flex-wrap gap-2">
        {settings.phone && (
          <a href={phoneHref(settings.phone)} className="btn btn-primary">
            <Phone className="size-4" aria-hidden="true" />
            Nazovite nas
          </a>
        )}
        {directions && (
          <a href={directions} target="_blank" rel="noopener noreferrer" className={`btn ${outline}`}>
            <Navigation className="size-4" aria-hidden="true" />
            Upute do salona
          </a>
        )}
        {settings.whatsapp_number && (
          <a href={whatsappHref(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className={`btn ${outline}`}>
            <MessageCircle className="size-4" aria-hidden="true" />
            WhatsApp
          </a>
        )}
        {settings.viber_number && (
          <a href={viberHref(settings.viber_number)} className={`btn ${outline}`}>
            <MessageCircle className="size-4" aria-hidden="true" />
            Viber
          </a>
        )}
        {settings.instagram_url && (
          <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className={`btn ${outline} px-3`} aria-label="Instagram">
            <InstagramIcon />
          </a>
        )}
        {settings.facebook_url && (
          <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className={`btn ${outline} px-3`} aria-label="Facebook">
            <FacebookIcon />
          </a>
        )}
      </div>
    </div>
  );
}

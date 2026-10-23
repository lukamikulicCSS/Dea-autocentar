import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { fullAddress, mapsHref, openingHours } from "@/lib/contact";
import { phoneHref } from "@/lib/format";
import type { SiteSettings } from "@/lib/types";
import { Logo } from "./Logo";
import { FacebookIcon, InstagramIcon } from "./SocialIcons";

export function Footer({ settings }: { settings: SiteSettings }) {
  const address = fullAddress(settings);
  const hours = openingHours(settings);
  const directions = mapsHref(settings);
  const year = new Date().getFullYear();
  return (
    <footer className="bg-asphalt text-fog">
      <div className="wrap grid gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Logo variant="light" className="w-[120px]" />
          <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed">
            {settings.business_name}
            {settings.city ? `, ${settings.city}` : ""}. Provjerena vozila, probna vožnja i zamjena uz besplatnu procjenu.
          </p>
          <div className="mt-5 flex gap-2">
            {settings.instagram_url && (
              <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-dark size-11 px-0" aria-label="Instagram">
                <InstagramIcon />
              </a>
            )}
            {settings.facebook_url && (
              <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-dark size-11 px-0" aria-label="Facebook">
                <FacebookIcon />
              </a>
            )}
          </div>
        </div>

        <nav aria-label="Podnožje">
          <h2 className="text-sm font-semibold text-white" style={{ fontStretch: "100%" }}>Ponuda</h2>
          <ul className="mt-4 space-y-2.5 text-[0.9375rem]">
            <li><Link className="hover:text-white" href="/vozila">Sva vozila</Link></li>
            <li><Link className="hover:text-white" href="/premium">Premium vozila</Link></li>
            <li><Link className="hover:text-white" href="/u-dolasku">Vozila u dolasku</Link></li>
            {settings.reserved_display === "separate" && (
              <li><Link className="hover:text-white" href="/rezervirano">Rezervirana vozila</Link></li>
            )}
            {settings.sold_display === "archive" && (
              <li><Link className="hover:text-white" href="/prodana-vozila">Prodana vozila</Link></li>
            )}
            <li><Link className="hover:text-white" href="/o-nama">O nama</Link></li>
            <li><Link className="hover:text-white" href="/kontakt">Kontakt</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold text-white" style={{ fontStretch: "100%" }}>Kontakt</h2>
          <ul className="mt-4 space-y-3 text-[0.9375rem]">
            {address && (
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {directions ? (
                  <a className="hover:text-white" href={directions} target="_blank" rel="noopener noreferrer">{address}</a>
                ) : (
                  <span>{address}</span>
                )}
              </li>
            )}
            {settings.phone && (
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <a className="tabular hover:text-white" href={phoneHref(settings.phone)}>{settings.phone}</a>
              </li>
            )}
            {settings.email && (
              <li className="flex gap-3">
                <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <a className="hover:text-white" href={`mailto:${settings.email}`}>{settings.email}</a>
              </li>
            )}
            {hours && (
              <li className="flex gap-3">
                <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{hours}</span>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-line-dark">
        <div className="wrap flex flex-col gap-2 py-5 text-[0.8125rem] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {settings.business_name}</p>
          <Link className="hover:text-white" href="/privatnost">Privatnost i kolačići</Link>
        </div>
      </div>
    </footer>
  );
}

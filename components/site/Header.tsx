import Link from "next/link";
import { Phone } from "lucide-react";
import { phoneHref } from "@/lib/format";
import type { SiteSettings } from "@/lib/types";
import { Logo } from "./Logo";
import { NavLinks } from "./NavLinks";

export function Header({ settings }: { settings: SiteSettings }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line-dark bg-asphalt/95 text-white backdrop-blur-sm" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <a href="#sadrzaj" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-surface focus:px-3 focus:py-2 focus:text-ink">
        Preskoči na sadržaj
      </a>
      <div className="wrap flex h-16 items-center justify-between gap-6">
        <Link href="/" className="shrink-0" aria-label="Auto Centar DEA – početna">
          <Logo variant="light" priority className="w-[5.75rem] lg:w-[6.5rem]" />
        </Link>

        <nav aria-label="Glavna navigacija" className="hidden flex-1 justify-center lg:flex">
          <NavLinks />
        </nav>

        <div className="flex items-center gap-2">
          {settings.phone && (
            <a href={phoneHref(settings.phone)} className="btn btn-sm btn-outline-dark lg:hidden" aria-label={`Nazovite nas: ${settings.phone}`}>
              <Phone className="size-4" aria-hidden="true" />
              Nazovite
            </a>
          )}
          <Link href="/o-nama" className="btn btn-sm px-3 text-fog hover:text-white lg:hidden">
            O nama
          </Link>
          <Link href="/vozila" className="btn btn-sm btn-primary hidden lg:inline-flex">
            Pogledaj vozila
          </Link>
        </div>
      </div>
    </header>
  );
}

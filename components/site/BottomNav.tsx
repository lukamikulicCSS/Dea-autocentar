"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarFront, Gem, House, Phone, Truck } from "lucide-react";
import { NAV_ITEMS, MOBILE_NAV } from "@/lib/content";
import { isActive } from "./NavLinks";

const ICONS = { "/": House, "/vozila": CarFront, "/premium": Gem, "/u-dolasku": Truck, "/kontakt": Phone } as const;

/**
 * Mobilna navigacija bez hamburger izbornika: pet jasno označenih odredišta.
 * Fiksirana je na dnu, poštuje iOS safe-area, a sadržaj stranice ima
 * jednak donji razmak (.pb-nav) pa ništa ne ostaje prekriveno.
 */
export function BottomNav() {
  const pathname = usePathname();
  const items = MOBILE_NAV.map((href) => NAV_ITEMS.find((i) => i.href === href)!);
  return (
    <nav
      aria-label="Glavna navigacija"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line-dark bg-asphalt/95 backdrop-blur-sm lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid h-[62px] grid-cols-5">
        {items.map((item) => {
          const Icon = ICONS[item.href as keyof typeof ICONS];
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium ${
                  active ? "text-white" : "text-fog"
                }`}
              >
                {active && <span aria-hidden="true" className="absolute inset-x-4 top-0 h-[3px] bg-red" />}
                <Icon className="size-[22px]" strokeWidth={active ? 2.2 : 1.7} aria-hidden="true" />
                <span>{item.short}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

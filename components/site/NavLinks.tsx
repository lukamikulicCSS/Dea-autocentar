"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/content";

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Vodoravna navigacija za tablet i desktop. */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex h-10 items-center rounded-sm px-3 text-[0.9375rem] font-medium transition-colors ${
                active ? "text-white" : "text-fog hover:text-white"
              }`}
            >
              {item.label}
              {active && <span aria-hidden="true" className="absolute inset-x-3 -bottom-[13px] h-[3px] bg-red" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarFront, Inbox, LayoutDashboard, Plus, Settings } from "lucide-react";

const ITEMS = [
  { href: "/admin", label: "Pregled", icon: LayoutDashboard, exact: true },
  { href: "/admin/vozila", label: "Vozila", icon: CarFront },
  { href: "/admin/vozila/novo", label: "Dodaj vozilo", short: "Dodaj", icon: Plus, accent: true },
  { href: "/admin/upiti", label: "Upiti", icon: Inbox, badge: true },
  { href: "/admin/postavke", label: "Postavke", icon: Settings },
] as const;

function active(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  if (href === "/admin/vozila") return pathname.startsWith("/admin/vozila") && !pathname.startsWith("/admin/vozila/novo");
  return pathname.startsWith(href);
}

export function AdminSidebarNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {ITEMS.map((item) => {
        const isActive = active(pathname, item.href, "exact" in item ? item.exact : false);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex h-11 items-center gap-3 rounded-sm px-3 text-[0.9375rem] font-medium transition-colors ${
                isActive ? "bg-graphite-2 text-white" : "text-fog hover:bg-graphite hover:text-white"
              }`}
            >
              <Icon className={`size-[18px] ${"accent" in item && item.accent ? "text-red" : ""}`} aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {"badge" in item && item.badge && unread > 0 && (
                <span className="tabular rounded-sm bg-red px-1.5 py-0.5 text-xs font-bold text-white">
                  {unread}
                  <span className="sr-only"> nepročitanih</span>
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminBottomNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Administracija" className="fixed inset-x-0 bottom-0 z-40 border-t border-line-dark bg-asphalt lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <ul className="grid h-[62px] grid-cols-5">
        {ITEMS.map((item) => {
          const isActive = active(pathname, item.href, "exact" in item ? item.exact : false);
          const Icon = item.icon;
          const accent = "accent" in item && item.accent;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex h-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium ${isActive ? "text-white" : "text-fog"}`}
              >
                {isActive && <span aria-hidden="true" className="absolute inset-x-4 top-0 h-[3px] bg-red" />}
                <span className={`relative flex items-center justify-center ${accent ? "size-8 rounded-sm bg-red text-white" : ""}`}>
                  <Icon className="size-[20px]" aria-hidden="true" />
                  {"badge" in item && item.badge && unread > 0 && (
                    <span className="tabular absolute -right-2.5 -top-1.5 rounded-sm bg-red px-1 text-[0.625rem] font-bold leading-4 text-white">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </span>
                <span>{"short" in item ? item.short : item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

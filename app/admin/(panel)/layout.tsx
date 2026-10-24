import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { AdminBottomNav, AdminSidebarNav } from "@/components/admin/AdminNav";
import { Logo } from "@/components/site/Logo";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "../actions/auth";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { supabase, email } = await requireAdmin();
  const { count } = await supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("is_read", false);
  const unread = count ?? 0;

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[248px_1fr]">
      <aside className="hidden flex-col bg-asphalt p-4 lg:flex">
        <Link href="/" className="mb-8 mt-2 block px-3" aria-label="Otvori web stranicu Auto Centra DEA">
          <Logo variant="light" className="w-[92px]" />
        </Link>
        <nav aria-label="Administracija" className="flex-1">
          <AdminSidebarNav unread={unread} />
        </nav>
        <div className="space-y-1 border-t border-line-dark pt-4">
          <a href="/" target="_blank" className="flex h-10 items-center gap-3 rounded-sm px-3 text-sm text-fog hover:text-white">
            <ExternalLink className="size-4" aria-hidden="true" />
            Otvori web stranicu
          </a>
          <form action={signOut}>
            <button className="flex h-10 w-full items-center gap-3 rounded-sm px-3 text-left text-sm text-fog hover:text-white">
              <LogOut className="size-4" aria-hidden="true" />
              Odjava
            </button>
          </form>
          <p className="truncate px-3 pt-2 text-xs text-[#7d838a]" title={email}>{email}</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line-dark bg-asphalt px-4 lg:hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <Link href="/" aria-label="Otvori web stranicu Auto Centra DEA">
            <Logo variant="light" className="w-[72px]" />
          </Link>
          <div className="flex items-center gap-1">
            <a href="/" target="_blank" className="btn btn-sm px-3 text-fog">Stranica</a>
            <form action={signOut}>
              <button className="btn btn-sm btn-outline-dark">Odjava</button>
            </form>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-[calc(84px+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          {children}
        </main>
      </div>
      <AdminBottomNav unread={unread} />
    </div>
  );
}
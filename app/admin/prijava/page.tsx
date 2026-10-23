import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/AuthForms";
import { safeAdminRedirect } from "@/lib/auth";
import { AuthShell } from "../AuthShell";

export const metadata: Metadata = { title: "Prijava" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/prijava">) {
  const sp = await searchParams;
  const next = safeAdminRedirect(typeof sp.next === "string" ? sp.next : undefined);
  const error =
    sp.greska === "pristup"
      ? "Ovaj račun nema pristup administraciji."
      : sp.greska === "poveznica"
        ? "Poveznica je istekla ili nije ispravna. Zatražite novu."
        : undefined;
  return (
    <AuthShell title="Prijava u administraciju">
      <LoginForm next={next} initialError={error} />
    </AuthShell>
  );
}

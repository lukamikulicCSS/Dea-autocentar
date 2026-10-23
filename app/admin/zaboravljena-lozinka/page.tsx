import type { Metadata } from "next";
import { ResetRequestForm } from "@/components/admin/AuthForms";
import { AuthShell } from "../AuthShell";

export const metadata: Metadata = { title: "Zaboravljena lozinka" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Nova lozinka">
      <p className="mb-5 text-[0.9375rem] text-ink-muted">Upišite email adresu računa. Poslat ćemo vam poveznicu za postavljanje nove lozinke.</p>
      <ResetRequestForm />
    </AuthShell>
  );
}

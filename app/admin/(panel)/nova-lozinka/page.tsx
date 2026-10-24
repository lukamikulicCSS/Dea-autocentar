import type { Metadata } from "next";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { PasswordForm } from "@/components/admin/AuthForms";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Nova lozinka" };

export default async function NewPasswordPage() {
  await requireAdmin("/admin/nova-lozinka");
  return (
    <>
      <AdminPageTitle title="Postavite novu lozinku" description="Upišite novu lozinku za svoj račun." />
      <div className="max-w-md rounded-sm border border-line bg-surface p-6">
        <PasswordForm />
      </div>
    </>
  );
}

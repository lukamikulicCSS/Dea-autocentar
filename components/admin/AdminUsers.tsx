"use client";

import { useActionState } from "react";
import { LoaderCircle, UserPlus } from "lucide-react";
import { addAdmin, removeAdmin } from "@/app/admin/actions/settings";
import type { ActionResult } from "@/lib/db-errors";
import { formatDate } from "@/lib/format";
import { ConfirmButton } from "./ConfirmButton";
import { Notice } from "./Notice";

export function AdminUsers({ admins, currentUserId }: { admins: { user_id: string; email: string; created_at: string }[]; currentUserId: string }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(addAdmin, null);
  return (
    <div className="space-y-5">
      <ul className="divide-y divide-line rounded-sm border border-line">
        {admins.map((a) => (
          <li key={a.user_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{a.email}{a.user_id === currentUserId && <span className="ml-2 text-sm text-ink-muted">(vi)</span>}</p>
              <p className="text-xs text-ink-muted">Dodan {formatDate(a.created_at)}</p>
            </div>
            {a.user_id !== currentUserId && admins.length > 1 && (
              <ConfirmButton
                label="Ukloni"
                title="Ukloniti administratora?"
                description={`${a.email} više se neće moći prijaviti u administraciju, a korisnički račun bit će obrisan.`}
                confirmLabel="Ukloni"
                onConfirm={() => removeAdmin(a.user_id)}
                className="btn btn-sm btn-outline text-red-deep"
              />
            )}
          </li>
        ))}
      </ul>

      <form action={action} className="grid gap-3 rounded-sm bg-paper p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" key={state?.ok ? `ok-${state.message}` : "add"}>
        <div>
          <label htmlFor="na-email" className="label">Email novog administratora</label>
          <input id="na-email" name="email" type="email" required className="field" autoComplete="off" />
        </div>
        <div>
          <label htmlFor="na-pass" className="label">Privremena lozinka</label>
          <input id="na-pass" name="password" type="password" required minLength={12} className="field" autoComplete="new-password" />
        </div>
        <button className="btn btn-dark" disabled={pending}>
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <UserPlus className="size-4" aria-hidden="true" />}
          Dodaj
        </button>
        <p className="hint mt-0 sm:col-span-3">Svi administratori imaju ista prava. Novi administrator neka odmah promijeni lozinku u Postavkama.</p>
      </form>
      {state && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
    </div>
  );
}

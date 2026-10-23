"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { requestPasswordReset, signIn, updatePassword } from "@/app/admin/actions/auth";
import type { ActionResult } from "@/lib/db-errors";
import { Notice } from "./Notice";

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(signIn, null);
  const error = state && !state.ok ? state.message : initialError;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? "/admin"} />
      {error && <Notice tone="error">{error}</Notice>}
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" defaultValue={state && !state.ok ? state.values?.email : undefined} />
      </div>
      <div>
        <label htmlFor="password" className="label">Lozinka</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
      </div>
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        Prijava
      </button>
      <p className="text-center text-sm">
        <Link href="/admin/zaboravljena-lozinka" className="text-steel underline underline-offset-2">Zaboravili ste lozinku?</Link>
      </p>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(requestPasswordReset, null);
  if (state?.ok) return <Notice tone="success">{state.message}</Notice>;
  return (
    <form action={action} className="space-y-4">
      {state && !state.ok && <Notice tone="error">{state.message}</Notice>}
      <div>
        <label htmlFor="email" className="label">Email adresa računa</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" />
      </div>
      <button className="btn btn-dark w-full" disabled={pending}>
        {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        Pošalji poveznicu
      </button>
      <p className="text-center text-sm">
        <Link href="/admin/prijava" className="text-steel underline underline-offset-2">Natrag na prijavu</Link>
      </p>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(updatePassword, null);
  return (
    <form action={action} className="space-y-4" key={state?.ok ? "done" : "form"}>
      {state && <Notice tone={state.ok ? "success" : "error"}>{state.message}</Notice>}
      <div>
        <label htmlFor="password" className="label">Nova lozinka</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required className="field" />
        <p className="hint">Najmanje 12 znakova. Preporuka: nekoliko riječi koje nisu povezane.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="label">Ponovite lozinku</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="field" />
      </div>
      <button className="btn btn-dark" disabled={pending}>
        {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
        Spremi lozinku
      </button>
    </form>
  );
}

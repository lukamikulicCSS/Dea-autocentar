"use client";

import { useId, useRef, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import type { ActionResult } from "@/lib/db-errors";

/**
 * Gumb s potvrdom u dijalogu (za radnje koje se ne mogu poništiti).
 * `requireText` traži da korisnik upiše riječ (npr. OBRIŠI) prije potvrde.
 */
export function ConfirmButton({
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
  requireText,
  className = "btn btn-outline btn-sm",
  danger = true,
  children,
}: {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (typed: string) => Promise<ActionResult | void>;
  requireText?: string;
  className?: string;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const id = useId();

  return (
    <>
      <button type="button" className={className} onClick={() => { setError(null); setTyped(""); ref.current?.showModal(); }}>
        {children ?? label}
      </button>
      <dialog ref={ref} className="modal" aria-labelledby={`${id}-t`} aria-describedby={`${id}-d`}>
        <div className="p-6">
          <h2 id={`${id}-t`} className="text-xl" style={{ fontStretch: "110%" }}>{title}</h2>
          <p id={`${id}-d`} className="mt-2 text-[0.9375rem] text-ink-muted">{description}</p>
          {requireText && (
            <div className="mt-4">
              <label htmlFor={`${id}-i`} className="label">
                Za potvrdu upišite <strong>{requireText}</strong>
              </label>
              <input id={`${id}-i`} className="field" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="characters" />
            </div>
          )}
          {error && <p role="alert" className="error-text mt-3">{error}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn btn-outline" onClick={() => ref.current?.close()} autoFocus>
              Odustani
            </button>
            <button
              type="button"
              disabled={pending || (requireText ? typed.trim().toUpperCase() !== requireText : false)}
              className={`btn ${danger ? "btn-primary" : "btn-dark"}`}
              onClick={() =>
                start(async () => {
                  const res = await onConfirm(typed.trim().toUpperCase());
                  if (res && !res.ok) setError(res.message);
                  else ref.current?.close();
                })
              }
            >
              {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

"use client";

import { RotateCcw } from "lucide-react";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="wrap py-24">
      <span aria-hidden="true" className="mb-4 block h-[3px] w-10 -skew-x-[28deg] bg-red" />
      <h1 className="text-3xl">Stranicu trenutno nije moguće učitati</h1>
      <p className="mt-4 max-w-xl text-ink-muted">
        Došlo je do privremenog problema pri dohvaćanju ponude. Pokušajte ponovno za nekoliko trenutaka.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn btn-dark">
          <RotateCcw className="size-4" aria-hidden="true" />
          Pokušaj ponovno
        </button>
        <a href="/kontakt" className="btn btn-outline">Kontakt</a>
      </div>
    </div>
  );
}

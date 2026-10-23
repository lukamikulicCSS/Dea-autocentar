"use client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-sm border border-line bg-white p-8">
      <h1 className="text-2xl">Nešto nije u redu</h1>
      <p className="mt-2 text-ink-muted">Podatke trenutno nije moguće učitati. Provjerite internetsku vezu i pokušajte ponovno.</p>
      <button type="button" onClick={reset} className="btn btn-dark mt-6">Pokušaj ponovno</button>
    </div>
  );
}

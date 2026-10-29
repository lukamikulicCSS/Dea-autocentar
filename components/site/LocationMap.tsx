/**
 * Mala karta s lokacijom salona (Google Maps embed, bez API ključa).
 * Učitava se lijeno — tek kad se korisnik približi kontakt sekciji.
 */
export function LocationMap({ query, label, href, dark }: { query: string; label: string; href: string | null; dark: boolean }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
  return (
    <div className="mt-3">
      <div className={`relative aspect-[16/9] w-full max-w-[28rem] overflow-hidden rounded-sm border ${dark ? "border-line-dark bg-graphite" : "border-line bg-surface"}`}>
        <iframe
          src={src}
          title={`Karta: ${label}`}
          className="absolute inset-0 size-full border-0"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" className={`mt-2 inline-block text-sm underline decoration-1 underline-offset-4 ${dark ? "text-fog hover:text-white" : "text-ink-muted hover:text-ink"}`}>
          Otvori u Google Kartama
        </a>
      )}
    </div>
  );
}

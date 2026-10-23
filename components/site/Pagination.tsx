import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (page: number) => string }) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );
  return (
    <nav aria-label="Stranice rezultata" className="mt-12 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="btn btn-outline btn-sm" rel="prev">
          <ChevronLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Prethodna</span>
          <span className="sr-only sm:hidden">Prethodna stranica</span>
        </Link>
      ) : null}
      {pages.map((p, i) => {
        const gap = i > 0 && p - pages[i - 1]! > 1;
        return (
          <span key={p} className="flex items-center gap-1.5">
            {gap && <span className="px-1 text-ink-muted" aria-hidden="true">…</span>}
            <Link
              href={hrefFor(p)}
              aria-current={p === page ? "page" : undefined}
              className={`btn btn-sm tabular min-w-10 px-2 ${p === page ? "btn-dark" : "btn-outline"}`}
            >
              {p}
            </Link>
          </span>
        );
      })}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className="btn btn-outline btn-sm" rel="next">
          <span className="hidden sm:inline">Sljedeća</span>
          <span className="sr-only sm:hidden">Sljedeća stranica</span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}

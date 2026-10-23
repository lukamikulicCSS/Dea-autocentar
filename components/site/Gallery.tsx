"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, ImageOff, X } from "lucide-react";

export type GalleryImage = { src: string; alt: string; width: number | null; height: number | null };

/**
 * Galerija: prirodno klizanje prstom (CSS scroll-snap), strelice tipkovnice,
 * sličice i prikaz preko cijelog zaslona. Slike izvan prikaza učitavaju se lijeno.
 */
export function Gallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lightTrackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = images.length;

  const scrollTo = useCallback((track: HTMLDivElement | null, i: number, smooth = true) => {
    if (!track) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: i * track.clientWidth, behavior: smooth && !reduce ? "smooth" : "auto" });
  }, []);

  const go = useCallback(
    (i: number) => {
      const next = (i + count) % count;
      setIndex(next);
      scrollTo(trackRef.current, next);
      if (dialogRef.current?.open) scrollTo(lightTrackRef.current, next);
    },
    [count, scrollTo],
  );

  // Praćenje trenutne slike pri klizanju prstom
  const onScroll = (track: HTMLDivElement) => {
    const i = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    if (i !== index && i >= 0 && i < count) setIndex(i);
  };

  const openLightbox = () => {
    dialogRef.current?.showModal();
    requestAnimationFrame(() => scrollTo(lightTrackRef.current, index, false));
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => scrollTo(trackRef.current, index, false);
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [index, scrollTo]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    }
  };

  if (count === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-sm bg-[#e7e7e2] text-ink-muted">
        <ImageOff className="size-10" aria-hidden="true" />
        <span className="sr-only">Fotografije još nisu dodane</span>
      </div>
    );
  }

  return (
    <section aria-roledescription="galerija" aria-label={`Fotografije: ${title}`} onKeyDown={onKeyDown}>
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={(e) => onScroll(e.currentTarget)}
          className="flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-sm bg-graphite [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          tabIndex={0}
          aria-label="Klizite ili koristite strelice za sljedeću fotografiju"
        >
          {images.map((img, i) => (
            <div
              key={img.src}
              className="relative h-full w-full shrink-0 snap-center"
              role="group"
              aria-roledescription="fotografija"
              aria-label={`${i + 1} od ${count}`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                priority={i === 0}
                loading={i === 0 ? undefined : "lazy"}
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button type="button" onClick={() => go(index - 1)} className="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-sm bg-asphalt/75 text-white hover:bg-asphalt sm:flex" aria-label="Prethodna fotografija">
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => go(index + 1)} className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-sm bg-asphalt/75 text-white hover:bg-asphalt sm:flex" aria-label="Sljedeća fotografija">
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        )}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between">
          <span className="tabular rounded-sm bg-asphalt/80 px-2 py-1 text-xs font-semibold text-white" aria-live="polite">
            {index + 1} / {count}
          </span>
          <button type="button" onClick={openLightbox} className="pointer-events-auto flex h-9 items-center gap-1.5 rounded-sm bg-asphalt/80 px-3 text-xs font-semibold text-white hover:bg-asphalt">
            <Expand className="size-3.5" aria-hidden="true" />
            Uvećaj
          </button>
        </div>
      </div>

      {count > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" aria-label="Sličice">
          {images.map((img, i) => (
            <li key={img.src} className="shrink-0">
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Prikaži fotografiju ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={`relative block h-16 w-[5.5rem] overflow-hidden rounded-sm border-2 transition-opacity ${
                  i === index ? "border-red" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={img.src} alt="" fill sizes="88px" className="object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog ref={dialogRef} className="sheet" aria-label={`Fotografije: ${title}`} onKeyDown={onKeyDown}>
        <div className="flex h-full flex-col bg-asphalt">
          <div className="flex items-center justify-between px-4 py-3 text-white" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
            <span className="tabular text-sm font-semibold">
              {index + 1} / {count}
            </span>
            <button type="button" onClick={() => dialogRef.current?.close()} className="btn btn-sm btn-outline-dark" autoFocus>
              <X className="size-4" aria-hidden="true" />
              Zatvori
            </button>
          </div>
          <div
            ref={lightTrackRef}
            onScroll={(e) => onScroll(e.currentTarget)}
            className="flex flex-1 snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((img) => (
              <div key={img.src} className="relative h-full w-full shrink-0 snap-center">
                <Image src={img.src} alt={img.alt} fill sizes="100vw" className="object-contain" loading="lazy" />
              </div>
            ))}
          </div>
          {count > 1 && (
            <div className="flex justify-center gap-3 p-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
              <button type="button" onClick={() => go(index - 1)} className="btn btn-outline-dark" aria-label="Prethodna fotografija">
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => go(index + 1)} className="btn btn-outline-dark" aria-label="Sljedeća fotografija">
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </dialog>
    </section>
  );
}

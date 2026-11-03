"use client";

import Image from "next/image";
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, ImageOff, X } from "lucide-react";

export type GalleryImage = { src: string; alt: string; width: number | null; height: number | null };

/** Koliko fotografija lijevo i desno od trenutne je spremno unaprijed (učitano i dekodirano). */
const WINDOW = 3;
/** Pomak prsta (px) nakon kojeg se odlučuje je li pokret vodoravan ili okomit. */
const AXIS_LOCK_PX = 8;

/** Je li fotografija i unutar prozora oko trenutne (kružno, jer se listanje vrti ukrug). */
function inWindow(i: number, index: number, count: number) {
  const d = Math.abs(i - index);
  return Math.min(d, count - d) <= WINDOW;
}

/**
 * Traka koja se pomiče isključivo vodoravno.
 *
 * Zašto je glatka:
 *  - za vrijeme povlačenja React se NE renderira — pomak se upisuje izravno u
 *    transform (jednom po sličici zaslona, requestAnimationFrame), pa nema
 *    zastoja zbog usklađivanja komponenti;
 *  - pomiče se samo transform (GPU sloj), ništa što traži ponovni raspored;
 *  - touch-action: pan-y → okomiti pokret pripada stranici, vodoravni galeriji.
 */
function SwipeTrack({
  index,
  count,
  onIndex,
  className,
  touchAction,
  children,
}: {
  index: number;
  count: number;
  onIndex: (i: number) => void;
  className?: string;
  touchAction: string;
  children: React.ReactNode;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: number; x: number; y: number; t: number; axis: "x" | "y" | null; dx: number } | null>(null);
  const frame = useRef(0);
  const indexRef = useRef(index);
  const mounted = useRef(false);

  const apply = useCallback((dx: number, animate: boolean) => {
    const track = trackRef.current;
    if (!track) return;
    track.classList.toggle("is-settling", animate);
    track.style.transform = `translate3d(calc(${-indexRef.current * 100}% + ${dx}px), 0, 0)`;
  }, []);

  // Promjena fotografije (strelice, sličice, prst): animirano; prvi prikaz: bez animacije
  useLayoutEffect(() => {
    indexRef.current = index;
    apply(0, mounted.current);
    mounted.current = true;
  }, [index, apply]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const end = (commit: boolean) => {
    const g = gesture.current;
    gesture.current = null;
    cancelAnimationFrame(frame.current);
    if (!g || g.axis !== "x") return;
    const dx = g.dx;
    const width = viewportRef.current?.clientWidth ?? 1;
    const velocity = Math.abs(dx) / Math.max(performance.now() - g.t, 1);
    const far = commit && (Math.abs(dx) > width * 0.18 || (velocity > 0.45 && Math.abs(dx) > 24));
    const next = far ? Math.min(Math.max(index + (dx < 0 ? 1 : -1), 0), count - 1) : index;
    if (next !== index) onIndex(next);
    else apply(0, true); // vrati se na mjesto
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (count < 2 || (e.pointerType === "mouse" && e.button !== 0)) return;
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), axis: null, dx: 0 };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.axis) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (g.axis === "y") {
        gesture.current = null; // okomiti pokret pripada stranici
        return;
      }
      viewportRef.current?.setPointerCapture(e.pointerId);
    }
    // Na prvoj i zadnjoj fotografiji traka se samo malo "opire"
    const atEdge = (index === 0 && dx > 0) || (index === count - 1 && dx < 0);
    g.dx = atEdge ? dx * 0.3 : dx;
    if (!frame.current) {
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        if (gesture.current) apply(gesture.current.dx, false);
      });
    }
  };

  return (
    <div
      ref={viewportRef}
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{ touchAction }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => end(true)}
      onPointerCancel={() => end(false)}
      // Kad galerija preuzme prst, fotografija ga "gubi" — to nije kraj pokreta
      onLostPointerCapture={(e) => {
        if (e.target === e.currentTarget) end(true);
      }}
      onDragStart={(e) => e.preventDefault()}
    >
      <div ref={trackRef} className="gallery-track flex h-full">
        {children}
      </div>
    </div>
  );
}

/**
 * Jedna fotografija — uvijek prikazana CIJELA (object-contain) na tamnoj podlozi.
 * Memo: pri listanju se ne renderira ponovo. (Zamućena pozadina iza fotografija je
 * uklonjena: blur filter je na mobitelu bio glavni uzrok zapinjanja.)
 */
const Slide = memo(function Slide({ img, load, priority, sizes }: { img: GalleryImage; load: boolean; priority?: boolean; sizes: string }) {
  return (
    <div className="gallery-slide relative h-full w-full shrink-0 overflow-hidden">
      {load && (
        <Image
          src={img.src}
          alt={img.alt}
          fill
          priority={priority}
          loading={priority ? undefined : "eager"}
          sizes={sizes}
          className="object-contain"
          draggable={false}
        />
      )}
    </div>
  );
});

/**
 * Galerija vozila: klizanje prstom samo lijevo/desno, strelice tipkovnice,
 * sličice i prikaz preko cijelog zaslona.
 */
export function Gallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const thumbsRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const count = images.length;

  // Aktivna sličica uvijek vidljiva — pomiče se samo traka sličica, nikad cijela stranica
  useEffect(() => {
    const list = thumbsRef.current;
    const thumb = list?.children[index] as HTMLElement | undefined;
    if (list && thumb) list.scrollTo({ left: thumb.offsetLeft - (list.clientWidth - thumb.clientWidth) / 2, behavior: "smooth" });
  }, [index]);

  const go = useCallback((i: number) => setIndex((i + count) % count), [count]);

  const openLightbox = () => {
    dialogRef.current?.showModal();
    document.documentElement.style.overflow = "hidden";
    setOpen(true);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => {
      document.documentElement.style.overflow = "";
      setOpen(false);
    };
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

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
      <div className="flex aspect-[4/3] items-center justify-center rounded-sm bg-line text-ink-muted">
        <ImageOff className="size-10" aria-hidden="true" />
        <span className="sr-only">Fotografije još nisu dodane</span>
      </div>
    );
  }

  return (
    <section aria-roledescription="galerija" aria-label={`Fotografije: ${title}`} onKeyDown={onKeyDown}>
      <div className="relative select-none overflow-hidden rounded-sm bg-graphite">
        <SwipeTrack index={index} count={count} onIndex={setIndex} touchAction="pan-y pinch-zoom" className="aspect-[4/3]">
          {images.map((img, i) => (
            <div key={img.src} className="h-full w-full shrink-0" role="group" aria-roledescription="fotografija" aria-label={`${i + 1} od ${count}`} aria-hidden={i !== index}>
              <Slide img={img} load={inWindow(i, index, count)} priority={i === 0} sizes="(min-width: 1024px) 60vw, 100vw" />
            </div>
          ))}
        </SwipeTrack>

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
        <ul ref={thumbsRef} className="relative mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" aria-label="Sličice">
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
        {/* Fiksna visina (svh) — ne mijenja se kad se traka preglednika na mobitelu skriva/prikazuje */}
        <div className="flex h-svh flex-col bg-asphalt">
          <div className="flex items-center justify-between px-4 py-3 text-white" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
            <span className="tabular text-sm font-semibold">
              {index + 1} / {count}
            </span>
            <button type="button" onClick={() => dialogRef.current?.close()} className="btn btn-sm btn-outline-dark" autoFocus>
              <X className="size-4" aria-hidden="true" />
              Zatvori
            </button>
          </div>
          <SwipeTrack index={index} count={count} onIndex={setIndex} touchAction="pinch-zoom" className="min-h-0 flex-1">
            {images.map((img, i) => (
              <div key={img.src} className="h-full w-full shrink-0" aria-hidden={i !== index}>
                <Slide img={img} load={open && inWindow(i, index, count)} sizes="100vw" />
              </div>
            ))}
          </SwipeTrack>
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

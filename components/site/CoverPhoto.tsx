import Image from "next/image";

type Img = { storage_path: string; width: number | null; height: number | null };

const MIN_RATIO = 0.8;
const MAX_RATIO = 16 / 9;

/** Omjer fotografije (širina/visina), ograničen da kartice ne budu preuske ili previsoke. */
export function photoRatio(img: Img | undefined, min = MIN_RATIO, max = MAX_RATIO): number {
  if (!img?.width || !img?.height) return 4 / 3;
  return Math.min(max, Math.max(min, img.width / img.height));
}

/** Stane li fotografija u okvir svog omjera bez praznog prostora (pa pozadina nije potrebna)? */
export function fitsNaturalFrame(img: Img | undefined): boolean {
  if (!img?.width || !img?.height) return false;
  const r = img.width / img.height;
  return r >= MIN_RATIO && r <= MAX_RATIO;
}

/**
 * Fotografija vozila koja se NIKAD ne reže: cijela slika (object-contain) preko
 * zamućene, uvećane kopije iste slike kao pozadine. Obje slike imaju isti URL pa se
 * preuzimaju samo jednom.
 *
 * backdrop: kad se zamućena pozadina crta. "sm"/"md" = tek od te širine (ispod nje okvir
 * prati omjer fotografije pa pozadina ne bi bila vidljiva — ne trošimo GPU na mobitelu).
 */
export function CoverPhoto({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
  backdrop = "always",
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  backdrop?: "always" | "sm" | "md";
}) {
  const backdropClass = backdrop === "sm" ? "hidden sm:block" : backdrop === "md" ? "hidden md:block" : "";
  return (
    <>
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        fill
        sizes={sizes}
        className={`scale-125 object-cover opacity-70 blur-2xl brightness-75 saturate-125 ${backdropClass}`}
      />
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={`object-contain ${className}`} />
    </>
  );
}

import Image from "next/image";

type Img = { storage_path: string; width: number | null; height: number | null };

/** Omjer fotografije (širina/visina), ograničen da kartice ne budu preuske ili previsoke. */
export function photoRatio(img: Img | undefined, min = 0.8, max = 16 / 9): number {
  if (!img?.width || !img?.height) return 4 / 3;
  return Math.min(max, Math.max(min, img.width / img.height));
}

/**
 * Fotografija vozila koja se NIKAD ne reže: cijela slika (object-contain) preko
 * zamućene, uvećane kopije iste slike kao pozadine. Kad okvir ima isti omjer kao
 * fotografija, pozadina se ne vidi; kad nema, rubovi su ispunjeni bojama fotografije
 * umjesto praznih traka. Obje slike imaju isti URL pa se preuzimaju samo jednom.
 */
export function CoverPhoto({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <>
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        fill
        sizes={sizes}
        priority={priority}
        className="scale-125 object-cover opacity-70 blur-2xl brightness-75 saturate-125"
      />
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={`object-contain ${className}`} />
    </>
  );
}

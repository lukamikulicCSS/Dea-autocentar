export const VEHICLE_BUCKET = "vehicle-images";

/** Najveća veličina jedne fotografije koju server prima (nakon smanjivanja u pregledniku). */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
/** Najveća dimenzija spremljene fotografije (dulja stranica). */
export const MAX_IMAGE_EDGE = 2400;
export const MAX_IMAGES_PER_VEHICLE = 40;

/** Javni URL fotografije iz javnog bucketa (samo čitanje). */
export function vehicleImageUrl(storagePath: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${VEHICLE_BUCKET}/${storagePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

export type SniffedImage = "jpeg" | "png" | "webp" | "heic" | null;

/**
 * Prepoznaje vrstu slike prema stvarnom sadržaju (potpisu datoteke),
 * a ne prema imenu ili MIME tipu koji šalje preglednik.
 * SVG, HTML, PDF, izvršne datoteke i sve ostalo se odbija.
 */
export function sniffImageType(bytes: Uint8Array): SniffedImage {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return "png";
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (ascii(4, 8) === "ftyp" && /^(heic|heix|hevc|hevx|mif1|msf1)$/.test(ascii(8, 12))) return "heic";
  return null;
}

/** Opisni alt tekst kad administrator nije upisao vlastiti. */
export function vehicleAlt(
  v: { title: string; year: number },
  image: { alt_text: string | null } | undefined,
  index: number,
): string {
  if (image?.alt_text) return image.alt_text;
  return index === 0 ? `${v.title}, ${v.year}.` : `${v.title}, ${v.year}. – fotografija ${index + 1}`;
}

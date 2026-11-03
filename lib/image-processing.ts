import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { MAX_IMAGE_EDGE } from "@/lib/images";

/** Najveći broj piksela ulazne fotografije (zaštita od „decompression bomb“ datoteka). */
const MAX_INPUT_PIXELS = 60_000_000;

/** Minimalni opis Cloudflare Images bindinga koji koristimo (bez ovisnosti o generiranim tipovima). */
type ImagesBinding = {
  info(stream: ReadableStream<Uint8Array>): Promise<{ format: string; fileSize?: number; width?: number; height?: number }>;
  input(stream: ReadableStream<Uint8Array>): {
    transform(options: { width?: number; height?: number; fit?: "scale-down" | "contain" }): ReturnType<ImagesBinding["input"]>;
    output(options: { format: "image/webp"; quality?: number }): Promise<{ response(): Response }>;
  };
};

export class ImageProcessingError extends Error {}

function streamOf(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new Blob([bytes as BlobPart]).stream();
}

/**
 * Ponovno kodiranje fotografije u WebP preko Cloudflare Images (zamjena za sharp,
 * koji ne radi na Cloudflare Workers):
 *  - dekodiranje i ponovno kodiranje odbija oštećene ili zlonamjerne datoteke,
 *  - WebP izlaz ne nosi EXIF metapodatke (GPS lokacija s mobitela se ne sprema),
 *  - dulja stranica najviše MAX_IMAGE_EDGE, bez povećavanja manjih fotografija.
 * Obrada se izvršava u Cloudflare Images servisu, ne troši procesorsko vrijeme Workera.
 */
export async function reencodeToWebp(input: Uint8Array): Promise<{ data: Uint8Array; width: number; height: number }> {
  const { env } = await getCloudflareContext({ async: true });
  const images = (env as unknown as { IMAGES?: ImagesBinding }).IMAGES;
  if (!images) throw new Error("IMAGES binding nije podešen (wrangler.jsonc → images).");

  let info;
  try {
    info = await images.info(streamOf(input));
  } catch {
    throw new ImageProcessingError("Datoteku nije moguće pročitati. Je li fotografija oštećena?");
  }
  if (!info.width || !info.height || info.width * info.height > MAX_INPUT_PIXELS) {
    throw new ImageProcessingError("Fotografija je prevelika ili neispravna.");
  }

  let data: Uint8Array;
  try {
    const result = await images
      .input(streamOf(input))
      .transform({ width: MAX_IMAGE_EDGE, height: MAX_IMAGE_EDGE, fit: "scale-down" })
      .output({ format: "image/webp", quality: 84 });
    data = new Uint8Array(await result.response().arrayBuffer());
  } catch {
    throw new ImageProcessingError("Datoteku nije moguće obraditi. Je li fotografija oštećena?");
  }

  // Stvarne dimenzije izlaza (uzima u obzir i okretanje prema EXIF orijentaciji)
  const out = await images.info(streamOf(data));
  if (!out.width || !out.height) throw new ImageProcessingError("Datoteku nije moguće obraditi. Je li fotografija oštećena?");
  return { data, width: out.width, height: out.height };
}

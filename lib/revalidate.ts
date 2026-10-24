import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Nakon svake izmjene vozila, slika ili postavki osvježava cijeli javni dio
 * (početna, popisi, stranice vozila, sitemap, prijedlozi pretrage). Za 30–100 vozila
 * ovo je najjednostavnije i najpouzdanije: rezervirano ili prodano vozilo nikad ne
 * ostaje prikazano kao dostupno u kešu.
 */
export function revalidatePublicSite() {
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/api/marke");
}

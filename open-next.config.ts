import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";

/**
 * Keš za Cloudflare (preporuka OpenNexta za manju stranicu s osvježavanjem):
 *  - R2: spremište gotovih stranica (ISR),
 *  - Durable Object red: vremensko osvježavanje (revalidate = 5 min / 1 h),
 *  - Durable Object tag cache: revalidatePath() nakon izmjene vozila u administraciji,
 *    tako da prodano ili rezervirano vozilo nikad ne ostaje prikazano kao dostupno.
 * Regionalni keš namjerno nije uključen — tada nije potrebno ni ručno brisanje keša.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
  tagCache: doShardedTagCache({ baseShardSize: 4 }),
});

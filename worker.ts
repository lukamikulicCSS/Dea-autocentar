/**
 * Ulaz Workera: koristi OpenNext fetch handler (cijela Next.js aplikacija) i dodaje
 * dnevni cron koji briše istekle podatke iz upita (rokovi u lib/legal.ts).
 * Cron poziva postojeću rutu /api/cron/ciscenje-podataka, pa logika ostaje na jednom mjestu.
 *
 * Datoteka je izuzeta iz tsc/ESLint provjere (tsconfig.json, eslint.config.mjs) jer
 * uvozi .open-next/worker.js koji nastaje tek pri Cloudflare buildu.
 */
// @ts-ignore — nastaje pri buildu (npm run preview / deploy)
import { default as handler } from "./.open-next/worker.js";

type Env = { CRON_SECRET?: string } & Record<string, unknown>;
type Ctx = { waitUntil(promise: Promise<unknown>): void; passThroughOnException(): void };

export default {
  fetch: handler.fetch,

  async scheduled(_event: unknown, env: Env, ctx: Ctx) {
    if (!env.CRON_SECRET) {
      console.error("[čišćenje] CRON_SECRET nije postavljen — brisanje preskočeno");
      return;
    }
    const request = new Request("https://autocentardea.ba/api/cron/ciscenje-podataka", {
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    });
    const response: Response = await handler.fetch(request, env, ctx);
    if (!response.ok) console.error("[čišćenje] Neuspjeh:", response.status, await response.text());
  },
};

// Durable Objects koje koristi keš (open-next.config.ts)
// @ts-ignore — nastaje pri buildu
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";

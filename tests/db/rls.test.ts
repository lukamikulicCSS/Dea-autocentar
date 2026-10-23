/**
 * Sigurnosni testovi baze: pokreću SVE migracije na pravom PostgreSQL-u (PGlite)
 * i provjeravaju RLS kao anonimni posjetitelj, prijavljeni ne-administrator,
 * administrator i server (service_role).
 */
import { PGlite, type Transaction } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "../..");
const ADMIN = "11111111-1111-4111-8111-111111111111";
const ADMIN2 = "22222222-2222-4222-8222-222222222222";
const USER = "33333333-3333-4333-8333-333333333333";
const IP_A = "a".repeat(64);
const IP_B = "b".repeat(64);

let db: PGlite;

type Role = "anon" | "authenticated" | "service_role";

/** Izvrši funkciju kao zadana uloga (i korisnik), uvijek u transakciji koja se poništava. */
async function as<T>(role: Role, sub: string | null, fn: (tx: Transaction) => Promise<T>): Promise<T> {
  let result: T | undefined;
  let error: unknown;
  await db
    .transaction(async (tx) => {
      await tx.query(`select set_config('request.jwt.claims', $1, true)`, [
        JSON.stringify(sub ? { sub, role } : { role }),
      ]);
      await tx.exec(`set local role ${role}`);
      try {
        result = await fn(tx);
      } catch (e) {
        error = e;
      }
      await tx.rollback();
    })
    .catch(() => undefined);
  if (error) throw error;
  return result as T;
}

/** Kao `as`, ali promjene ostaju trajne (za pripremu podataka). */
async function asCommit<T>(role: Role, sub: string | null, fn: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify(sub ? { sub, role } : { role }),
    ]);
    await tx.exec(`set local role ${role}`);
    return fn(tx);
  });
}

async function rows<T = Record<string, unknown>>(tx: Transaction, sql: string, params: unknown[] = []) {
  return (await tx.query<T>(sql, params)).rows;
}

async function insertVehicle(tx: Transaction, overrides: Record<string, unknown> = {}) {
  const v = {
    title: "Škoda Octavia 2.0 TDI",
    brand: "Škoda",
    model: "Octavia",
    year: 2021,
    mileage_km: 85000,
    fuel_type: "dizel",
    transmission: "automatski",
    price_amount: 3590000,
    ...overrides,
  };
  const keys = Object.keys(v);
  const res = await rows<{ id: string; slug: string }>(
    tx,
    `insert into public.vehicles (${keys.join(",")}) values (${keys.map((_, i) => `$${i + 1}`).join(",")}) returning id, slug`,
    Object.values(v),
  );
  return res[0]!;
}

async function addImage(tx: Transaction, vehicleId: string) {
  const imageId = crypto.randomUUID();
  const res = await rows<{ id: string; sort_order: number }>(
    tx,
    `insert into public.vehicle_images (id, vehicle_id, storage_path, width, height, sort_order)
     values ($1, $2, $3, 1600, 1200, 999) returning id, sort_order`,
    [imageId, vehicleId, `vehicles/${vehicleId}/${imageId}.webp`],
  );
  return res[0]!;
}

let publishedId = "";
let draftId = "";
let soldId = "";
let reservedId = "";
let archivedId = "";

beforeAll(async () => {
  db = new PGlite();
  await db.exec(readFileSync(path.join(ROOT, "tests/db/supabase-stub.sql"), "utf8"));
  const dir = path.join(ROOT, "supabase/migrations");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(path.join(dir, file), "utf8"));
  }
  await db.exec(`
    insert into auth.users (id, email) values
      ('${ADMIN}', 'vlasnik@dea.ba'), ('${ADMIN2}', 'prodaja@dea.ba'), ('${USER}', 'netko@example.com');
    insert into public.admins (user_id, email) values ('${ADMIN}', 'vlasnik@dea.ba');
  `);

  await asCommit("authenticated", ADMIN, async (tx) => {
    const pub = await insertVehicle(tx);
    await addImage(tx, pub.id);
    await tx.query(`update public.vehicles set is_published = true where id = $1`, [pub.id]);
    publishedId = pub.id;

    draftId = (await insertVehicle(tx, { title: "Nacrt BMW", brand: "BMW", model: "X5" })).id;

    const sold = await insertVehicle(tx, { title: "Prodani Golf", brand: "VW", model: "Golf" });
    await addImage(tx, sold.id);
    await tx.query(`update public.vehicles set is_published = true, status = 'sold' where id = $1`, [sold.id]);
    soldId = sold.id;

    const res = await insertVehicle(tx, { title: "Rezervirani Passat", brand: "VW", model: "Passat" });
    await addImage(tx, res.id);
    await tx.query(`update public.vehicles set is_published = true, status = 'reserved' where id = $1`, [res.id]);
    reservedId = res.id;

    const arch = await insertVehicle(tx, { title: "Arhivirani Audi", brand: "Audi", model: "A4" });
    await addImage(tx, arch.id);
    await tx.query(`update public.vehicles set is_published = true, status = 'archived' where id = $1`, [arch.id]);
    archivedId = arch.id;

    await tx.query(
      `insert into public.vehicle_internal (vehicle_id, vin, show_vin, internal_note) values ($1, 'WVWZZZ1KZAW000001', false, 'Kupljeno od leasing kuće')`,
      [pub.id],
    );
  });

  await asCommit("service_role", null, async (tx) => {
    await tx.query(`select public.submit_inquiry('kupac@example.com', 'Je li dostupno?', $1, $2)`, [
      publishedId,
      IP_B,
    ]);
  });
});

describe("anonimni posjetitelj", () => {
  it("vidi samo objavljena vozila koja nisu arhivirana", async () => {
    const ids = await as("anon", null, (tx) => rows<{ id: string }>(tx, "select id from public.vehicles"));
    const set = new Set(ids.map((r) => r.id));
    expect(set.has(publishedId)).toBe(true);
    expect(set.has(soldId)).toBe(true); // sold_display = 'archive' → stranica ostaje dostupna
    expect(set.has(reservedId)).toBe(true);
    expect(set.has(draftId)).toBe(false);
    expect(set.has(archivedId)).toBe(false);
  });

  it("ne vidi slike neobjavljenih vozila", async () => {
    await asCommit("authenticated", ADMIN, (tx) => addImage(tx, draftId));
    const imgs = await as("anon", null, (tx) =>
      rows(tx, "select id from public.vehicle_images where vehicle_id = $1", [draftId]),
    );
    expect(imgs).toHaveLength(0);
  });

  it("ne može dodati, mijenjati ni brisati vozila", async () => {
    await expect(as("anon", null, (tx) => insertVehicle(tx))).rejects.toThrow(/permission denied/);
    await expect(
      as("anon", null, (tx) => tx.query("update public.vehicles set price_amount = 1 where id = $1", [publishedId])),
    ).rejects.toThrow(/permission denied/);
    await expect(
      as("anon", null, (tx) => tx.query("delete from public.vehicles where id = $1", [publishedId])),
    ).rejects.toThrow(/permission denied/);
  });

  it("ne može čitati upite, administratore, interne podatke ni privatne postavke", async () => {
    for (const table of ["inquiries", "admins", "vehicle_internal", "private_settings"]) {
      await expect(as("anon", null, (tx) => rows(tx, `select * from public.${table}`))).rejects.toThrow(
        /permission denied/,
      );
    }
  });

  it("ne vidi VIN dok ga administrator ne odobri za javni prikaz", async () => {
    const r = await as("anon", null, (tx) =>
      rows<{ public_vin: string | null }>(tx, "select public_vin from public.vehicles where id = $1", [publishedId]),
    );
    expect(r[0]?.public_vin).toBeNull();
  });

  it("ne može izravno pozvati submit_inquiry (zaobilaženje ograničenja)", async () => {
    await expect(
      as("anon", null, (tx) => tx.query(`select public.submit_inquiry('x@example.com', null, null, $1)`, [IP_A])),
    ).rejects.toThrow(/permission denied/);
  });

  it("ne može učitati ni obrisati datoteke u storageu", async () => {
    const name = `vehicles/${publishedId}/${crypto.randomUUID()}.webp`;
    await expect(
      as("anon", null, (tx) =>
        tx.query(`insert into storage.objects (bucket_id, name) values ('vehicle-images', $1)`, [name]),
      ),
    ).rejects.toThrow(/row-level security/);
    const listed = await as("anon", null, (tx) => rows(tx, "select * from storage.objects"));
    expect(listed).toHaveLength(0);
  });

  it("vidi javne postavke salona", async () => {
    const s = await as("anon", null, (tx) =>
      rows<{ business_name: string; phone: string }>(tx, "select business_name, phone from public.site_settings"),
    );
    expect(s[0]?.business_name).toBe("Auto Centar DEA");
    expect(s[0]?.phone).toBe("+387 61 310 330");
  });

  it("ne može mijenjati postavke salona", async () => {
    await expect(
      as("anon", null, (tx) => tx.query("update public.site_settings set phone = '+38700000000'")),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("prijavljeni korisnik koji NIJE administrator", () => {
  it("ne može se sam proglasiti administratorom", async () => {
    await expect(
      as("authenticated", USER, (tx) =>
        tx.query(`insert into public.admins (user_id, email) values ($1, 'netko@example.com')`, [USER]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("ne može dodavati ni mijenjati vozila", async () => {
    await expect(as("authenticated", USER, (tx) => insertVehicle(tx))).rejects.toThrow(/row-level security/);
    const updated = await as("authenticated", USER, (tx) =>
      rows(tx, "update public.vehicles set price_amount = 1 where id = $1 returning id", [publishedId]),
    );
    expect(updated).toHaveLength(0);
  });

  it("ne vidi upite ni nacrte", async () => {
    const inq = await as("authenticated", USER, (tx) => rows(tx, "select * from public.inquiries"));
    expect(inq).toHaveLength(0);
    const drafts = await as("authenticated", USER, (tx) =>
      rows(tx, "select id from public.vehicles where id = $1", [draftId]),
    );
    expect(drafts).toHaveLength(0);
  });

  it("ne može mijenjati postavke ni čitati privatne postavke", async () => {
    const upd = await as("authenticated", USER, (tx) =>
      rows(tx, "update public.site_settings set phone = '+38700000000' returning id"),
    );
    expect(upd).toHaveLength(0);
    const priv = await as("authenticated", USER, (tx) => rows(tx, "select * from public.private_settings"));
    expect(priv).toHaveLength(0);
  });

  it("ne može učitati sliku u storage", async () => {
    const name = `vehicles/${publishedId}/${crypto.randomUUID()}.webp`;
    await expect(
      as("authenticated", USER, (tx) =>
        tx.query(`insert into storage.objects (bucket_id, name) values ('vehicle-images', $1)`, [name]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("ne može pozvati administratorske funkcije", async () => {
    await expect(
      as("authenticated", USER, (tx) => tx.query("select public.admin_dashboard_stats()")),
    ).rejects.toThrow(/forbidden/);
    await expect(
      as("authenticated", USER, (tx) =>
        tx.query("select public.admin_reorder_vehicle_images($1, '{}'::uuid[])", [publishedId]),
      ),
    ).rejects.toThrow(/forbidden/);
  });
});

describe("administrator", () => {
  it("dobiva stabilan slug bez dijakritika", async () => {
    const slug = await as("authenticated", ADMIN, async (tx) => {
      const v = await insertVehicle(tx, { brand: "Škoda", model: "Superb Laurin & Klement", year: 2022 });
      await tx.query("update public.vehicles set brand = 'Drugo', slug = 'hack' where id = $1", [v.id]);
      const after = await rows<{ slug: string }>(tx, "select slug from public.vehicles where id = $1", [v.id]);
      expect(after[0]?.slug).toBe(v.slug);
      return v.slug;
    });
    expect(slug).toMatch(/^skoda-superb-laurin-klement-2022-[0-9a-f]{6}$/);
  });

  it("ne može objaviti vozilo bez fotografije", async () => {
    await expect(
      as("authenticated", ADMIN, async (tx) => {
        const v = await insertVehicle(tx);
        await tx.query("update public.vehicles set is_published = true where id = $1", [v.id]);
      }),
    ).rejects.toThrow(/barem jedna fotografija/);
  });

  it("postavlja datume statusa i uklanja izdvajanje prodanog vozila", async () => {
    await as("authenticated", ADMIN, async (tx) => {
      await tx.query("update public.vehicles set is_featured = true, status = 'reserved' where id = $1", [
        publishedId,
      ]);
      let r = await rows<{ reserved_at: Date | null; is_featured: boolean }>(
        tx,
        "select reserved_at, is_featured from public.vehicles where id = $1",
        [publishedId],
      );
      expect(r[0]?.reserved_at).not.toBeNull();
      expect(r[0]?.is_featured).toBe(true);

      await tx.query("update public.vehicles set status = 'sold' where id = $1", [publishedId]);
      const s = await rows<{ reserved_at: Date | null; sold_at: Date | null; is_featured: boolean }>(
        tx,
        "select reserved_at, sold_at, is_featured from public.vehicles where id = $1",
        [publishedId],
      );
      expect(s[0]?.sold_at).not.toBeNull();
      expect(s[0]?.reserved_at).toBeNull();
      expect(s[0]?.is_featured).toBe(false);

      await tx.query("update public.vehicles set status = 'available' where id = $1", [publishedId]);
      r = await rows(tx, "select sold_at as reserved_at, is_featured from public.vehicles where id = $1", [
        publishedId,
      ]);
      expect(r[0]?.reserved_at).toBeNull();
    });
  });

  it("javni VIN se pojavljuje samo kad ga administrator odobri", async () => {
    await as("authenticated", ADMIN, async (tx) => {
      await tx.query("update public.vehicles set public_vin = 'HACK' where id = $1", [publishedId]);
      let r = await rows<{ public_vin: string | null }>(tx, "select public_vin from public.vehicles where id = $1", [
        publishedId,
      ]);
      expect(r[0]?.public_vin).toBeNull();
      await tx.query("update public.vehicle_internal set show_vin = true where vehicle_id = $1", [publishedId]);
      r = await rows(tx, "select public_vin from public.vehicles where id = $1", [publishedId]);
      expect(r[0]?.public_vin).toBe("WVWZZZ1KZAW000001");
    });
  });

  it("ne može obrisati zadnju fotografiju objavljenog vozila", async () => {
    await expect(
      as("authenticated", ADMIN, (tx) => tx.query("delete from public.vehicle_images where vehicle_id = $1", [publishedId])),
    ).rejects.toThrow(/barem jednu fotografiju/);
  });

  it("slike dobivaju redne brojeve bez rupa i mogu se preslagati", async () => {
    await as("authenticated", ADMIN, async (tx) => {
      const v = await insertVehicle(tx);
      const a = await addImage(tx, v.id);
      const b = await addImage(tx, v.id);
      const c = await addImage(tx, v.id);
      expect([a.sort_order, b.sort_order, c.sort_order]).toEqual([0, 1, 2]);

      await tx.query("select public.admin_reorder_vehicle_images($1, $2::uuid[])", [v.id, [c.id, a.id, b.id]]);
      const order = await rows<{ id: string }>(
        tx,
        "select id from public.vehicle_images where vehicle_id = $1 order by sort_order",
        [v.id],
      );
      expect(order.map((o) => o.id)).toEqual([c.id, a.id, b.id]);

      await tx.query("delete from public.vehicle_images where id = $1", [c.id]);
      const after = await rows<{ sort_order: number }>(
        tx,
        "select sort_order from public.vehicle_images where vehicle_id = $1 order by sort_order",
        [v.id],
      );
      expect(after.map((o) => o.sort_order)).toEqual([0, 1]);
    });
  });

  it("odbija neispravan redoslijed slika", async () => {
    await expect(
      as("authenticated", ADMIN, (tx) =>
        tx.query("select public.admin_reorder_vehicle_images($1, $2::uuid[])", [publishedId, [crypto.randomUUID()]]),
      ),
    ).rejects.toThrow(/nije ispravan/);
  });

  it("vidi nacrte, upite i statistiku iz stvarnih podataka", async () => {
    await as("authenticated", ADMIN, async (tx) => {
      const d = await rows(tx, "select id from public.vehicles where id = $1", [draftId]);
      expect(d).toHaveLength(1);
      const inq = await rows(tx, "select email from public.inquiries");
      expect(inq.length).toBeGreaterThan(0);
      const stats = await rows<{ s: Record<string, number> }>(tx, "select public.admin_dashboard_stats() as s");
      expect(stats[0]?.s.drafts).toBeGreaterThanOrEqual(1);
      expect(stats[0]?.s.sold).toBe(1);
    });
  });

  it("ne može mijenjati sadržaj upita kupca, samo status i bilješku", async () => {
    await as("authenticated", ADMIN, async (tx) => {
      await tx.query("update public.inquiries set status = 'answered', is_read = true, internal_note = 'Nazvan'");
      await expect(tx.query("update public.inquiries set email = 'drugi@example.com'")).rejects.toThrow(
        /ne može se mijenjati/,
      );
    });
  });

  it("učitava slike samo na ispravnu putanju u bucketu", async () => {
    await as("authenticated", ADMIN, async (tx) => {
      await tx.query(`insert into storage.objects (bucket_id, name) values ('vehicle-images', $1)`, [
        `vehicles/${publishedId}/${crypto.randomUUID()}.webp`,
      ]);
      await expect(
        tx.query(`insert into storage.objects (bucket_id, name) values ('vehicle-images', 'evil.html')`),
      ).rejects.toThrow(/row-level security/);
    });
  });

  it("može dodati drugog administratora, ali ne može ukloniti sebe ni zadnjeg", async () => {
    await as("authenticated", ADMIN, async (tx) => {
      const self = await rows(tx, "delete from public.admins where user_id = $1 returning user_id", [ADMIN]);
      expect(self).toHaveLength(0);
      await tx.query(`insert into public.admins (user_id, email, created_by) values ($1, 'prodaja@dea.ba', $2)`, [
        ADMIN2,
        ADMIN,
      ]);
      const removed = await rows(tx, "delete from public.admins where user_id = $1 returning user_id", [ADMIN2]);
      expect(removed).toHaveLength(1);
    });
    await expect(
      as("service_role", null, (tx) => tx.query("delete from public.admins")),
    ).rejects.toThrow(/zadnjeg administratora/);
  });

  it("računa cijenu u KM za vozila u eurima (fiksni tečaj)", async () => {
    await as("authenticated", ADMIN, async (tx) => {
      const v = await insertVehicle(tx, { currency: "EUR", price_amount: 1000000 });
      const r = await rows<{ price_bam_minor: string }>(
        tx,
        "select price_bam_minor from public.vehicles where id = $1",
        [v.id],
      );
      expect(Number(r[0]?.price_bam_minor)).toBe(1955830);
    });
  });
});

describe("administratorske funkcije", () => {
  const vehicleJson = {
    title: "BMW X5 xDrive30d",
    brand: "BMW",
    model: "X5",
    category: "premium",
    status: "available",
    is_featured: true,
    price_amount: 9990000,
    currency: "BAM",
    price_on_request: false,
    year: 2020,
    mileage_km: 120000,
    fuel_type: "dizel",
    transmission: "automatski",
    equipment: ["Navigacija", "Panorama krov"],
  };

  it("admin_save_vehicle sprema vozilo i interne podatke u jednoj transakciji", async () => {
    await as("authenticated", ADMIN, async (tx) => {
      const r = await rows<{ id: string; slug: string }>(tx, "select * from public.admin_save_vehicle(null, $1, $2, null)", [
        vehicleJson,
        { vin: "WBAKS410X00A00001", show_vin: false, internal_note: "Uvoz iz DE" },
      ]);
      expect(r[0]?.slug).toMatch(/^bmw-x5-2020-/);
      const v = await rows<{ equipment: string[]; is_published: boolean }>(
        tx,
        "select equipment, is_published from public.vehicles where id = $1",
        [r[0]!.id],
      );
      expect(v[0]?.equipment).toEqual(["Navigacija", "Panorama krov"]);
      expect(v[0]?.is_published).toBe(false);
      const i = await rows<{ vin: string }>(tx, "select vin from public.vehicle_internal where vehicle_id = $1", [r[0]!.id]);
      expect(i[0]?.vin).toBe("WBAKS410X00A00001");

      // Neispravan VIN poništava CIJELU transakciju (ni vozilo se ne mijenja)
      await tx.exec("savepoint s1");
      await expect(
        tx.query("select * from public.admin_save_vehicle($1, $2, $3, null)", [
          r[0]!.id,
          { ...vehicleJson, title: "Promijenjeno" },
          { vin: "NEISPRAVAN-VIN!", show_vin: false },
        ]),
      ).rejects.toThrow(/vehicle_internal_vin_check/);
      await tx.exec("rollback to savepoint s1");
      const t = await rows<{ title: string }>(tx, "select title from public.vehicles where id = $1", [r[0]!.id]);
      expect(t[0]?.title).toBe("BMW X5 xDrive30d");
    });
  });

  it("ne-administrator ne može koristiti admin_save_vehicle ni admin_duplicate_vehicle", async () => {
    await expect(
      as("authenticated", USER, (tx) => tx.query("select * from public.admin_save_vehicle(null, $1, '{}'::jsonb, null)", [vehicleJson])),
    ).rejects.toThrow(/forbidden/);
    await expect(
      as("authenticated", USER, (tx) => tx.query("select public.admin_duplicate_vehicle($1)", [publishedId])),
    ).rejects.toThrow(/forbidden/);
    await expect(
      as("anon", null, (tx) => tx.query("select public.admin_duplicate_vehicle($1)", [publishedId])),
    ).rejects.toThrow(/permission denied/);
  });

  it("kopija oglasa je nacrt bez slika i VIN-a", async () => {
    await as("authenticated", ADMIN, async (tx) => {
      const r = await rows<{ id: string }>(tx, "select public.admin_duplicate_vehicle($1) as id", [publishedId]);
      const v = await rows<{ title: string; is_published: boolean; public_vin: string | null }>(
        tx,
        "select title, is_published, public_vin from public.vehicles where id = $1",
        [r[0]!.id],
      );
      expect(v[0]?.title).toMatch(/\(kopija\)$/);
      expect(v[0]?.is_published).toBe(false);
      const imgs = await rows(tx, "select id from public.vehicle_images where vehicle_id = $1", [r[0]!.id]);
      expect(imgs).toHaveLength(0);
    });
  });
});

describe("pravila prikaza rezerviranih i prodanih vozila", () => {
  it("skrivena rezervirana vozila nisu javna", async () => {
    await as("service_role", null, async (tx) => {
      await tx.query("update public.site_settings set reserved_display = 'hidden', sold_display = 'hidden'");
      await tx.exec("set local role anon");
      await tx.query(`select set_config('request.jwt.claims', '{"role":"anon"}', true)`);
      const ids = (await rows<{ id: string }>(tx, "select id from public.vehicles")).map((r) => r.id);
      expect(ids).not.toContain(reservedId);
      expect(ids).not.toContain(soldId);
      expect(ids).toContain(publishedId);
    });
  });
});

describe("zaprimanje upita (server)", () => {
  it("ograničava broj upita s iste adrese", async () => {
    await as("service_role", null, async (tx) => {
      for (let i = 0; i < 3; i++) {
        await tx.query(`select public.submit_inquiry($1, 'Pozdrav', null, $2)`, [`k${i}@example.com`, IP_A]);
      }
      await expect(
        tx.query(`select public.submit_inquiry('k9@example.com', 'Pozdrav', null, $1)`, [IP_A]),
      ).rejects.toThrow(/rate_limited/);
    });
  });

  it("ne stvara duplikat za isti email i vozilo", async () => {
    await as("service_role", null, async (tx) => {
      const a = await rows<{ id: string }>(tx, `select public.submit_inquiry('Dup@Example.com', 'a', $1, $2) as id`, [
        publishedId,
        "c".repeat(64),
      ]);
      const b = await rows<{ id: string }>(tx, `select public.submit_inquiry('dup@example.com', 'b', $1, $2) as id`, [
        publishedId,
        "c".repeat(64),
      ]);
      expect(a[0]?.id).toBe(b[0]?.id);
    });
  });

  it("odbija upit za neobjavljeno ili prodano vozilo", async () => {
    await as("service_role", null, async (tx) => {
      await expect(
        tx.query(`select public.submit_inquiry('x@example.com', null, $1, $2)`, [draftId, "d".repeat(64)]),
      ).rejects.toThrow(/vehicle_unavailable/);
    });
    await as("service_role", null, async (tx) => {
      await expect(
        tx.query(`select public.submit_inquiry('x@example.com', null, $1, $2)`, [soldId, "d".repeat(64)]),
      ).rejects.toThrow(/vehicle_unavailable/);
    });
  });

  it("odbija neispravan email na razini baze", async () => {
    await as("service_role", null, async (tx) => {
      await expect(
        tx.query(`select public.submit_inquiry('nije-email', null, null, $1)`, ["e".repeat(64)]),
      ).rejects.toThrow(/inquiries_email_check/);
    });
  });
});

#!/usr/bin/env node
/**
 * Stvara PRVOG administratora (ili postojeći račun proglašava administratorom).
 *
 * Upotreba:
 *   node --env-file=.env.local scripts/create-admin.mjs vlasnik@dea.ba
 *
 * Lozinka se generira nasumično i ispisuje JEDNOM — prenesite je vlasniku
 * sigurnim putem i neka je odmah promijeni u Administracija → Postavke.
 * Ostale administratore dodajete kroz sučelje (Postavke → Administratori).
 */
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const email = (process.argv[2] ?? "").trim().toLowerCase();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Upotreba: node --env-file=.env.local scripts/create-admin.mjs ime@domena.ba");
  process.exit(1);
}
if (!url || !key) {
  console.error("Nedostaju NEXT_PUBLIC_SUPABASE_URL i/ili SUPABASE_SECRET_KEY u okruženju.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUser(address) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === address);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

let user = await findUser(email);
let password = null;
if (!user) {
  password = randomBytes(12).toString("base64url");
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) {
    console.error("Račun nije stvoren:", error.message);
    process.exit(1);
  }
  user = data.user;
  console.log(`Stvoren je račun ${email}.`);
} else {
  console.log(`Račun ${email} već postoji — dodajem administratorska prava.`);
}

const { error: insErr } = await supabase.from("admins").upsert({ user_id: user.id, email }, { onConflict: "user_id" });
if (insErr) {
  console.error("Upis u tablicu admins nije uspio:", insErr.message);
  process.exit(1);
}

console.log(`✔ ${email} je administrator.`);
if (password) {
  console.log(`Privremena lozinka (prikazuje se samo sada): ${password}`);
  console.log("Neka je vlasnik odmah promijeni u Administracija → Postavke → Promjena lozinke.");
}

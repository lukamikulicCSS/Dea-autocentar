# Auto Centar DEA — web stranica i administracija

Web stranica salona **Auto Centar DEA** (Zenica) s ponudom vozila, upitima kupaca i administracijom za vlasnika.

- **Javni dio:** početna, ponuda s filterima, premium vozila, vozila u dolasku, rezervirano, prodana vozila, stranica svakog vozila, O nama, Kontakt, Privatnost.
- **Administracija** (`/admin`): pregled sa statistikom, vozila (dodavanje, uređivanje, kopiranje, brisanje, brza promjena statusa), upload fotografija s mobitela i računala, upiti kupaca, postavke salona i administratori.

**Tehnologije:** Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS 4, Supabase (PostgreSQL, Auth, Storage, RLS), Zod, Lucide ikone, sharp (obrada slika). Za testove se koristi Vitest s PGlite (pravi PostgreSQL u procesu).

---

## Sadržaj

1. [Brzi start (lokalno)](#1-brzi-start-lokalno)
2. [Postavljanje Supabasea](#2-postavljanje-supabasea-korak-po-korak)
3. [Prvi administrator](#3-prvi-administrator)
4. [Objava na Vercelu](#4-objava-na-vercelu)
5. [Domena (Cloudflare) i indeksiranje](#5-domena-cloudflare-i-indeksiranje)
6. [Kasnije: Resend i Turnstile](#6-kasnije-resend-email-i-turnstile)
7. [Varijable okruženja](#7-varijable-okruženja)
8. [Struktura projekta](#8-struktura-projekta)
9. [Baza podataka i sigurnost](#9-baza-podataka-i-sigurnost)
10. [SEO](#10-seo)
11. [Testovi](#11-testovi)
12. [Izvještaj o implementaciji](#12-izvještaj-o-implementaciji)

---

## 1. Brzi start (lokalno)

Potrebno: **Node.js 20.9+** (preporuka 22 LTS) i Supabase projekt (korak 2).

```bash
npm install
cp .env.example .env.local      # upišite Supabase ključeve (korak 2.4)
npm run dev                     # http://localhost:3000
```

Korisne naredbe:

```bash
npm run check       # typecheck + lint + svi testovi
npm run build       # produkcijski build
npm run admin:create -- vlasnik@dea.ba   # prvi administrator (korak 3)
```

---

## 2. Postavljanje Supabasea (korak po korak)

### 2.1 Novi projekt

1. Otvorite <https://supabase.com/dashboard> i kliknite **New project**.
2. Naziv: `autocentar-dea`. Regija: **Central EU (Frankfurt)**, najbliža BiH.
3. Spremite lozinku baze u upravitelj lozinki (u aplikaciji se ne koristi).

### 2.2 Pokretanje migracija

Migracije su u `supabase/migrations/` i **moraju se pokrenuti ovim redoslijedom**:

| # | Datoteka | Sadržaj |
|---|---|---|
| 1 | `20261023100000_schema.sql` | tablice, ograničenja, indeksi, okidači |
| 2 | `20261023100100_security.sql` | RLS politike, funkcija za upite s ograničenjem učestalosti |
| 3 | `20261023100200_storage_and_settings.sql` | bucket za fotografije, storage politike, početne postavke salona |
| 4 | `20261023100300_admin_functions.sql` | atomsko spremanje i kopiranje vozila |

**Opcija A — SQL Editor (najjednostavnije):** u Dashboardu otvorite **SQL Editor → New query**, zalijepite cijeli sadržaj datoteke 1 i kliknite **Run**. Ponovite za datoteke 2, 3 i 4.

**Opcija B — Supabase CLI:**

```bash
npx supabase login
npx supabase link --project-ref VAS_PROJECT_REF
npx supabase db push
```

### 2.3 Postavke prijave (Authentication)

U Dashboardu → **Authentication**:

1. **Sign In / Providers → Email:** ostavite uključeno. **Isključite „Allow new users to sign up“.** Račune stvaraju samo administratori, pa se nitko ne može sam registrirati. Čak i da se netko registrira, nema pristup jer nije u tablici `admins`, što je testirano.
2. **Sign In / Providers → Email → Minimum password length:** postavite na **12**.
3. **URL Configuration → Site URL:** produkcijska adresa (npr. `https://autocentar-dea.vercel.app`, kasnije prava domena).
4. **URL Configuration → Redirect URLs:** dodajte `http://localhost:3000/**` i produkcijsku adresu s `/**`.
5. **Emails → Templates → Reset Password:** zamijenite poveznicu u predlošku ovom (potrebno za „Zaboravljena lozinka“):

   ```html
   <h2>Nova lozinka</h2>
   <p>Kliknite za postavljanje nove lozinke za administraciju Auto Centra DEA:</p>
   <p><a href="{{ .SiteURL }}/auth/potvrda?token_hash={{ .TokenHash }}&type=recovery&next=/admin/nova-lozinka">Postavi novu lozinku</a></p>
   ```

> Ugrađeni Supabase email ima nisko ograničenje slanja (nekoliko poruka na sat). Kad postavite Resend (korak 6), u **Authentication → Emails → SMTP Settings** možete upisati Resend SMTP da i ove poruke idu preko vaše domene.

### 2.4 Ključevi za `.env.local`

Dashboard → **Project Settings → API Keys**:

- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = **Publishable key** (`sb_publishable_…`)
- `SUPABASE_SECRET_KEY` = **Secret key** (`sb_secret_…`), **samo na serveru, nikad u kodu ni u gitu**

Stariji projekti imaju `anon` i `service_role` ključeve. Oni rade kao `NEXT_PUBLIC_SUPABASE_ANON_KEY` i `SUPABASE_SERVICE_ROLE_KEY`.

### 2.5 Provjera

U **Table Editoru** trebaju postojati tablice `vehicles`, `vehicle_images`, `vehicle_internal`, `inquiries`, `admins`, `site_settings` i `private_settings`, sve s oznakom **RLS enabled**. U **Storageu** treba postojati bucket `vehicle-images` (Public).

---

## 3. Prvi administrator

Prvi administrator se stvara skriptom, jer se registracija ne može obaviti preko stranice:

```bash
npm run admin:create -- vlasnik@dea.ba
```

Skripta stvori račun, doda ga u tablicu `admins` i **jednom** ispiše privremenu lozinku. Pošaljite je vlasniku sigurnim putem i neka je odmah promijeni u **Administracija → Postavke → Promjena vaše lozinke**.

Ostale administratore (npr. zaposlenike) vlasnik dodaje sam u **Postavke → Administratori**. Svi administratori imaju ista prava. Nitko ne može ukloniti sam sebe ni zadnjeg administratora.

---

## 4. Objava na Vercelu

1. Pushajte repozitorij na GitHub (ručno, kao i inače).
2. Na <https://vercel.com/new> uvezite repozitorij. Framework se prepoznaje automatski (Next.js). Build naredba: `npm run build`.
3. U **Settings → Environment Variables** upišite varijable iz poglavlja 7 (najmanje tri Supabase varijable) za **Production** i **Preview**.
4. **Deploy.**
5. Nakon prvog deploya upišite Vercel adresu u Supabase **Site URL** i **Redirect URLs** (korak 2.3).

Napomene:

- Fotografije se smanjuju u pregledniku (do 2560 px) i zatim ih server ponovno obrađuje (WebP, do 2400 px). Zbog toga uploadi ostaju ispod Vercelovog ograničenja zahtjeva od 4,5 MB.
- Optimizacija slika (`next/image`) troši Vercelovu kvotu za slike. Za 30–100 vozila to je unutar besplatnog plana. Ako se vlasnici kasnije odluče za drugi hosting, ništa se ne mijenja osim tog servisa.

---

## 5. Domena (Cloudflare) i indeksiranje

1. U Vercelu: **Settings → Domains → Add** i upišite domenu (npr. `dea.ba` i `www.dea.ba`).
2. U Cloudflareu upišite DNS zapise koje Vercel prikaže (obično `A 76.76.21.21` za apex i `CNAME cname.vercel-dns.com` za `www`). Proxy status postavite na **DNS only** (siva oblačić-ikona), jer TLS izdaje Vercel.
3. Na Vercelu postavite:
   - `NEXT_PUBLIC_SITE_URL=https://dea.ba`
   - `ALLOW_INDEXING=true` (**samo za Production**, nikad za Preview)
4. Redeploy. Zatim u Supabaseu ažurirajte **Site URL** i **Redirect URLs**.
5. U Google Search Console dodajte domenu i pošaljite `https://dea.ba/sitemap.xml`.

Dok `ALLOW_INDEXING` nije `true`, `robots.txt` zabranjuje indeksiranje i sve stranice imaju `noindex`. Tako privremene adrese ne završe u Googleu.

---

## 6. Kasnije: Resend (email) i Turnstile

Obje integracije su **ugrađene, ali isključene** dok ne postavite ključeve. U **Admin → Postavke → Stanje integracija** vidi se što je uključeno.

### Resend (obavijest o novom upitu)

1. Na <https://resend.com> dodajte domenu (npr. `dea.ba`) i u Cloudflare upišite DNS zapise koje Resend traži (SPF/DKIM).
2. Kad je domena potvrđena, napravite API ključ.
3. Na Vercelu postavite `RESEND_API_KEY=re_…` i `RESEND_FROM="Auto Centar DEA <upiti@dea.ba>"`. Zatim redeploy.
4. Primatelji obavijesti upisuju se u **Admin → Postavke → Obavijesti o upitima** (početno `info@dea.ba`).

Dok Resend nije postavljen, upiti se **spremaju u bazu** i vidljivi su u adminu, ali se email ne šalje. Aplikacija nigdje ne tvrdi da je email poslan.

### Cloudflare Turnstile (zaštita od botova)

1. Cloudflare Dashboard → **Turnstile → Add site** i dodajte domenu, način rada „Managed“.
2. Postavite `NEXT_PUBLIC_TURNSTILE_SITE_KEY` i `TURNSTILE_SECRET_KEY` (**oba**). Zatim redeploy.

Token se uvijek provjerava na serveru (`lib/turnstile.ts`). Do tada upite štite ograničenje učestalosti u bazi (3 upita u 10 minuta i 15 dnevno po adresi) i skriveno polje za botove.

---

## 7. Varijable okruženja

| Varijabla | Obavezno | Gdje se vidi | Opis |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | da | javno | URL Supabase projekta |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | da | javno | publishable/anon ključ (zaštita je RLS) |
| `SUPABASE_SECRET_KEY` | da | **samo server** | upis upita, dodavanje administratora |
| `NEXT_PUBLIC_SITE_URL` | preporučeno | javno | kanonska adresa (canonical, sitemap, OG) |
| `ALLOW_INDEXING` | ne | server | `true` samo na produkcijskoj domeni |
| `RESEND_API_KEY`, `RESEND_FROM` | ne | server | email obavijesti o upitima |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | ne | javno / server | zaštita forme od botova |

Primjer s objašnjenjima je u `.env.example`.

---

## 8. Struktura projekta

```
app/
  (site)/                 javni dio (zajedničko zaglavlje, podnožje, donja navigacija)
    page.tsx              početna
    vozila/               ponuda + vozila/[slug] (stranica vozila)
    premium/ u-dolasku/ rezervirano/ prodana-vozila/ o-nama/ kontakt/ privatnost/
  admin/
    prijava/ zaboravljena-lozinka/
    (panel)/              zaštićeni dio: pregled, vozila, upiti, postavke, nova-lozinka
    actions/              Server Actions (svaka provjerava administratora na serveru)
  api/admin/vozila/[id]/slike/route.ts   upload fotografija (provjera, obrada, spremanje)
  auth/potvrda/           potvrda poveznice iz emaila (nova lozinka)
  actions/inquiry.ts      zaprimanje upita kupaca
  sitemap.ts robots.ts manifest.ts
components/site/          javne komponente (kartice, galerija, filteri, forma upita…)
components/admin/         administracija (uređivač vozila, upravljanje slikama…)
lib/                      podaci, validacija (Zod), formatiranje, SEO, Supabase klijenti
supabase/migrations/      SQL migracije
tests/                    unit testovi + sigurnosni testovi baze (RLS)
proxy.ts                  osvježavanje sesije i preusmjeravanje za /admin
```

**Navigacija bez hamburger izbornika:** na računalu je vodoravni izbornik. Na mobitelu i tabletu je fiksna donja traka s pet odredišta (Početna, Vozila, Premium, Dolazak, Kontakt), a „O nama“ i „Nazovite“ su u zaglavlju. Traka poštuje iOS safe-area, a sadržaj ima jednak donji razmak pa ništa ne ostaje prekriveno.

---

## 9. Baza podataka i sigurnost

### Tablice

| Tablica | Namjena | Tko čita | Tko piše |
|---|---|---|---|
| `vehicles` | vozila; cijena je cijeli broj u feninzima/centima | javno samo objavljena i vidljiva; admin sve | admin |
| `vehicle_images` | fotografije (putanja, dimenzije, redoslijed; prva je naslovna) | uz vidljivo vozilo | admin |
| `vehicle_internal` | VIN, interna bilješka | admin | admin |
| `inquiries` | upiti kupaca | admin | **samo server** preko `submit_inquiry` |
| `admins` | tko je administrator | admin | admin (ne sam sebe ukloniti, ne zadnjeg) |
| `site_settings` | javni podaci salona i tekstovi | javno | admin |
| `private_settings` | email adrese za obavijesti | admin | admin |

### Važne odluke

- **Ovlast administratora** određuje samo redak u tablici `admins`, a ne podaci koje korisnik može sam mijenjati (user metadata). Provjerava se na serveru (`getClaims()` + `is_admin()`) na svakoj stranici, akciji i API ruti, te ponovno u bazi kroz RLS.
- **Upiti kupaca** ne idu izravnim upisom u tablicu. Server provjeri email (Zod), honeypot i Turnstile (ako je uključen), pa pozove funkciju `submit_inquiry`, koju smije pozvati samo `service_role`. Ta funkcija atomski provodi ograničenje učestalosti po sažetku (HMAC) IP adrese. Izvorna IP adresa se ne sprema.
- **Interni podaci** (VIN, bilješke) su u zasebnoj tablici koju vidi samo admin. VIN se prikazuje kupcima samo ako ga admin izričito uključi, a tada ga okidač kopira u `vehicles.public_vin`.
- **Poslovna pravila u bazi (okidači):** slug se stvara automatski i nikad se ne mijenja. Vozilo se ne može objaviti bez fotografije. Prodano ili arhivirano vozilo ne može biti izdvojeno. Datumi rezervacije i prodaje postavljaju se automatski. Sadržaj upita kupca ne može se mijenjati.
- **Cijene:** `bigint` u najmanjoj jedinici, nikad float. Valuta je po vozilu (KM ili EUR). `price_bam_minor` preračunava EUR po fiksnom tečaju valutnog odbora (1,95583) pa filtriranje i sortiranje po cijeni rade ispravno.
- **Fotografije:** server provjerava potpis datoteke (JPG/PNG/WebP), a ne ime ni MIME tip. SVG, HTML i izvršne datoteke se odbijaju. Svaka fotografija se ponovno kodira u WebP, što uklanja EXIF i GPS podatke te odbija oštećene datoteke. Spremaju se pod nasumičnom UUID putanjom. Bucket je javan **samo za čitanje**, a upload, zamjenu i brisanje smije samo admin, s provjerom ispravne putanje.
- **Rezervirano i prodano:** prikaz se bira u Postavkama i odmah vrijedi i za RLS. Kad je odabrano „skriveno“, vozilo nije dostupno ni preko API-ja. Prodana vozila se nikad ne brišu automatski.
- **Keširanje:** javne stranice su statične s osvježavanjem svakih 5 minuta (ISR). Svaka izmjena u adminu odmah osvježava cijeli javni dio, pa rezervirano ili prodano vozilo nikad ne ostaje prikazano kao dostupno. Admin stranice se nikad ne keširaju (`Cache-Control: no-store`).
- **Sigurnosna zaglavlja:** CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy i Permissions-Policy (`next.config.ts`).

### Kompromisi (svjesne odluke)

- **CSP koristi `'unsafe-inline'` za skripte.** Nonce bi sve javne stranice učinio dinamičnima i izgubilo bi se keširanje (sporije učitavanje na mobitelu). Rizik je mali: nema HTML-a od korisnika, sav sadržaj se escapea, a JSON-LD je dodatno zaštićen.
- **Javni bucket za fotografije** daje brže učitavanje i jednostavnije keširanje. Fotografije neobjavljenih vozila dostupne su samo onome tko zna nasumični UUID URL.
- **Brisanje datoteke nakon brisanja zapisa:** ako brisanje datoteke iz storagea ne uspije, ostaje „siroče“ datoteka koja se nigdje ne prikazuje. Greška se bilježi u logu.

### Sigurnosne kopije

Besplatni Supabase plan **nema automatske sigurnosne kopije**. Pro plan ima dnevne kopije. Do prelaska na Pro preporuka je tjedni izvoz:

```bash
npx supabase db dump --linked -f backup-$(date +%F).sql
```

Fotografije u Storageu nisu dio dumpa. Za njih koristite Storage S3 pristup ili ih povremeno preuzmite.

---

## 10. SEO

- Jedinstveni `title` i `description` po stranici. Vozila imaju naslov i opis sastavljene iz podataka, ili vlastite ako ih admin upiše.
- `canonical` na svakoj stranici. Kombinacije filtera dobivaju `noindex, follow` i canonical na osnovni popis, kako ne bi nastajale tisuće tankih stranica.
- **JSON-LD:** `AutoDealer` (naziv, adresa, telefon, email, radno vrijeme, društvene mreže, samo iz Postavki), `WebSite` sa SearchAction, `BreadcrumbList` i `Car` s podacima vozila. `Offer` s cijenom navodi se **samo** za dostupna i vozila u dolasku s upisanom cijenom. Za rezervirana, prodana i vozila s cijenom na upit ne navodi se, kako ne bi bilo netočnih podataka.
- **Politika indeksiranja:** dostupno, u dolasku i rezervirano se indeksira i ulazi u sitemap. Prodano ostaje dostupno na istom URL-u (vrijednost poveznica), ali ima `noindex` i nije u sitemapu. Arhivirano i neobjavljeno vraća **404**.
- `sitemap.xml` sadrži samo indeksirane stranice i osvježava se pri svakoj izmjeni. `robots.txt` blokira `/admin`, `/api` i `/auth`.
- Sav važan sadržaj renderira se na serveru (HTML bez ovisnosti o JavaScriptu). Forma za upit i pretraga rade i bez JS-a.
- `llms.txt` namjerno nije dodan, jer nema dokazane koristi za rangiranje.

---

## 11. Testovi

```bash
npm test
```

- `tests/db/rls.test.ts` (**35 testova**): pokreće **sve migracije na pravom PostgreSQL-u** (PGlite) uz minimalnu imitaciju Supabase `auth` i `storage` shema. Zatim provjerava ponašanje kao anonimni posjetitelj, prijavljeni ne-admin, admin i server. Pokriva vidljivost, zabranu upisa, samoproglašavanje adminom, storage upload, ograničenje upita, poslovna pravila, atomsko spremanje i kopiranje.
- `tests/unit/logic.test.ts` (**18 testova**): formatiranje cijena i kilometraže, unos cijene u hrvatskom zapisu, filtere iz URL-a (uključujući pokušaje ubacivanja PostgREST sintakse), Zod validaciju vozila i upita, prepoznavanje datoteka po sadržaju (odbijanje SVG/HTML/PDF/EXE), sigurnost JSON-LD-a i zaštitu od open redirecta.

PGlite imitira Supabase, ali nije identičan (npr. Supabase Auth i Storage API se ne pokreću). Zato nakon postavljanja pravog projekta napravite i ručnu provjeru iz poglavlja 12.6.

---

## 12. Izvještaj o implementaciji

### 12.1 Što je napravljeno

Cijeli javni dio i administracija iz zahtjeva: ponuda s pretragom i filterima (server-side, dijeljivi URL-ovi, paginacija), premium (urednički prikaz), u dolasku (okvirni datumi, nikad zajamčeni), rezervirano i prodano (prikaz po postavkama), stranica vozila (galerija s klizanjem prstom, tipkovnicom i prikazom preko cijelog zaslona, ključni podaci, oprema, tehnički podaci samo za poznate vrijednosti, dijeljenje, upit samo s emailom, mobilna traka „Nazovite / Pošalji upit“, slična vozila). Administracija: statistika iz stvarnih podataka, popis s brzom promjenom statusa, objave i izdvajanja, uređivač u sedam sekcija s porukama o greškama i upozorenjem na nespremljene promjene, pregled prije objave, kopiranje, brisanje s potvrdom „OBRIŠI“, upload s mobitela (galerija i kamera) i računala (odabir i povlačenje), napredak, ponovni pokušaj, redoslijed i naslovna fotografija, inbox upita (status, pročitano, bilješka, odgovor emailom, brisanje), postavke salona, administratori, promjena i oporavak lozinke.

### 12.2 Glavne rute

Javno: `/`, `/vozila`, `/vozila/[slug]`, `/premium`, `/u-dolasku`, `/rezervirano`, `/prodana-vozila`, `/o-nama`, `/kontakt`, `/privatnost`, `/sitemap.xml`, `/robots.txt`.
Admin: `/admin/prijava`, `/admin/zaboravljena-lozinka`, `/admin`, `/admin/vozila`, `/admin/vozila/novo`, `/admin/vozila/[id]`, `/admin/vozila/[id]/pregled`, `/admin/upiti`, `/admin/upiti/[id]`, `/admin/postavke`, `/admin/nova-lozinka`.
API: `POST /api/admin/vozila/[id]/slike`, `GET /auth/potvrda`.

### 12.3 Tablice i politike

Vidi poglavlje 9. RLS je uključen na svim tablicama. Ne postoji nijedna politika `USING (true)` za osjetljive podatke. Jedina javno čitljiva tablica bez uvjeta je `site_settings`, koja namjerno sadrži samo javne podatke salona.

### 12.4 Varijable okruženja

Vidi poglavlje 7 i `.env.example`.

### 12.5 Postavljanje Supabasea

Vidi poglavlja 2 i 3.

### 12.6 Stvarno izvršeni testovi (23. 10. 2026.)

| Provjera | Rezultat |
|---|---|
| `tsc --noEmit` (strict) | prolazi, 0 grešaka |
| `eslint .` (next core-web-vitals + typescript) | prolazi, 0 grešaka |
| Vitest: 53 testa (35 RLS/baza na PostgreSQL-u, 18 unit) | **53/53 prolazi** |
| `next build` (produkcijski) | prolazi; javne stranice statične s ISR-om |
| Preglednik (Chromium, 390 px i 1440 px) | početna, ponuda, premium, stranica vozila, filteri na mobitelu, o nama, prijava: bez vodoravnog klizanja, donja navigacija ne prekriva sadržaj |
| HTTP: `/admin` bez prijave | 307 na prijavu |
| HTTP: lažni kolačić sesije | 307 na prijavu |
| HTTP: upload bez prijave | 401 |
| HTTP: `?next=https://evil.com` | svedeno na `/admin` |
| HTTP: nepostojeće i neispravno vozilo | 404 |
| HTTP: prodano vozilo | 200, `noindex`, bez `Offer` |
| HTTP: filtrirani popis | `noindex, follow`, canonical na `/vozila` |
| HTTP: sigurnosna zaglavlja i `X-Robots-Tag` na adminu | prisutna |
| Forma upita u pregledniku | neispravan email prikazuje poruku i čuva unos; bez serverskog ključa jasna poruka bez rušenja |

**Napomena:** vizualni i HTTP testovi rađeni su s lažnim (mock) Supabase poslužiteljem jer pravi projekt još ne postoji. **Nije testirano s pravim Supabaseom:** prijava, upload u Storage, spremanje vozila i upita te slanje emaila. Nakon koraka 2–4 prođite ovu ručnu provjeru:

1. Prijava kao admin, zatim dodavanje vozila, upload 3 fotografije s mobitela (galerija i kamera), promjena naslovne, objava i provjera da je vozilo na stranici.
2. Promjena statusa u „Rezervirano“ i „Prodano“ iz popisa, zatim provjera javnog prikaza.
3. Upit s javne stranice, zatim provjera da se pojavio u adminu. Četvrti upit za redom treba biti odbijen zbog ograničenja.
4. U privatnom prozoru (neprijavljeni) otvaranje `/admin/vozila`, što mora preusmjeriti na prijavu.
5. Lighthouse (Chrome DevTools, Mobile) na početnoj i stranici vozila, s ciljem LCP ≤ 2,5 s i CLS ≤ 0,1.

### 12.7 Integracije koje nisu konfigurirane

- **Resend** (email obavijesti): kod je spreman, ključ nije postavljen.
- **Cloudflare Turnstile:** kod je spreman, ključevi nisu postavljeni.
- **Viber i WhatsApp:** polja postoje u Postavkama; gumbi se pojavljuju kad se upišu brojevi.
- **Domena:** nije postavljena; koristi se Vercel adresa, a indeksiranje je isključeno.

### 12.8 Preostalo prije produkcije

1. **Adresa:** u bazi je `Sarajevska 135`, a OLX profil salona navodi `Sarajevska 136`. Potvrdite s vlasnikom i ispravite u Postavkama.
2. **Google Maps poveznica i koordinate** (Postavke → Lokacija), važni za lokalni SEO.
3. **Logo u SVG formatu:** trenutni logo je izvučen iz JPG slike (PNG s prozirnom pozadinom). Izgleda dobro, ali SVG bi bio oštriji.
4. **Pravni podaci u `lib/legal.ts`**: puni naziv pravnog lica, ID broj, registar i email za privatnost (iz rješenja o registraciji). Bez njih Politika privatnosti nema potpune podatke o kontroloru (čl. 15. st. 1. t. a) ZZLP BiH).
5. **`CRON_SECRET`** postavljen na Vercelu (automatsko brisanje starih upita). Bez njega se rokovi objavljeni na /privatnost ne poštuju.
6. **Pravni tekstovi** (/privatnost, /uvjeti-koristenja) neka pregleda vlasnik ili pravni savjetnik prije objave (vidi „Privatnost i kolačići“ niže).
7. **Tekst „O nama“** i prednosti salona napisani su prema salonovom OLX profilu. Neka ih vlasnik potvrdi (mogu se mijenjati u Postavkama).
8. Ručna provjera iz 12.6 s pravim Supabaseom.

Bez točaka 1, 4, 5 i 8 stranica **nije spremna za produkciju**.


## Privatnost i kolačići (ZZLP BiH, „Sl. glasnik BiH“ 12/25)

Stranica je izrađena po načelu „privatnost od samog početka“ (čl. 27. Zakona). Sažetak za vlasnika i održavatelja:

| Što | Kako je riješeno | Gdje u kodu |
| --- | --- | --- |
| Kolačići | Javno se koriste samo nužni kolačići (`dea_privola`, 180 dana). Nema analitike ni oglasa. | `lib/consent.ts` |
| Google Karte | **Odluka investitora:** karta se učitava odmah (legitimni interes, čl. 8. st. 1. t. f), uz ograničenja: tek kad dođe u vidno polje, ne prije hidracije, i uz isključivanje u svakom trenutku („Isključi kartu“ / „Postavke kolačića“, čl. 23). Strožija varijanta (učitavanje tek uz privolu) može se vratiti ako investitor odluči drukčije. | `components/site/LocationMap.tsx` |
| Obavijest o kolačićima | Obavještava o Google karti; „Isključi kartu“ i „U redu“ jednako vidljivi; „Postavke kolačića“ u podnožju na svakoj stranici. | `components/site/consent/` |
| Informacije pri prikupljanju (čl. 15) | Kratka obavijest uz obrazac + Politika privatnosti; dijelovi o Resendu i Turnstileu prikazuju se samo kad su uključeni. | `InquiryForm.tsx`, `app/(site)/privatnost` |
| Rokovi čuvanja | IP sažetak 30 dana, upit 24 mjeseca — briše dnevni Vercel Cron. | migracija `20261102100000_privacy_retention.sql`, `app/api/cron/ciscenje-podataka` |
| Uvjeti korištenja | Oglas nije ponuda, greške u cijeni, okvirni datumi, autorska prava, ograničenje odgovornosti. | `app/(site)/uvjeti-koristenja` |

**Pravila za buduće izmjene** (da stranica ostane usklađena):

1. **Ne dodavati analitiku, piksele, chat widgete, YouTube/Instagram ugradnje ni Google Fonts** bez nove kategorije privole. Ako se doda: nova kategorija u `ConsentBanner`, učitavanje tek nakon privole, `CONSENT_VERSION` + 1, ažurirati tablicu kolačića na /privatnost i `POLICY` u `lib/legal.ts`.
2. **Novo polje u obrascu** (ime, telefon…) = nova obrada: ažurirati /privatnost i razmisliti treba li polje uopće (smanjenje obima podataka).
3. **Novi pružatelj usluge** (npr. drugi email servis) = novi obrađivač: upisati ga na /privatnost, potpisati ugovor o obradi (DPA) i za pružatelje iz SAD-a provjeriti da su na popisu dataprivacyframework.gov.
4. Promjena rokova: istovremeno u migraciji i u `RETENTION` (`lib/legal.ts`).


### Procjena legitimnog interesa — Google karta (za spis investitora)

Karta se učitava bez prethodne privole, na osnovu legitimnog interesa (čl. 8. st. 1. t. f) ZZLP BiH). Ova procjena dokumentira zašto je to razmjerno; čuva je investitor kao kontrolor.

| Korak | Ocjena |
| --- | --- |
| **1. Interes** | Pokazati posjetiteljima gdje je salon i olakšati dolazak — stvaran, zakonit i konkretan poslovni interes. |
| **2. Nužnost** | Interaktivna karta je najupotrebljiviji način prikaza lokacije; blaža alternativa (poveznica „Otvori u Google Kartama“) je uvijek ponuđena uz kartu. |
| **3. Ravnoteža** | Podaci: IP adresa i tehnički podaci preglednika koje prima Google (ne posebne kategorije). Očekivanje: posjetitelj stranice salona razumno očekuje kartu s lokacijom. Mjere: učitavanje tek u vidnom polju (`loading="lazy"`), ne prije čitanja izbora posjetitelja, salon ne prima nikakve podatke s karte, nema analitike ni oglasa, isključivanje jednim klikom (obavijest, podnožje, mjesto karte), jasna informacija u politici privatnosti i uvjetima korištenja. |
| **Zaključak** | Interes salona ne prevladava nad pravima posjetitelja samo uz navedene mjere; ako se bilo koja ukloni, procjenu treba ponoviti ili prijeći na model privole. |

Odluku o ovom modelu donio je investitor; izvođač je ponudio i strožu varijantu (karta tek uz privolu). Preporuka: investitor potvrđuje odluku pisanim putem (email) i procjenu ponavlja kad se promijeni način prikaza karte ili propis.

-- =============================================================================
-- Auto Centar DEA — osnovna shema
-- Tablice, ograničenja, indeksi i okidači (triggeri).
-- Sigurnosna pravila (RLS) su u zasebnoj migraciji.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Administratori
-- Pravo pristupa adminu određuje ISKLJUČIVO postojanje retka u ovoj tablici.
-- Korisnik ne može sam sebe dodati (vidi RLS), a podaci nisu u user_metadata
-- koje korisnik može mijenjati.
-- -----------------------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null check (char_length(email) <= 254),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a where a.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- Ne smije se ukloniti zadnji administrator.
create or replace function public.protect_last_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.admins) <= 1 then
    raise exception 'Ne možete ukloniti zadnjeg administratora.' using errcode = 'P0001', detail = 'last_admin';
  end if;
  return old;
end;
$$;

create trigger admins_protect_last
  before delete on public.admins
  for each row execute function public.protect_last_admin();

-- -----------------------------------------------------------------------------
-- Postavke salona (javni podaci) — uvijek točno jedan redak (id = 1)
-- -----------------------------------------------------------------------------
create table public.site_settings (
  id               smallint primary key default 1 check (id = 1),
  business_name    text not null default 'Auto Centar DEA' check (char_length(business_name) between 2 and 80),
  street_address   text check (char_length(street_address) <= 120),
  city             text check (char_length(city) <= 60),
  postal_code      text check (char_length(postal_code) <= 12),
  country_code     text not null default 'BA' check (country_code ~ '^[A-Z]{2}$'),
  phone            text check (phone ~ '^\+?[0-9 ()/-]{6,24}$'),
  email            text check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  open_24_7        boolean not null default false,
  opening_hours    text check (char_length(opening_hours) <= 300),
  instagram_url    text check (instagram_url ~ '^https://' and char_length(instagram_url) <= 300),
  facebook_url     text check (facebook_url ~ '^https://' and char_length(facebook_url) <= 300),
  viber_number     text check (viber_number ~ '^\+[0-9]{8,15}$'),
  whatsapp_number  text check (whatsapp_number ~ '^\+[0-9]{8,15}$'),
  maps_url         text check (maps_url ~ '^https://' and char_length(maps_url) <= 500),
  latitude         numeric(9, 6) check (latitude between -90 and 90),
  longitude        numeric(9, 6) check (longitude between -180 and 180),
  hero_title       text check (char_length(hero_title) <= 90),
  hero_subtitle    text check (char_length(hero_subtitle) <= 220),
  about_text       text check (char_length(about_text) <= 4000),
  -- Kako se javno prikazuju rezervirana i prodana vozila
  reserved_display text not null default 'inline'  check (reserved_display in ('inline', 'separate', 'hidden')),
  sold_display     text not null default 'archive' check (sold_display in ('inline', 'archive', 'hidden')),
  default_currency text not null default 'BAM' check (default_currency in ('BAM', 'EUR')),
  updated_at       timestamptz not null default now()
);

-- Privatne postavke (samo administratori)
create table public.private_settings (
  id                  smallint primary key default 1 check (id = 1),
  notification_emails text[] not null default '{}' check (cardinality(notification_emails) <= 10),
  updated_at          timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Vozila
-- Cijena se sprema kao cijeli broj u najmanjoj jedinici valute (feninzi/centi),
-- nikad kao float. price_bam_minor je izračunata vrijednost u KM (fiksni tečaj
-- valutnog odbora 1 EUR = 1,95583 KM) za ispravno filtriranje i sortiranje.
-- -----------------------------------------------------------------------------
create table public.vehicles (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique
                           check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  title                  text not null check (char_length(title) between 2 and 120),
  brand                  text not null check (char_length(brand) between 1 and 60),
  model                  text not null check (char_length(model) between 1 and 60),
  variant                text check (char_length(variant) <= 80),
  category               text not null default 'standard' check (category in ('premium', 'standard')),
  status                 text not null default 'available'
                           check (status in ('available', 'coming_soon', 'reserved', 'sold', 'archived')),
  status_rank            smallint generated always as (
                           case status
                             when 'available' then 0
                             when 'coming_soon' then 1
                             when 'reserved' then 2
                             when 'sold' then 3
                             else 4
                           end
                         ) stored,
  is_published           boolean not null default false,
  is_featured            boolean not null default false,
  price_amount           bigint check (price_amount between 0 and 100000000000),
  currency               text not null default 'BAM' check (currency in ('BAM', 'EUR')),
  price_on_request       boolean not null default false,
  price_bam_minor        bigint generated always as (
                           case currency
                             when 'EUR' then round(price_amount * 1.95583)::bigint
                             else price_amount
                           end
                         ) stored,
  year                   smallint not null check (year between 1900 and 2100),
  mileage_km             integer not null check (mileage_km between 0 and 5000000),
  fuel_type              text not null
                           check (fuel_type in ('benzin', 'dizel', 'hibrid', 'plug_in_hibrid', 'elektricni', 'plin')),
  transmission           text not null check (transmission in ('manualni', 'automatski')),
  engine_displacement_cc integer check (engine_displacement_cc between 50 and 10000),
  power_kw               integer check (power_kw between 1 and 2000),
  body_type              text check (body_type in (
                           'limuzina', 'karavan', 'hatchback', 'suv', 'coupe', 'kabriolet',
                           'monovolumen', 'pickup', 'kombi', 'terenac', 'ostalo')),
  exterior_color         text check (char_length(exterior_color) <= 40),
  drivetrain             text check (drivetrain in ('prednji', 'straznji', '4x4')),
  doors                  smallint check (doors between 1 and 9),
  seats                  smallint check (seats between 1 and 12),
  description            text check (char_length(description) <= 8000),
  equipment              text[] not null default '{}' check (cardinality(equipment) <= 150),
  stock_ref              text check (char_length(stock_ref) <= 40),
  public_vin             text, -- popunjava ga okidač iz vehicle_internal kad je javni prikaz dopušten
  arrival_date           date,
  arrival_note           text check (char_length(arrival_note) <= 80),
  reserved_at            timestamptz,
  sold_at                timestamptz,
  seo_title              text check (char_length(seo_title) <= 70),
  seo_description        text check (char_length(seo_description) <= 170),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint vehicles_price_present check (price_on_request or price_amount is not null)
);

comment on column public.vehicles.price_amount is 'Cijena u najmanjoj jedinici valute (npr. 4590000 = 45.900,00 KM)';

-- Interni podaci vozila (nikad javni)
create table public.vehicle_internal (
  vehicle_id    uuid primary key references public.vehicles (id) on delete cascade,
  vin           text check (vin ~ '^[A-HJ-NPR-Z0-9]{11,17}$'),
  show_vin      boolean not null default false,
  internal_note text check (char_length(internal_note) <= 2000),
  updated_at    timestamptz not null default now()
);

-- Slike vozila. Naslovna slika je uvijek ona s najmanjim sort_order (0).
create table public.vehicle_images (
  id           uuid primary key default gen_random_uuid(),
  vehicle_id   uuid not null references public.vehicles (id) on delete cascade,
  storage_path text not null unique
                 check (storage_path ~ '^vehicles/[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'),
  width        integer check (width between 1 and 10000),
  height       integer check (height between 1 and 10000),
  alt_text     text check (char_length(alt_text) <= 200),
  sort_order   integer not null check (sort_order >= 0),
  created_at   timestamptz not null default now(),
  constraint vehicle_images_order_unique unique (vehicle_id, sort_order) deferrable initially deferred
);

-- -----------------------------------------------------------------------------
-- Upiti kupaca
-- -----------------------------------------------------------------------------
create table public.inquiries (
  id            uuid primary key default gen_random_uuid(),
  vehicle_id    uuid references public.vehicles (id) on delete set null,
  vehicle_label text check (char_length(vehicle_label) <= 160), -- naziv vozila u trenutku upita
  email         text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  message       text check (char_length(message) <= 2000),
  status        text not null default 'new' check (status in ('new', 'in_progress', 'answered', 'closed')),
  is_read       boolean not null default false,
  internal_note text check (char_length(internal_note) <= 2000),
  ip_hash       text check (ip_hash ~ '^[0-9a-f]{64}$'),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Indeksi
-- -----------------------------------------------------------------------------
create index vehicles_public_listing_idx on public.vehicles (is_published, status_rank, created_at desc);
create index vehicles_status_idx         on public.vehicles (status);
create index vehicles_category_idx       on public.vehicles (category, status_rank);
create index vehicles_price_idx          on public.vehicles (price_bam_minor);
create index vehicles_year_idx           on public.vehicles (year);
create index vehicles_mileage_idx        on public.vehicles (mileage_km);
create index vehicles_created_idx        on public.vehicles (created_at desc);
create index vehicles_featured_idx       on public.vehicles (is_featured) where is_featured;
create index vehicles_brand_idx          on public.vehicles (lower(brand));
create index vehicle_images_vehicle_idx  on public.vehicle_images (vehicle_id, sort_order);
create index inquiries_created_idx       on public.inquiries (created_at desc);
create index inquiries_status_idx        on public.inquiries (status, is_read);
create index inquiries_vehicle_idx       on public.inquiries (vehicle_id);
create index inquiries_ip_recent_idx     on public.inquiries (ip_hash, created_at desc);

-- -----------------------------------------------------------------------------
-- Pomoćne funkcije
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Pretvara tekst u URL slug, uključujući hrvatske/bosanske znakove.
create or replace function public.slugify(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from
    regexp_replace(
      regexp_replace(
        translate(lower(coalesce(value, '')),
          'čćžšđàáâãäåèéêëìíîïòóôõöùúûüýÿñç',
          'cczsdaaaaaaeeeeiiiiooooouuuuyync'),
        '[^a-z0-9]+', '-', 'g'),
      '-{2,}', '-', 'g'));
$$;

-- -----------------------------------------------------------------------------
-- Okidači za vozila: slug, vremenske oznake statusa, poslovna pravila
-- -----------------------------------------------------------------------------
create or replace function public.vehicles_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  base text;
begin
  if tg_op = 'INSERT' then
    -- Stabilan i jedinstven slug: marka-model-godina-<6 znakova iz id-a>
    base := left(public.slugify(new.brand || ' ' || new.model || ' ' || new.year::text), 100);
    if base = '' then
      base := 'vozilo';
    end if;
    new.slug := base || '-' || substr(replace(new.id::text, '-', ''), 1, 6);
    new.created_at := now();
  else
    -- Slug se nikad ne mijenja nakon kreiranja (stabilni URL-ovi za SEO i dijeljenje)
    new.slug := old.slug;
    new.created_at := old.created_at;
    -- public_vin se mijenja samo preko vehicle_internal
    if new.public_vin is distinct from old.public_vin
       and pg_trigger_depth() <= 1 then
      new.public_vin := old.public_vin;
    end if;
  end if;

  new.title := btrim(new.title);
  new.brand := btrim(new.brand);
  new.model := btrim(new.model);

  -- Vremenske oznake statusa
  if new.status = 'reserved' then
    if tg_op = 'INSERT' or old.status <> 'reserved' then
      new.reserved_at := coalesce(new.reserved_at, now());
    end if;
  elsif new.status in ('available', 'coming_soon', 'sold') then
    new.reserved_at := null;
  end if;

  if new.status = 'sold' then
    if tg_op = 'INSERT' or old.status <> 'sold' then
      new.sold_at := coalesce(new.sold_at, now());
    end if;
  elsif new.status in ('available', 'coming_soon', 'reserved') then
    new.sold_at := null;
  end if;

  -- Prodano ili arhivirano vozilo ne može biti izdvojeno na početnoj
  if new.status in ('sold', 'archived') then
    new.is_featured := false;
  end if;

  -- Objavljeno vozilo mora imati barem jednu fotografiju
  if new.is_published and (tg_op = 'INSERT' or not old.is_published) then
    if not exists (select 1 from public.vehicle_images i where i.vehicle_id = new.id) then
      raise exception 'Za objavu je potrebna barem jedna fotografija.' using errcode = 'P0001', detail = 'publish_requires_image';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger vehicles_before_write
  before insert or update on public.vehicles
  for each row execute function public.vehicles_before_write();

-- Javni VIN se održava iz internih podataka
create or replace function public.vehicle_internal_sync_vin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  update public.vehicles v
     set public_vin = case when new.show_vin then new.vin else null end
   where v.id = new.vehicle_id;
  return new;
end;
$$;

create trigger vehicle_internal_sync_vin
  before insert or update on public.vehicle_internal
  for each row execute function public.vehicle_internal_sync_vin();

-- Slike: automatski redni broj (bez utrka kod paralelnog uploada) i ograničenje broja
create or replace function public.vehicle_images_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  image_count integer;
begin
  -- Zaključaj redak vozila da paralelni uploadi dobiju različite redne brojeve
  perform 1 from public.vehicles v where v.id = new.vehicle_id for update;
  if not found then
    raise exception 'Vozilo ne postoji.' using errcode = 'P0001', detail = 'vehicle_not_found';
  end if;

  select count(*) into image_count from public.vehicle_images where vehicle_id = new.vehicle_id;
  if image_count >= 40 then
    raise exception 'Vozilo može imati najviše 40 fotografija.' using errcode = 'P0001', detail = 'too_many_images';
  end if;

  select coalesce(max(sort_order) + 1, 0) into new.sort_order
    from public.vehicle_images where vehicle_id = new.vehicle_id;
  new.created_at := now();
  return new;
end;
$$;

create trigger vehicle_images_before_insert
  before insert on public.vehicle_images
  for each row execute function public.vehicle_images_before_insert();

-- Brisanje slike: ne dopusti da objavljeno vozilo ostane bez slika,
-- a preostale slike ponovno numeriraj (0..n-1) da naslovna uvijek postoji.
create or replace function public.vehicle_images_after_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.vehicles v where v.id = old.vehicle_id and v.is_published)
     and not exists (select 1 from public.vehicle_images i where i.vehicle_id = old.vehicle_id) then
    raise exception 'Objavljeno vozilo mora imati barem jednu fotografiju. Najprije poništite objavu.' using errcode = 'P0001', detail = 'published_needs_image';
  end if;

  update public.vehicle_images i
     set sort_order = r.rn - 1
    from (
      select id, row_number() over (order by sort_order, created_at) as rn
        from public.vehicle_images
       where vehicle_id = old.vehicle_id
    ) r
   where i.id = r.id and i.sort_order <> r.rn - 1;
  return old;
end;
$$;

create trigger vehicle_images_after_delete
  after delete on public.vehicle_images
  for each row execute function public.vehicle_images_after_delete();

create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();
create trigger private_settings_updated_at before update on public.private_settings
  for each row execute function public.set_updated_at();
create trigger inquiries_updated_at before update on public.inquiries
  for each row execute function public.set_updated_at();

-- Upiti: administrator smije mijenjati samo status, oznaku pročitano i bilješku
create or replace function public.inquiries_protect_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.email is distinct from old.email
     or new.message is distinct from old.message
     or new.vehicle_label is distinct from old.vehicle_label
     or new.ip_hash is distinct from old.ip_hash
     or new.created_at is distinct from old.created_at then
    raise exception 'Sadržaj upita kupca ne može se mijenjati.' using errcode = 'P0001', detail = 'inquiry_immutable';
  end if;
  return new;
end;
$$;

create trigger inquiries_protect_fields
  before update on public.inquiries
  for each row execute function public.inquiries_protect_fields();

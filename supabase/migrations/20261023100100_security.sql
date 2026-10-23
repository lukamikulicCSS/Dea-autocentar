-- =============================================================================
-- Auto Centar DEA — Row Level Security, ovlasti i sigurne funkcije
-- =============================================================================

-- Je li vozilo javno vidljivo (objavljeno + pravila prikaza iz postavki)?
create or replace function public.vehicle_is_public(p_status text, p_is_published boolean)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_is_published
     and p_status <> 'archived'
     and not exists (
       select 1 from public.site_settings s
        where s.id = 1
          and ((p_status = 'reserved' and s.reserved_display = 'hidden')
            or (p_status = 'sold' and s.sold_display = 'hidden'))
     );
$$;

revoke all on function public.vehicle_is_public(text, boolean) from public;
grant execute on function public.vehicle_is_public(text, boolean) to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Uključi RLS na svim tablicama
-- -----------------------------------------------------------------------------
alter table public.admins           enable row level security;
alter table public.site_settings    enable row level security;
alter table public.private_settings enable row level security;
alter table public.vehicles         enable row level security;
alter table public.vehicle_internal enable row level security;
alter table public.vehicle_images   enable row level security;
alter table public.inquiries        enable row level security;

-- Dodatna obrana: anonimni korisnik nikad ne piše izravno u tablice,
-- a privatne tablice ne može ni čitati.
revoke insert, update, delete, truncate on all tables in schema public from anon;
revoke all on public.admins, public.private_settings, public.vehicle_internal, public.inquiries from anon;
revoke truncate on all tables in schema public from authenticated;

-- -----------------------------------------------------------------------------
-- admins
-- -----------------------------------------------------------------------------
create policy "admins: administratori čitaju"
  on public.admins for select to authenticated
  using ((select public.is_admin()));

create policy "admins: administratori dodaju"
  on public.admins for insert to authenticated
  with check ((select public.is_admin()));

create policy "admins: administratori uklanjaju druge"
  on public.admins for delete to authenticated
  using ((select public.is_admin()) and user_id <> (select auth.uid()));

-- -----------------------------------------------------------------------------
-- site_settings — javni podaci o salonu (namjerno čitljivi svima)
-- -----------------------------------------------------------------------------
create policy "site_settings: javno čitanje"
  on public.site_settings for select to anon, authenticated
  using (id = 1);

create policy "site_settings: administratori mijenjaju"
  on public.site_settings for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- private_settings — samo administratori
-- -----------------------------------------------------------------------------
create policy "private_settings: administratori čitaju"
  on public.private_settings for select to authenticated
  using ((select public.is_admin()));

create policy "private_settings: administratori mijenjaju"
  on public.private_settings for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- vehicles
-- -----------------------------------------------------------------------------
create policy "vehicles: javno čitanje objavljenih"
  on public.vehicles for select to anon, authenticated
  using (public.vehicle_is_public(status, is_published) or (select public.is_admin()));

create policy "vehicles: administratori dodaju"
  on public.vehicles for insert to authenticated
  with check ((select public.is_admin()));

create policy "vehicles: administratori mijenjaju"
  on public.vehicles for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "vehicles: administratori brišu"
  on public.vehicles for delete to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- vehicle_internal — samo administratori
-- -----------------------------------------------------------------------------
create policy "vehicle_internal: administratori"
  on public.vehicle_internal for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- vehicle_images — vidljive su ako je vidljivo vozilo (RLS na vehicles vrijedi i ovdje)
-- -----------------------------------------------------------------------------
create policy "vehicle_images: čitanje uz vidljivo vozilo"
  on public.vehicle_images for select to anon, authenticated
  using (exists (select 1 from public.vehicles v where v.id = vehicle_id));

create policy "vehicle_images: administratori dodaju"
  on public.vehicle_images for insert to authenticated
  with check ((select public.is_admin()));

create policy "vehicle_images: administratori mijenjaju"
  on public.vehicle_images for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "vehicle_images: administratori brišu"
  on public.vehicle_images for delete to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- inquiries — kupci NE pišu izravno; upis ide isključivo preko submit_inquiry
-- (poziva ga server s ograničenjem učestalosti). Čitaju samo administratori.
-- -----------------------------------------------------------------------------
create policy "inquiries: administratori čitaju"
  on public.inquiries for select to authenticated
  using ((select public.is_admin()));

create policy "inquiries: administratori mijenjaju"
  on public.inquiries for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "inquiries: administratori brišu"
  on public.inquiries for delete to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- Zaprimanje upita s ograničenjem učestalosti (atomski, u bazi).
-- Smije ga pozvati samo service_role (server), jer ip_hash dolazi sa servera.
-- -----------------------------------------------------------------------------
create or replace function public.submit_inquiry(
  p_email      text,
  p_message    text,
  p_vehicle_id uuid,
  p_ip_hash    text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_label text;
  v_id    uuid;
  v_email text := lower(btrim(p_email));
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_request' using errcode = 'P0001';
  end if;

  -- Serijaliziraj upite s iste adrese da brojanje bude točno
  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));

  if (select count(*) from public.inquiries
       where ip_hash = p_ip_hash and created_at > now() - interval '10 minutes') >= 3
     or (select count(*) from public.inquiries
          where ip_hash = p_ip_hash and created_at > now() - interval '24 hours') >= 15
     or (select count(*) from public.inquiries
          where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  if p_vehicle_id is not null then
    select v.title into v_label
      from public.vehicles v
     where v.id = p_vehicle_id
       and public.vehicle_is_public(v.status, v.is_published)
       and v.status in ('available', 'coming_soon', 'reserved');
    if not found then
      raise exception 'vehicle_unavailable' using errcode = 'P0001';
    end if;
  end if;

  -- Isti kupac za isto vozilo u zadnjih sat vremena: ne stvaraj duplikat
  select i.id into v_id
    from public.inquiries i
   where i.email = v_email
     and i.vehicle_id is not distinct from p_vehicle_id
     and i.created_at > now() - interval '1 hour'
   limit 1;
  if found then
    return v_id;
  end if;

  insert into public.inquiries (vehicle_id, vehicle_label, email, message, ip_hash)
  values (p_vehicle_id, v_label, v_email, nullif(btrim(p_message), ''), p_ip_hash)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_inquiry(text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.submit_inquiry(text, text, uuid, text) to service_role;

-- -----------------------------------------------------------------------------
-- Redoslijed slika (jedna transakcija). Prva slika je naslovna.
-- -----------------------------------------------------------------------------
create or replace function public.admin_reorder_vehicle_images(p_vehicle_id uuid, p_image_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing_count integer;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select count(*) into existing_count from public.vehicle_images where vehicle_id = p_vehicle_id;

  if existing_count <> coalesce(cardinality(p_image_ids), 0)
     or existing_count <> (select count(distinct x) from unnest(p_image_ids) x)
     or exists (
       select 1 from unnest(p_image_ids) x
        where not exists (select 1 from public.vehicle_images i
                           where i.id = x and i.vehicle_id = p_vehicle_id)) then
    raise exception 'Popis slika nije ispravan. Osvježite stranicu i pokušajte ponovno.' using errcode = 'P0001', detail = 'invalid_image_order';
  end if;

  update public.vehicle_images i
     set sort_order = o.ord - 1
    from unnest(p_image_ids) with ordinality as o(id, ord)
   where i.id = o.id and i.vehicle_id = p_vehicle_id;
end;
$$;

revoke all on function public.admin_reorder_vehicle_images(uuid, uuid[]) from public, anon;
grant execute on function public.admin_reorder_vehicle_images(uuid, uuid[]) to authenticated;

-- -----------------------------------------------------------------------------
-- Statistika za nadzornu ploču (stvarni podaci iz baze)
-- -----------------------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns json
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return json_build_object(
    'active',          (select count(*) from public.vehicles where is_published and status in ('available', 'coming_soon', 'reserved')),
    'available',       (select count(*) from public.vehicles where status = 'available'),
    'premium',         (select count(*) from public.vehicles where category = 'premium' and status in ('available', 'coming_soon', 'reserved')),
    'coming_soon',     (select count(*) from public.vehicles where status = 'coming_soon'),
    'reserved',        (select count(*) from public.vehicles where status = 'reserved'),
    'sold',            (select count(*) from public.vehicles where status = 'sold'),
    'drafts',          (select count(*) from public.vehicles where not is_published and status <> 'archived'),
    'unread_inquiries',(select count(*) from public.inquiries where not is_read),
    'open_inquiries',  (select count(*) from public.inquiries where status in ('new', 'in_progress'))
  );
end;
$$;

revoke all on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;

-- Ostale interne funkcije ne trebaju biti dostupne preko API-ja
revoke all on function public.protect_last_admin() from public, anon, authenticated;
revoke all on function public.vehicles_before_write() from public, anon, authenticated;
revoke all on function public.vehicle_internal_sync_vin() from public, anon, authenticated;
revoke all on function public.vehicle_images_before_insert() from public, anon, authenticated;
revoke all on function public.vehicle_images_after_delete() from public, anon, authenticated;
revoke all on function public.inquiries_protect_fields() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

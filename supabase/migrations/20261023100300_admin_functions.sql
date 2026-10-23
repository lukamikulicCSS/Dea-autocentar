-- =============================================================================
-- Auto Centar DEA — administratorske funkcije (atomske, jedna transakcija)
-- Sve su SECURITY INVOKER: izvršavaju se s ovlastima prijavljenog korisnika,
-- pa RLS i dalje vrijedi; dodatno provjeravaju is_admin().
-- =============================================================================

-- Spremanje vozila + internih podataka (VIN, bilješka) u jednoj transakciji.
-- p_id = null → novo vozilo. p_publish: null = ne mijenjaj, true/false = objavi/povuci.
create or replace function public.admin_save_vehicle(
  p_id       uuid,
  p_vehicle  jsonb,
  p_internal jsonb,
  p_publish  boolean default null
)
returns table (id uuid, slug text)
language plpgsql
security invoker
set search_path = ''
as $$
#variable_conflict use_column
declare
  r public.vehicles;
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  r := jsonb_populate_record(null::public.vehicles, p_vehicle);

  if p_id is null then
    insert into public.vehicles (
      title, brand, model, variant, category, status, is_featured, is_published,
      price_amount, currency, price_on_request, year, mileage_km, fuel_type, transmission,
      engine_displacement_cc, power_kw, body_type, exterior_color, drivetrain, doors, seats,
      description, equipment, stock_ref, arrival_date, arrival_note, seo_title, seo_description
    ) values (
      r.title, r.brand, r.model, r.variant, r.category, r.status, coalesce(r.is_featured, false), false,
      r.price_amount, r.currency, coalesce(r.price_on_request, false), r.year, r.mileage_km, r.fuel_type, r.transmission,
      r.engine_displacement_cc, r.power_kw, r.body_type, r.exterior_color, r.drivetrain, r.doors, r.seats,
      r.description, coalesce(r.equipment, '{}'), r.stock_ref, r.arrival_date, r.arrival_note, r.seo_title, r.seo_description
    )
    returning vehicles.id into v_id;
  else
    update public.vehicles v set
      title = r.title, brand = r.brand, model = r.model, variant = r.variant,
      category = r.category, status = r.status, is_featured = coalesce(r.is_featured, false),
      is_published = coalesce(p_publish, v.is_published),
      price_amount = r.price_amount, currency = r.currency, price_on_request = coalesce(r.price_on_request, false),
      year = r.year, mileage_km = r.mileage_km, fuel_type = r.fuel_type, transmission = r.transmission,
      engine_displacement_cc = r.engine_displacement_cc, power_kw = r.power_kw, body_type = r.body_type,
      exterior_color = r.exterior_color, drivetrain = r.drivetrain, doors = r.doors, seats = r.seats,
      description = r.description, equipment = coalesce(r.equipment, '{}'), stock_ref = r.stock_ref,
      arrival_date = r.arrival_date, arrival_note = r.arrival_note,
      seo_title = r.seo_title, seo_description = r.seo_description
    where v.id = p_id
    returning v.id into v_id;

    if v_id is null then
      raise exception 'Vozilo nije pronađeno. Možda je obrisano.' using errcode = 'P0001', detail = 'vehicle_not_found';
    end if;
  end if;

  insert into public.vehicle_internal (vehicle_id, vin, show_vin, internal_note)
  values (
    v_id,
    nullif(p_internal ->> 'vin', ''),
    coalesce((p_internal ->> 'show_vin')::boolean, false),
    nullif(p_internal ->> 'internal_note', '')
  )
  on conflict (vehicle_id) do update
    set vin = excluded.vin, show_vin = excluded.show_vin, internal_note = excluded.internal_note;

  return query select v.id, v.slug from public.vehicles v where v.id = v_id;
end;
$$;

revoke all on function public.admin_save_vehicle(uuid, jsonb, jsonb, boolean) from public, anon;
grant execute on function public.admin_save_vehicle(uuid, jsonb, jsonb, boolean) to authenticated;

-- Kopija oglasa za brži unos sličnog vozila (bez slika i bez VIN-a, kao nacrt).
create or replace function public.admin_duplicate_vehicle(p_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into public.vehicles (
    title, brand, model, variant, category, status, is_featured, is_published,
    price_amount, currency, price_on_request, year, mileage_km, fuel_type, transmission,
    engine_displacement_cc, power_kw, body_type, exterior_color, drivetrain, doors, seats,
    description, equipment, arrival_date, arrival_note
  )
  select
    left(v.title || ' (kopija)', 120), v.brand, v.model, v.variant, v.category,
    case when v.status in ('sold', 'archived', 'reserved') then 'available' else v.status end,
    false, false,
    v.price_amount, v.currency, v.price_on_request, v.year, v.mileage_km, v.fuel_type, v.transmission,
    v.engine_displacement_cc, v.power_kw, v.body_type, v.exterior_color, v.drivetrain, v.doors, v.seats,
    v.description, v.equipment, v.arrival_date, v.arrival_note
  from public.vehicles v
  where v.id = p_id
  returning id into v_id;

  if v_id is null then
    raise exception 'Vozilo nije pronađeno.' using errcode = 'P0001', detail = 'vehicle_not_found';
  end if;
  return v_id;
end;
$$;

revoke all on function public.admin_duplicate_vehicle(uuid) from public, anon;
grant execute on function public.admin_duplicate_vehicle(uuid) to authenticated;

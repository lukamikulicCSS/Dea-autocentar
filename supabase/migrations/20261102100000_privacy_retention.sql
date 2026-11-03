-- =============================================================================
-- Rokovi čuvanja podataka iz upita (Zakon o zaštiti ličnih podataka BiH,
-- „Sl. glasnik BiH“ 12/25, čl. 7. st. 1. t. c) i e): smanjenje obima podataka
-- i ograničenje čuvanja).
--
-- Rokovi su OVDJE na jednom mjestu i moraju se podudarati s tekstom na
-- stranici /privatnost (lib/legal.ts → RETENTION):
--   • sažetak IP adrese (ip_hash)  → briše se nakon 30 dana
--     (ograničenje učestalosti gleda najviše 24 sata unatrag)
--   • cijeli upit (email, poruka…) → briše se 24 mjeseca od zaprimanja
--
-- Brisanje pokreće dnevni Vercel Cron (app/api/cron/ciscenje-podataka) koji
-- poziva purge_expired_inquiry_data() sa servera (service_role).
-- =============================================================================

-- Sadržaj upita i dalje je nepromjenjiv, ALI sažetak IP adrese smije se
-- obrisati (postaviti na NULL) — nikad promijeniti u drugu vrijednost.
create or replace function public.inquiries_protect_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.email is distinct from old.email
     or new.message is distinct from old.message
     or new.vehicle_label is distinct from old.vehicle_label
     or (new.ip_hash is distinct from old.ip_hash and new.ip_hash is not null)
     or new.created_at is distinct from old.created_at then
    raise exception 'Sadržaj upita kupca ne može se mijenjati.' using errcode = 'P0001', detail = 'inquiry_immutable';
  end if;
  return new;
end;
$$;

create or replace function public.purge_expired_inquiry_data()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hashes  integer;
  v_deleted integer;
begin
  update public.inquiries
     set ip_hash = null
   where ip_hash is not null
     and created_at < now() - interval '30 days';
  get diagnostics v_hashes = row_count;

  delete from public.inquiries
   where created_at < now() - interval '24 months';
  get diagnostics v_deleted = row_count;

  return jsonb_build_object('ip_hashes_cleared', v_hashes, 'inquiries_deleted', v_deleted);
end;
$$;

revoke all on function public.purge_expired_inquiry_data() from public, anon, authenticated;
grant execute on function public.purge_expired_inquiry_data() to service_role;

comment on function public.purge_expired_inquiry_data() is
  'Briše IP sažetke starije od 30 dana i upite starije od 24 mjeseca. Poziva ga samo server (Vercel Cron).';

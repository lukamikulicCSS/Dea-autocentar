-- =============================================================================
-- Auto Centar DEA — Storage (fotografije vozila) i početne postavke
-- =============================================================================

-- Javni bucket SAMO ZA ČITANJE fotografija vozila.
-- Upload, zamjena i brisanje dopušteni su isključivo administratorima.
-- Putanje su nasumični UUID-ovi pa se slike neobjavljenih vozila ne mogu pogoditi.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-images', 'vehicle-images', true, 6291456, array['image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Nema javne SELECT politike na storage.objects: javne slike se dohvaćaju preko
-- javnog URL-a, a popis datoteka (listanje bucketa) nije dostupan anonimnima.
create policy "vehicle-images: administratori čitaju metapodatke"
  on storage.objects for select to authenticated
  using (bucket_id = 'vehicle-images' and (select public.is_admin()));

create policy "vehicle-images: administratori učitavaju"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'vehicle-images'
    and (select public.is_admin())
    and name ~ '^vehicles/[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'
  );

create policy "vehicle-images: administratori mijenjaju"
  on storage.objects for update to authenticated
  using (bucket_id = 'vehicle-images' and (select public.is_admin()))
  with check (bucket_id = 'vehicle-images' and (select public.is_admin()));

create policy "vehicle-images: administratori brišu"
  on storage.objects for delete to authenticated
  using (bucket_id = 'vehicle-images' and (select public.is_admin()));

-- -----------------------------------------------------------------------------
-- Početne postavke salona (sve se može promijeniti u adminu → Postavke)
-- -----------------------------------------------------------------------------
insert into public.site_settings (
  id, business_name, street_address, city, postal_code, country_code,
  phone, email, open_24_7, opening_hours,
  instagram_url, facebook_url,
  hero_title, hero_subtitle, about_text,
  reserved_display, sold_display, default_currency
) values (
  1,
  'Auto Centar DEA',
  'Sarajevska 135',
  'Zenica',
  '72000',
  'BA',
  '+387 61 310 330',
  'info@dea.ba',
  true,
  'Svaki dan, 0–24',
  'https://www.instagram.com/dea_auto_centar/',
  'https://www.facebook.com/dea.autocar',
  'Provjerena vozila u srcu Zenice',
  'Svako vozilo iz naše ponude prije oglašavanja prolazi detaljan pregled. Pogledajte ponudu ili nas nazovite u bilo koje doba.',
  E'Auto Centar DEA je salon automobila u Zenici. Prije nego što vozilo uđe u ponudu, detaljno ga pregledamo i provjerimo njegovu tehničku ispravnost, kako biste kupovali bez stresa i nagađanja.\n\nUz kupnju vam nudimo probnu vožnju, zamjenu vašeg dosadašnjeg vozila uz besplatnu procjenu te kompletnu uslugu osiguranja i registracije na jednom mjestu. Iza salona stoji dugogodišnje iskustvo i stručno tehničko osoblje.\n\nSalon možete posjetiti u bilo koje doba. Javite nam se i dogovorit ćemo termin koji vama odgovara.',
  'inline',
  'archive',
  'BAM'
)
on conflict (id) do nothing;

insert into public.private_settings (id, notification_emails)
values (1, array['info@dea.ba'])
on conflict (id) do nothing;

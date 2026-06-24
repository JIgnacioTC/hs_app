-- HS 010: Corregir buckets para GIFs (MIME, tamaño, políticas de subida)
-- El dashboard de Supabase usa upload resumable (TUS) en archivos grandes y suele fallar.
-- Usa: node scripts/upload-exercise-media.mjs

update storage.buckets
set
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = null
where id in ('images', 'videos');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 104857600, null)
on conflict (id) do update
set public = true, file_size_limit = 104857600, allowed_mime_types = null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 104857600, null)
on conflict (id) do update
set public = true, file_size_limit = 104857600, allowed_mime_types = null;

-- Lectura pública
drop policy if exists "Public read exercise images" on storage.objects;
create policy "Public read exercise images"
  on storage.objects for select
  to public
  using (bucket_id = 'images');

drop policy if exists "Public read exercise videos" on storage.objects;
create policy "Public read exercise videos"
  on storage.objects for select
  to public
  using (bucket_id = 'videos');

-- Subida vía dashboard (usuario autenticado) o scripts con service role
drop policy if exists "Authenticated upload exercise media" on storage.objects;
create policy "Authenticated upload exercise media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('images', 'videos'));

drop policy if exists "Authenticated update exercise media" on storage.objects;
create policy "Authenticated update exercise media"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('images', 'videos'))
  with check (bucket_id in ('images', 'videos'));

drop policy if exists "Service role manages exercise media" on storage.objects;
create policy "Service role manages exercise media"
  on storage.objects for all
  to service_role
  using (bucket_id in ('images', 'videos'))
  with check (bucket_id in ('images', 'videos'));

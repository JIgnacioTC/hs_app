-- HS 009: Storage público para media de ejercicios (bucket images + opcional videos)
-- Sube archivos del repo hasaneyldrm/exercises-dataset:
--   images/*  → bucket "images" (solo el nombre de archivo, ej. 0001-abc.jpg)
--   videos/*  → bucket "videos" o el mismo "images" si subiste GIFs ahí

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update
set public = true;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  true,
  104857600,
  array['image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do update
set public = true;

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

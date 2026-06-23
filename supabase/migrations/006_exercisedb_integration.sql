-- HS 006: Integración ExerciseDB (media + metadatos enriquecidos)

alter table public.exercise_catalog
  add column if not exists exercisedb_id text unique,
  add column if not exists demo_gif_url text,
  add column if not exists image_url text,
  add column if not exists image_urls jsonb,
  add column if not exists video_url text,
  add column if not exists body_parts text[] not null default '{}',
  add column if not exists target_muscles text[] not null default '{}',
  add column if not exists secondary_muscles text[] not null default '{}',
  add column if not exists overview text,
  add column if not exists exercise_tips text[] not null default '{}',
  add column if not exists variations text[] not null default '{}';

create index if not exists exercise_catalog_exercisedb_id_idx
  on public.exercise_catalog(exercisedb_id)
  where exercisedb_id is not null;

-- Vinculación inicial conocida (press de banca)
update public.exercise_catalog
set
  exercisedb_id = 'EIeI8Vf',
  demo_gif_url = 'https://static.exercisedb.dev/media/EIeI8Vf.gif',
  image_url = 'https://static.exercisedb.dev/media/EIeI8Vf.gif',
  body_parts = array['chest'],
  target_muscles = array['pectorals'],
  secondary_muscles = array['triceps', 'shoulders']
where slug = 'press-banca-plano';

-- HS 003: Catálogo global de ejercicios

create table public.exercise_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  muscle_group text not null,
  muscle_subgroup text not null,
  exercise_type text not null
    check (exercise_type in ('compuesto', 'aislamiento', 'cardio', 'movilidad', 'pliometrico')),
  execution_mode text not null
    check (execution_mode in ('repeticiones', 'tiempo', 'repeticiones_por_lado', 'distancia', 'isometrico')),
  default_prescription text not null,
  equipment text[] not null default '{}',
  rest_type text not null
    check (rest_type in ('corto', 'medio', 'largo', 'activo', 'ninguno')),
  rest_seconds int not null default 60,
  instructions text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index exercise_catalog_muscle_group_idx on public.exercise_catalog(muscle_group);
create index exercise_catalog_subgroup_idx on public.exercise_catalog(muscle_subgroup);
create index exercise_catalog_type_idx on public.exercise_catalog(exercise_type);

alter table public.gym_exercises
  add column if not exists exercise_catalog_id uuid
    references public.exercise_catalog(id) on delete set null;

create index gym_exercises_catalog_idx on public.gym_exercises(exercise_catalog_id);

alter table public.exercise_catalog enable row level security;

create policy "Authenticated users read catalog"
  on public.exercise_catalog for select
  to authenticated
  using (active = true);

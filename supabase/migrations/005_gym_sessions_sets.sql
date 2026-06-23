-- HS 005: Series planificadas, logs de sesión e historial

create table public.gym_planned_sets (
  id uuid primary key default gen_random_uuid(),
  gym_exercise_id uuid not null references public.gym_exercises(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  set_number int not null check (set_number >= 1),
  target_reps int,
  target_seconds int,
  target_weight_kg numeric(8, 2),
  target_rir int check (target_rir is null or (target_rir >= 0 and target_rir <= 5)),
  rest_seconds int not null default 60,
  created_at timestamptz not null default now(),
  unique (gym_exercise_id, set_number)
);

create table public.gym_set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.gym_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  gym_exercise_id uuid not null references public.gym_exercises(id) on delete cascade,
  exercise_catalog_id uuid references public.exercise_catalog(id) on delete set null,
  set_number int not null check (set_number >= 1),
  reps int,
  duration_seconds int,
  weight_kg numeric(8, 2),
  rir int check (rir is null or (rir >= 0 and rir <= 5)),
  rest_seconds_used int,
  completed_at timestamptz not null default now()
);

alter table public.gym_sessions
  add column if not exists status text not null default 'completed'
    check (status in ('active', 'completed', 'abandoned'));

create index gym_planned_sets_exercise_idx on public.gym_planned_sets(gym_exercise_id);
create index gym_set_logs_session_idx on public.gym_set_logs(session_id);
create index gym_set_logs_catalog_idx on public.gym_set_logs(exercise_catalog_id, completed_at desc);
create index gym_set_logs_user_catalog_idx on public.gym_set_logs(user_id, exercise_catalog_id);

alter table public.gym_planned_sets enable row level security;
alter table public.gym_set_logs enable row level security;

create policy "Users manage own planned sets" on public.gym_planned_sets
  for all using (auth.uid() = user_id);

create policy "Users manage own set logs" on public.gym_set_logs
  for all using (auth.uid() = user_id);

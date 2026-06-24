-- Private body metrics for fitness calculations (not exposed via broad profile RLS)

create table public.user_fitness_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sex text check (sex in ('male', 'female', 'other', 'prefer_not_to_say')),
  birth_date date,
  height_cm numeric(5, 1) check (height_cm > 0 and height_cm < 300),
  weight_kg numeric(5, 1) check (weight_kg > 0 and weight_kg < 500),
  activity_level text check (
    activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')
  ),
  training_experience text check (
    training_experience in ('beginner', 'intermediate', 'advanced')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_fitness_profiles enable row level security;

create policy "Users read own fitness profile"
  on public.user_fitness_profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users insert own fitness profile"
  on public.user_fitness_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update own fitness profile"
  on public.user_fitness_profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger user_fitness_profiles_updated_at
  before update on public.user_fitness_profiles
  for each row execute function public.set_updated_at();

grant select, insert, update on public.user_fitness_profiles to authenticated;

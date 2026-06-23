-- HS: Habit Tracker + Gym Routines
-- Run in Supabase SQL Editor or via supabase db push

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  timezone text not null default 'UTC',
  focus_areas text[] not null default '{}',
  wizard_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Habits
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default 'circle',
  color text not null default '#00A3FF',
  target_days int[] not null default '{0,1,2,3,4,5,6}',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Daily habit logs
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  unique(habit_id, log_date)
);

-- Gym routines
create table public.gym_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Exercises within a routine
create table public.gym_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.gym_routines(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sets int not null default 3,
  reps text not null default '10',
  weight text,
  rest_seconds int not null default 60,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Completed workout sessions
create table public.gym_sessions (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.gym_routines(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text
);

-- Configurable reminders (cron expressions)
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  cron_expression text not null default '0 8 * * *',
  timezone text not null default 'UTC',
  linked_type text check (linked_type in ('habit', 'gym', 'general')),
  linked_id uuid,
  enabled boolean not null default true,
  last_sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Web Push subscriptions
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

-- Indexes
create index habits_user_id_idx on public.habits(user_id);
create index habit_logs_user_date_idx on public.habit_logs(user_id, log_date);
create index gym_routines_user_id_idx on public.gym_routines(user_id);
create index reminders_user_id_idx on public.reminders(user_id);
create index reminders_enabled_idx on public.reminders(enabled) where enabled = true;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.gym_routines enable row level security;
alter table public.gym_exercises enable row level security;
alter table public.gym_sessions enable row level security;
alter table public.reminders enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id);

create policy "Users manage own habits" on public.habits
  for all using (auth.uid() = user_id);

create policy "Users manage own habit logs" on public.habit_logs
  for all using (auth.uid() = user_id);

create policy "Users manage own gym routines" on public.gym_routines
  for all using (auth.uid() = user_id);

create policy "Users manage own gym exercises" on public.gym_exercises
  for all using (auth.uid() = user_id);

create policy "Users manage own gym sessions" on public.gym_sessions
  for all using (auth.uid() = user_id);

create policy "Users manage own reminders" on public.reminders
  for all using (auth.uid() = user_id);

create policy "Users manage own push subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id);

-- Service role bypasses RLS for cron job

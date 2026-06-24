-- Shared gym routines between friends

create table public.routine_shares (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  source_routine_id uuid not null references public.gym_routines(id) on delete cascade,
  copied_routine_id uuid not null references public.gym_routines(id) on delete cascade,
  routine_name text not null,
  created_at timestamptz not null default now()
);

create index routine_shares_to_user_idx on public.routine_shares(to_user_id, created_at desc);
create index routine_shares_from_user_idx on public.routine_shares(from_user_id, created_at desc);

alter table public.routine_shares enable row level security;

create policy "Read own routine shares" on public.routine_shares
  for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Insert own routine shares" on public.routine_shares
  for insert with check (auth.uid() = from_user_id);

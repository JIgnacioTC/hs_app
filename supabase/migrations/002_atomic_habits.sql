-- HS 002: Atomic Habits methodology fields

alter table public.profiles
  add column if not exists identity_statement text not null default '';

alter table public.habits
  add column if not exists identity_link text not null default '',
  add column if not exists cue text not null default '',
  add column if not exists craving text not null default '',
  add column if not exists two_minute_version text not null default '',
  add column if not exists reward text not null default '',
  add column if not exists stack_after_habit_id uuid references public.habits(id) on delete set null,
  add column if not exists implementation_intention text not null default '',
  add column if not exists habit_kind text not null default 'build'
    check (habit_kind in ('build', 'break'));

alter table public.habit_logs
  add column if not exists completion_type text not null default 'full'
    check (completion_type in ('full', 'two_minute')),
  add column if not exists reflection text;

create index if not exists habits_stack_after_idx on public.habits(stack_after_habit_id);

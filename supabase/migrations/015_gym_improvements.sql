-- Preserve set logs when exercises are removed; dedupe logs; track skipped sets

alter table public.gym_set_logs
  drop constraint if exists gym_set_logs_gym_exercise_id_fkey;

alter table public.gym_set_logs
  alter column gym_exercise_id drop not null;

alter table public.gym_set_logs
  add constraint gym_set_logs_gym_exercise_id_fkey
  foreign key (gym_exercise_id) references public.gym_exercises(id) on delete set null;

alter table public.gym_set_logs
  add column if not exists skipped boolean not null default false;

create unique index if not exists gym_set_logs_session_set_uidx
  on public.gym_set_logs(session_id, gym_exercise_id, set_number)
  where gym_exercise_id is not null and skipped = false;

create or replace function public.user_catalog_activity_counts(p_user_id uuid)
returns table(exercise_catalog_id uuid, activity_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select exercise_catalog_id, count(*)
  from public.gym_set_logs
  where user_id = p_user_id
    and exercise_catalog_id is not null
    and skipped = false
  group by exercise_catalog_id;
$$;

-- Unified social feed: posts, workouts, thread replies, likes
-- Safe to run even if legacy workout_* tables were never created.

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'post' check (kind in ('post', 'workout', 'reply')),
  body text,
  parent_id uuid references public.social_posts(id) on delete cascade,
  root_id uuid references public.social_posts(id) on delete cascade,
  session_id uuid references public.gym_sessions(id) on delete set null,
  routine_name text,
  duration_seconds int,
  exercise_count int,
  set_count int,
  image_url text,
  created_at timestamptz not null default now(),
  constraint social_posts_body_len check (body is null or char_length(body) <= 2000)
);

create index if not exists social_posts_user_idx on public.social_posts(user_id, created_at desc);
create index if not exists social_posts_feed_idx on public.social_posts(created_at desc)
  where parent_id is null;
create index if not exists social_posts_root_idx on public.social_posts(root_id, created_at asc);
create unique index if not exists social_posts_session_uidx on public.social_posts(session_id)
  where session_id is not null;

create table if not exists public.social_post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists social_post_likes_post_idx on public.social_post_likes(post_id);

-- Migrate legacy workout tables when present (011 may be partial or skipped)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'workout_posts'
  ) then
    insert into public.social_posts (
      id, user_id, kind, body, session_id, routine_name, duration_seconds, exercise_count, set_count, created_at
    )
    select
      id, user_id, 'workout', null, session_id, routine_name, duration_seconds, exercise_count, set_count, created_at
    from public.workout_posts
    on conflict (id) do nothing;

    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'workout_post_likes'
    ) then
      insert into public.social_post_likes (id, post_id, user_id, created_at)
      select l.id, l.post_id, l.user_id, l.created_at
      from public.workout_post_likes l
      where exists (select 1 from public.social_posts p where p.id = l.post_id)
      on conflict (post_id, user_id) do nothing;

      drop policy if exists "Read likes on visible posts" on public.workout_post_likes;
      drop policy if exists "Manage own likes" on public.workout_post_likes;
    end if;

    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'workout_post_comments'
    ) then
      drop policy if exists "Read comments on visible posts" on public.workout_post_comments;
      drop policy if exists "Insert comments on visible posts" on public.workout_post_comments;
      drop policy if exists "Delete own comments" on public.workout_post_comments;
    end if;

    drop policy if exists "Read own and friends posts" on public.workout_posts;
    drop policy if exists "Insert own posts" on public.workout_posts;

    drop table if exists public.workout_post_comments cascade;
    drop table if exists public.workout_post_likes cascade;
    drop table if exists public.workout_posts cascade;
  end if;
end $$;

create or replace function public.can_view_social_post(target_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.social_posts p
    left join public.social_posts root on root.id = coalesce(p.root_id, p.id)
    where p.id = target_post_id
      and (
        p.user_id = auth.uid()
        or root.user_id = auth.uid()
        or public.is_friend_with(coalesce(root.user_id, p.user_id))
      )
  );
$$;

alter table public.social_posts enable row level security;
alter table public.social_post_likes enable row level security;

-- Idempotent policy setup (only on tables that exist above)
drop policy if exists "Read own and friends posts" on public.social_posts;
drop policy if exists "Insert own posts" on public.social_posts;
drop policy if exists "Read visible social posts" on public.social_posts;
drop policy if exists "Insert own social posts" on public.social_posts;
drop policy if exists "Delete own social posts" on public.social_posts;

drop policy if exists "Read likes on visible posts" on public.social_post_likes;
drop policy if exists "Insert own likes" on public.social_post_likes;
drop policy if exists "Delete own likes" on public.social_post_likes;

create policy "Read visible social posts" on public.social_posts
  for select using (public.can_view_social_post(id));

create policy "Insert own social posts" on public.social_posts
  for insert with check (
    auth.uid() = user_id
    and (
      parent_id is null
      or public.can_view_social_post(parent_id)
    )
  );

create policy "Delete own social posts" on public.social_posts
  for delete using (auth.uid() = user_id);

create policy "Read likes on visible posts" on public.social_post_likes
  for select using (public.can_view_social_post(post_id));

create policy "Insert own likes" on public.social_post_likes
  for insert with check (
    auth.uid() = user_id
    and public.can_view_social_post(post_id)
  );

create policy "Delete own likes" on public.social_post_likes
  for delete using (auth.uid() = user_id);

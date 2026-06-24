-- Social: friends, workout feed, likes, comments

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'accepted' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);

create table public.workout_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.gym_sessions(id) on delete cascade,
  routine_name text not null,
  duration_seconds int,
  exercise_count int not null default 0,
  set_count int not null default 0,
  created_at timestamptz not null default now(),
  unique (session_id)
);

create table public.workout_post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.workout_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table public.workout_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.workout_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index friendships_user_id_idx on public.friendships(user_id);
create index friendships_friend_id_idx on public.friendships(friend_id);
create index workout_posts_user_id_idx on public.workout_posts(user_id);
create index workout_posts_created_at_idx on public.workout_posts(created_at desc);
create index workout_post_likes_post_id_idx on public.workout_post_likes(post_id);
create index workout_post_comments_post_id_idx on public.workout_post_comments(post_id);

create or replace function public.is_friend_with(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friendships f
    where f.status = 'accepted'
      and (
        (f.user_id = auth.uid() and f.friend_id = target_user_id)
        or (f.friend_id = auth.uid() and f.user_id = target_user_id)
      )
  );
$$;

alter table public.friendships enable row level security;
alter table public.workout_posts enable row level security;
alter table public.workout_post_likes enable row level security;
alter table public.workout_post_comments enable row level security;

create policy "Users manage own friendships" on public.friendships
  for all using (auth.uid() = user_id or auth.uid() = friend_id)
  with check (auth.uid() = user_id);

create policy "Read own and friends posts" on public.workout_posts
  for select using (user_id = auth.uid() or public.is_friend_with(user_id));

create policy "Insert own posts" on public.workout_posts
  for insert with check (user_id = auth.uid());

create policy "Read likes on visible posts" on public.workout_post_likes
  for select using (
    exists (
      select 1 from public.workout_posts p
      where p.id = post_id
        and (p.user_id = auth.uid() or public.is_friend_with(p.user_id))
    )
  );

create policy "Manage own likes" on public.workout_post_likes
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Read comments on visible posts" on public.workout_post_comments
  for select using (
    exists (
      select 1 from public.workout_posts p
      where p.id = post_id
        and (p.user_id = auth.uid() or public.is_friend_with(p.user_id))
    )
  );

create policy "Insert comments on visible posts" on public.workout_post_comments
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.workout_posts p
      where p.id = post_id
        and (p.user_id = auth.uid() or public.is_friend_with(p.user_id))
    )
  );

create policy "Delete own comments" on public.workout_post_comments
  for delete using (auth.uid() = user_id);

-- Allow reading profiles of self and friends (for feed names / QR add)
drop policy if exists "Users manage own profile" on public.profiles;

create policy "Authenticated users read profiles" on public.profiles
  for select using (auth.uid() is not null);

create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

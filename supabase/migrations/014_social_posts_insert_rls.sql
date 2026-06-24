-- Fix social_posts insert RLS (split root posts vs replies)

drop policy if exists "Insert own social posts" on public.social_posts;
drop policy if exists "Insert own root posts" on public.social_posts;
drop policy if exists "Insert own replies" on public.social_posts;

create policy "Insert own root posts" on public.social_posts
  for insert with check (
    auth.uid() = user_id
    and parent_id is null
  );

create policy "Insert own replies" on public.social_posts
  for insert with check (
    auth.uid() = user_id
    and parent_id is not null
    and public.can_view_social_post(parent_id)
  );

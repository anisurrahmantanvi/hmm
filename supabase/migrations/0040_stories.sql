-- iConnecto 0040: Stories (24 hours, visible to the author and their friends). Idempotent.
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  image_url text,
  body text check (body is null or char_length(body) <= 300),
  bg text not null default '#0b0b0c' check (bg ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  constraint stories_has_content check (image_url is not null or (body is not null and char_length(btrim(body)) > 0)),
  constraint stories_image_own_storage check (image_url is null or image_url like '%/storage/v1/object/public/post-media/%')
);
create index if not exists stories_user_idx on public.stories (user_id, created_at desc);
create index if not exists stories_expires_idx on public.stories (expires_at);

create table if not exists public.story_views (
  story_id uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);
create index if not exists story_views_viewer_idx on public.story_views (viewer_id);

alter table public.stories enable row level security;
alter table public.story_views enable row level security;

-- can the signed-in user see this story?
create or replace function public.can_see_story(p_owner uuid, p_expires timestamptz) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    p_owner = auth.uid()
    or (p_expires > now() and public.are_friends(auth.uid(), p_owner) and not public.is_blocked_between(auth.uid(), p_owner))
  );
$$;

drop policy if exists stories_select on public.stories;
create policy stories_select on public.stories for select to authenticated using (public.can_see_story(user_id, expires_at));
drop policy if exists stories_insert on public.stories;
create policy stories_insert on public.stories for insert to authenticated with check (user_id = auth.uid() and expires_at <= now() + interval '24 hours 1 minute');
drop policy if exists stories_delete on public.stories;
create policy stories_delete on public.stories for delete to authenticated using (user_id = auth.uid());

drop policy if exists story_views_insert on public.story_views;
create policy story_views_insert on public.story_views for insert to authenticated
  with check (viewer_id = auth.uid() and exists (select 1 from public.stories s where s.id = story_id and s.user_id <> auth.uid()));
drop policy if exists story_views_select on public.story_views;
create policy story_views_select on public.story_views for select to authenticated
  using (viewer_id = auth.uid() or exists (select 1 from public.stories s where s.id = story_id and s.user_id = auth.uid()));

revoke all on public.stories, public.story_views from anon;
grant select, insert, delete on public.stories to authenticated;
grant select, insert on public.story_views to authenticated;

-- iConnecto 0041: Close Friends list + story audience. Idempotent.
create table if not exists public.close_friends (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  constraint close_friends_not_self check (user_id <> friend_id)
);
create index if not exists close_friends_friend_idx on public.close_friends (friend_id);
alter table public.close_friends enable row level security;
revoke all on public.close_friends from anon, authenticated;
grant select, insert, delete on public.close_friends to authenticated;

drop policy if exists close_friends_select on public.close_friends;
create policy close_friends_select on public.close_friends for select to authenticated using (user_id = auth.uid());
drop policy if exists close_friends_insert on public.close_friends;
create policy close_friends_insert on public.close_friends for insert to authenticated
  with check (user_id = auth.uid() and public.are_friends(auth.uid(), friend_id));
drop policy if exists close_friends_delete on public.close_friends;
create policy close_friends_delete on public.close_friends for delete to authenticated using (user_id = auth.uid());

alter table public.stories add column if not exists audience text not null default 'friends';
do $$ begin
  alter table public.stories add constraint stories_audience_chk check (audience in ('friends','close'));
exception when duplicate_object then null; end $$;

-- is the signed-in user on this owner's Close Friends list?
create or replace function public.in_close_friends(p_owner uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.close_friends where user_id = p_owner and friend_id = auth.uid());
$$;

drop policy if exists stories_select on public.stories;
create policy stories_select on public.stories for select to authenticated using (
  user_id = auth.uid()
  or (expires_at > now() and public.are_friends(auth.uid(), user_id) and not public.is_blocked_between(auth.uid(), user_id)
      and (audience = 'friends' or public.in_close_friends(user_id)))
);

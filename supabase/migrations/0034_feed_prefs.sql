-- iConnecto 0034: Hidden posts ("Not interested") and snoozed accounts. Each person only sees and changes their own rows. Idempotent.
create table if not exists public.hidden_posts (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create table if not exists public.snoozed_accounts (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  until timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_id),
  check (user_id <> target_id)
);
alter table public.hidden_posts enable row level security;
alter table public.snoozed_accounts enable row level security;
revoke all on public.hidden_posts, public.snoozed_accounts from anon, authenticated;
grant select, insert, delete on public.hidden_posts to authenticated;
grant select, insert, update, delete on public.snoozed_accounts to authenticated;

drop policy if exists hidden_posts_own on public.hidden_posts;
create policy hidden_posts_own on public.hidden_posts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists snoozed_accounts_own on public.snoozed_accounts;
create policy snoozed_accounts_own on public.snoozed_accounts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

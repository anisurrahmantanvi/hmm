-- iConnecto 0035: Favorites (accounts you want to see first). Each person only sees and changes their own list. Idempotent.
create table if not exists public.favorite_accounts (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, target_id),
  check (user_id <> target_id)
);
alter table public.favorite_accounts enable row level security;
revoke all on public.favorite_accounts from anon, authenticated;
grant select, insert, delete on public.favorite_accounts to authenticated;
drop policy if exists favorite_accounts_own on public.favorite_accounts;
create policy favorite_accounts_own on public.favorite_accounts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

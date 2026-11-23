-- Hmm 0043: sign-in log (IP address + browser/device), for security and abuse prevention. Idempotent.
-- Written ONLY by the log-login Edge Function (service role). A person can read their own rows; admins can read any
-- row through admin_user_logins (every look is written to admin_log). Rows older than 90 days are deleted.
create table if not exists public.login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists login_events_user_idx on public.login_events (user_id, created_at desc);
create index if not exists login_events_created_idx on public.login_events (created_at);
alter table public.login_events enable row level security;
revoke all on public.login_events from anon, authenticated;
grant select on public.login_events to authenticated;
drop policy if exists login_events_select_own on public.login_events;
create policy login_events_select_own on public.login_events for select to authenticated using (user_id = auth.uid());

-- keep 90 days only (runs on every new row; cheap thanks to the created_at index)
create or replace function public.login_events_prune() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.login_events where created_at < now() - interval '90 days';
  return null;
end $$;
drop trigger if exists login_events_prune_trg on public.login_events;
create trigger login_events_prune_trg after insert on public.login_events for each statement execute function public.login_events_prune();

create or replace function public.admin_user_logins(p_user uuid)
returns table (ip text, user_agent text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_app_admin() then raise exception 'Not allowed.'; end if;
  insert into public.admin_log (admin_id, action, target_type, target_id, note) values (auth.uid(), 'view_logins', 'user', p_user, null);
  return query select e.ip, e.user_agent, e.created_at from public.login_events e where e.user_id = p_user order by e.created_at desc limit 50;
end $$;
revoke execute on function public.admin_user_logins(uuid) from public, anon;
grant execute on function public.admin_user_logins(uuid) to authenticated;

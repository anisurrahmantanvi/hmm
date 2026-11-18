-- iConnecto 0038: daily usage counter for the AI assistant (Edge Function ai-chat). Idempotent.
create table if not exists public.ai_usage (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  count integer not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

-- Takes one request from today's allowance. Returns false when the daily limit is reached.
create or replace function public.ai_take_quota(p_user uuid, p_limit integer) returns boolean
language plpgsql security definer set search_path = public as $$
declare c integer;
begin
  insert into public.ai_usage (user_id, day, count) values (p_user, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update set count = public.ai_usage.count + 1 where public.ai_usage.count < p_limit
  returning count into c;
  return c is not null;
end $$;
revoke execute on function public.ai_take_quota(uuid, integer) from public, anon, authenticated;
grant execute on function public.ai_take_quota(uuid, integer) to service_role;

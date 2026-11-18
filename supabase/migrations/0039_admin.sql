-- iConnecto 0039: app admins and a small admin panel (stats, reports, users, removing content). Idempotent.
-- Admins are listed in public.app_admins. Nobody can read or write that table from the app; add an admin with the SQL editor / service role only.
create table if not exists public.app_admins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;
revoke all on public.app_admins from anon, authenticated;

-- Every admin action is recorded.
create table if not exists public.admin_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  note text,
  created_at timestamptz not null default now()
);
alter table public.admin_log enable row level security;
revoke all on public.admin_log from anon, authenticated;

create or replace function public.is_app_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid());
$$;
revoke execute on function public.is_app_admin() from public, anon;
grant execute on function public.is_app_admin() to authenticated;

create or replace function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_app_admin() then raise exception 'Not allowed.'; end if;
  return jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'new_users_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'posts', (select count(*) from public.posts),
    'comments', (select count(*) from public.comments),
    'reels', (select count(*) from public.reels),
    'pages', (select count(*) from public.pages),
    'communities', (select count(*) from public.communities),
    'open_reports', (select count(*) from public.reports where status = 'open')
  );
end $$;

create or replace function public.admin_reports(p_status text default 'open')
returns table (id uuid, created_at timestamptz, reason text, details text, target_type text, target_id uuid, status text, reporter text, target_label text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_app_admin() then raise exception 'Not allowed.'; end if;
  return query
  select r.id, r.created_at, r.reason, r.details, r.target_type, r.target_id, r.status,
    (select '@' || p.username from public.profiles p where p.id = r.reporter_id),
    case r.target_type
      when 'user' then (select '@' || p.username from public.profiles p where p.id = r.target_id)
      when 'post' then (select left(po.content, 140) from public.posts po where po.id = r.target_id)
      when 'comment' then (select left(c.content, 140) from public.comments c where c.id = r.target_id)
      when 'community' then (select cm.name from public.communities cm where cm.id = r.target_id)
    end
  from public.reports r
  where (p_status = 'all' or r.status = p_status)
  order by r.created_at desc
  limit 100;
end $$;

create or replace function public.admin_set_report(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_app_admin() then raise exception 'Not allowed.'; end if;
  if p_status not in ('open', 'resolved', 'dismissed') then raise exception 'Bad status.'; end if;
  update public.reports set status = p_status where id = p_id;
  insert into public.admin_log (admin_id, action, target_type, target_id, note) values (auth.uid(), 'report_' || p_status, 'report', p_id, null);
end $$;

create or replace function public.admin_users(p_q text default '')
returns table (id uuid, username text, display_name text, created_at timestamptz, posts_count integer, followers_count integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_app_admin() then raise exception 'Not allowed.'; end if;
  return query
  select p.id, p.username, p.display_name, p.created_at, p.posts_count, p.followers_count
  from public.profiles p
  where coalesce(p_q, '') = '' or p.username ilike '%' || p_q || '%' or p.display_name ilike '%' || p_q || '%'
  order by p.created_at desc
  limit 50;
end $$;

create or replace function public.admin_delete_content(p_type text, p_id uuid, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_app_admin() then raise exception 'Not allowed.'; end if;
  if p_type = 'post' then delete from public.posts where id = p_id;
  elsif p_type = 'comment' then delete from public.comments where id = p_id;
  else raise exception 'Bad type.'; end if;
  insert into public.admin_log (admin_id, action, target_type, target_id, note) values (auth.uid(), 'delete_' || p_type, p_type, p_id, left(p_note, 300));
end $$;

revoke execute on function public.admin_stats() from public, anon;
revoke execute on function public.admin_reports(text) from public, anon;
revoke execute on function public.admin_set_report(uuid, text) from public, anon;
revoke execute on function public.admin_users(text) from public, anon;
revoke execute on function public.admin_delete_content(text, uuid, text) from public, anon;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.admin_reports(text) to authenticated;
grant execute on function public.admin_set_report(uuid, text) to authenticated;
grant execute on function public.admin_users(text) to authenticated;
grant execute on function public.admin_delete_content(text, uuid, text) to authenticated;

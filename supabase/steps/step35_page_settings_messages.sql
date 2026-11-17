-- iConnecto 0037: Page settings, Page inbox (messages to a Page) and Page policies.
-- Needs 0027 (pages) and 0032 (who_can_comment). Idempotent.

-- ---------- Page settings ----------
alter table public.pages add column if not exists who_can_message text not null default 'everyone';
alter table public.pages drop constraint if exists pages_who_can_message_check;
alter table public.pages add constraint pages_who_can_message_check check (who_can_message in ('everyone','followers','nobody'));
alter table public.pages add column if not exists allow_comments boolean not null default true;
alter table public.pages add column if not exists contact_email text;
alter table public.pages drop constraint if exists pages_contact_email_check;
alter table public.pages add constraint pages_contact_email_check check (contact_email is null or (char_length(contact_email) <= 120 and contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'));
alter table public.pages add column if not exists privacy_policy_url text;
alter table public.pages drop constraint if exists pages_privacy_policy_url_check;
alter table public.pages add constraint pages_privacy_policy_url_check check (privacy_policy_url is null or (char_length(privacy_policy_url) <= 300 and privacy_policy_url ~* '^https?://'));
alter table public.pages add column if not exists policy_text text;
alter table public.pages drop constraint if exists pages_policy_text_check;
alter table public.pages add constraint pages_policy_text_check check (policy_text is null or char_length(policy_text) <= 6000);
grant update (who_can_message, allow_comments, contact_email, privacy_policy_url, policy_text) on public.pages to authenticated;

-- ---------- Comments: honour the Page's "allow comments" and keep the personal rule for non-page posts ----------
create or replace function public.comments_validate() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  par public.comments;
  owner uuid;
  rule text;
  pg uuid;
  pg_allow boolean;
begin
  if new.parent_id is not null then
    select * into par from public.comments where id = new.parent_id;
    if not found then raise exception 'parent comment not found'; end if;
    if par.post_id <> new.post_id then raise exception 'reply must be on the same post'; end if;
    if par.parent_id is not null then raise exception 'replies can only be one level deep'; end if;
  end if;

  select page_id into pg from public.page_posts where post_id = new.post_id;
  if pg is not null then
    select allow_comments into pg_allow from public.pages where id = pg;
    if coalesce(pg_allow, true) = false and not exists (select 1 from public.page_roles r where r.page_id = pg and r.user_id = new.author_id) then
      raise exception 'comments are turned off for this page';
    end if;
    return new;
  end if;

  select author_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.author_id then
    select coalesce(who_can_comment, 'everyone') into rule from public.profiles where id = owner;
    if rule = 'nobody' then
      raise exception 'comments are turned off for this post';
    elsif rule = 'followers' and not exists (
      select 1 from public.followers f where f.follower_id = new.author_id and f.following_id = owner
    ) then
      raise exception 'only friends can comment on this post';
    end if;
  end if;
  return new;
end $$;

-- ---------- Page inbox ----------
create table if not exists public.page_threads (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_message text not null default '',
  last_at timestamptz not null default now(),
  page_unread integer not null default 0,
  user_unread integer not null default 0,
  created_at timestamptz not null default now(),
  unique (page_id, user_id)
);
create index if not exists page_threads_page_idx on public.page_threads (page_id, last_at desc);
create index if not exists page_threads_user_idx on public.page_threads (user_id, last_at desc);

create table if not exists public.page_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.page_threads(id) on delete cascade,
  from_page boolean not null,
  sender_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists page_messages_thread_idx on public.page_messages (thread_id, created_at);

create or replace function public.can_see_page_thread(p_thread uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.page_threads t where t.id = p_thread and (t.user_id = auth.uid() or public.is_page_member(t.page_id)));
$$;
revoke execute on function public.can_see_page_thread(uuid) from public, anon;
grant execute on function public.can_see_page_thread(uuid) to authenticated;

alter table public.page_threads enable row level security;
alter table public.page_messages enable row level security;
revoke all on public.page_threads, public.page_messages from anon, authenticated;
grant select on public.page_threads, public.page_messages to authenticated;
drop policy if exists page_threads_select on public.page_threads;
create policy page_threads_select on public.page_threads for select to authenticated using (user_id = auth.uid() or public.is_page_member(page_id));
drop policy if exists page_messages_select on public.page_messages;
create policy page_messages_select on public.page_messages for select to authenticated using (public.can_see_page_thread(thread_id));

-- Send a message. A visitor starts or continues their own thread with the Page; a Page member answers a thread.
create or replace function public.send_page_message(p_page uuid, p_body text, p_thread uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  b text := btrim(coalesce(p_body, ''));
  t public.page_threads;
  pg public.pages;
  from_pg boolean;
begin
  if me is null then raise exception 'Sign in first.'; end if;
  if char_length(b) < 1 or char_length(b) > 2000 then raise exception 'Message must be 1-2000 characters.'; end if;

  if p_thread is not null then
    select * into t from public.page_threads where id = p_thread;
    if not found then raise exception 'Conversation not found.'; end if;
    if public.is_page_member(t.page_id) then from_pg := true;
    elsif t.user_id = me then from_pg := false;
    else raise exception 'Not allowed.'; end if;
  else
    select * into pg from public.pages where id = p_page;
    if not found then raise exception 'Page not found.'; end if;
    if public.is_page_member(pg.id) then raise exception 'Reply from the Page inbox.'; end if;
    if pg.who_can_message = 'nobody' then raise exception 'This Page is not accepting messages.'; end if;
    if pg.who_can_message = 'followers' and not exists (select 1 from public.page_follows f where f.page_id = pg.id and f.user_id = me) then
      raise exception 'Follow this Page to message it.';
    end if;
    if public.is_blocked_between(me, pg.owner_id) then raise exception 'You cannot message this Page.'; end if;
    insert into public.page_threads (page_id, user_id) values (pg.id, me)
    on conflict (page_id, user_id) do update set last_at = public.page_threads.last_at
    returning * into t;
    from_pg := false;
  end if;

  insert into public.page_messages (thread_id, from_page, sender_id, body) values (t.id, from_pg, me, b);
  update public.page_threads set last_message = left(b, 120), last_at = now(),
    page_unread = page_unread + case when from_pg then 0 else 1 end,
    user_unread = user_unread + case when from_pg then 1 else 0 end
  where id = t.id;
  return t.id;
end $$;

create or replace function public.mark_page_thread_read(p_thread uuid) returns void
language plpgsql security definer set search_path = public as $$
declare t public.page_threads;
begin
  select * into t from public.page_threads where id = p_thread;
  if not found then return; end if;
  if public.is_page_member(t.page_id) then update public.page_threads set page_unread = 0 where id = t.id;
  elsif t.user_id = auth.uid() then update public.page_threads set user_unread = 0 where id = t.id; end if;
end $$;

revoke execute on function public.send_page_message(uuid, text, uuid) from public, anon;
revoke execute on function public.mark_page_thread_read(uuid) from public, anon;
grant execute on function public.send_page_message(uuid, text, uuid) to authenticated;
grant execute on function public.mark_page_thread_read(uuid) to authenticated;

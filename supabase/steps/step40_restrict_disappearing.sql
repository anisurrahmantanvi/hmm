-- iConnecto 0042: Restricted accounts + disappearing messages. Idempotent.

-- ---------- Restricted accounts ----------
-- A restricted person's comments on my posts are visible only to them and to me; their messages to me land in Message requests.
create table if not exists public.restricted_accounts (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  restricted_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, restricted_id),
  constraint restricted_not_self check (user_id <> restricted_id)
);
create index if not exists restricted_accounts_target_idx on public.restricted_accounts (restricted_id);
alter table public.restricted_accounts enable row level security;
revoke all on public.restricted_accounts from anon, authenticated;
grant select, insert, delete on public.restricted_accounts to authenticated;
drop policy if exists restricted_select on public.restricted_accounts;
create policy restricted_select on public.restricted_accounts for select to authenticated using (user_id = auth.uid());
drop policy if exists restricted_insert on public.restricted_accounts;
create policy restricted_insert on public.restricted_accounts for insert to authenticated with check (user_id = auth.uid());
drop policy if exists restricted_delete on public.restricted_accounts;
create policy restricted_delete on public.restricted_accounts for delete to authenticated using (user_id = auth.uid());

-- Is this comment hidden from the signed-in user because its author is restricted by the post owner?
create or replace function public.comment_hidden_by_restrict(p_post uuid, p_author uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_author <> auth.uid()
     and exists (
       select 1 from public.posts p
       join public.restricted_accounts r on r.user_id = p.author_id and r.restricted_id = p_author
       where p.id = p_post and p.author_id <> auth.uid());
$$;

drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments for select to authenticated
  using (
    exists (select 1 from public.posts p where p.id = post_id)
    and not public.is_blocked_between(auth.uid(), author_id)
    and not public.comment_hidden_by_restrict(post_id, author_id)
  );

create or replace function public.my_message_requests() returns setof uuid
language sql stable security definer set search_path = public as $$
  select cm.chat_id
  from public.chat_members cm
  join public.chat_members o on o.chat_id = cm.chat_id and o.user_id <> cm.user_id
  where cm.user_id = auth.uid()
    and exists (select 1 from public.messages m where m.chat_id = cm.chat_id and m.sender_id = o.user_id)
    and not exists (select 1 from public.messages m where m.chat_id = cm.chat_id and m.sender_id = cm.user_id)
    and (not exists (select 1 from public.friendships f where f.user_id = cm.user_id and f.friend_id = o.user_id)
         or exists (select 1 from public.restricted_accounts r where r.user_id = cm.user_id and r.restricted_id = o.user_id))
    and not exists (select 1 from public.chat_request_accepts a where a.user_id = cm.user_id and a.chat_id = cm.chat_id);
$$;
revoke execute on function public.my_message_requests() from public, anon;
grant execute on function public.my_message_requests() to authenticated;

-- ---------- Disappearing messages ----------
alter table public.chats add column if not exists disappear_secs integer;
alter table public.messages add column if not exists expires_at timestamptz;
create index if not exists messages_expires_idx on public.messages (expires_at) where expires_at is not null;

create or replace function public.messages_set_expiry() returns trigger
language plpgsql security definer set search_path = public as $$
declare v integer;
begin
  select disappear_secs into v from public.chats where id = new.chat_id;
  if v is not null then new.expires_at := now() + make_interval(secs => v); end if;
  delete from public.messages where chat_id = new.chat_id and expires_at is not null and expires_at <= now();
  return new;
end $$;
drop trigger if exists messages_set_expiry_trg on public.messages;
create trigger messages_set_expiry_trg before insert on public.messages for each row execute function public.messages_set_expiry();

-- do not leak expiring text into the inbox preview
create or replace function public.messages_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.chats
     set last_message_at = new.created_at,
         last_message_preview = case when new.expires_at is not null then 'Disappearing message' else left(new.content, 140) end
   where id = new.chat_id;
  update public.chat_members set last_read_at = new.created_at
   where chat_id = new.chat_id and user_id = new.sender_id;
  return null;
end $$;

drop policy if exists messages_select_member on public.messages;
create policy messages_select_member on public.messages for select to authenticated
  using (public.is_chat_member(chat_id) and (expires_at is null or expires_at > now()));

create or replace function public.set_chat_disappear(p_chat uuid, p_secs integer) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_chat_member(p_chat) then raise exception 'not a member' using errcode = '42501'; end if;
  if p_secs is not null and p_secs not in (86400, 604800, 7776000) then raise exception 'invalid duration'; end if;
  update public.chats set disappear_secs = p_secs where id = p_chat;
end $$;
revoke execute on function public.set_chat_disappear(uuid, integer) from public, anon;
grant execute on function public.set_chat_disappear(uuid, integer) to authenticated;

create or replace function public.get_chat_disappear(p_chat uuid) returns integer
language sql stable security definer set search_path = public as $$
  select disappear_secs from public.chats where id = p_chat and public.is_chat_member(p_chat);
$$;
revoke execute on function public.get_chat_disappear(uuid) from public, anon;
grant execute on function public.get_chat_disappear(uuid) to authenticated;

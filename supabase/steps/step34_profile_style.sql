-- iConnecto 0036: Profile customization (theme, accent colour, background photo, layout, display options, profile music).
-- One row per person. Everyone signed in can read it (it is how a profile looks); only the owner can write it. Idempotent.
create table if not exists public.profile_style (
  user_id uuid primary key default auth.uid() references public.profiles(id) on delete cascade,
  theme text not null default 'default' check (theme in ('default','midnight','ocean','sunset','forest','rose','sand')),
  accent text check (accent is null or accent ~ '^#[0-9a-fA-F]{6}$'),
  background_url text check (background_url is null or background_url ~ '^https://'),
  layout text not null default 'classic' check (layout in ('classic','about_last')),
  show_about boolean not null default true,
  show_reels boolean not null default true,
  music_url text check (music_url is null or music_url ~ '^https://'),
  music_title text check (music_title is null or char_length(music_title) <= 80),
  updated_at timestamptz not null default now()
);
alter table public.profile_style enable row level security;
revoke all on public.profile_style from anon, authenticated;
grant select, insert, update, delete on public.profile_style to authenticated;

drop policy if exists profile_style_select on public.profile_style;
create policy profile_style_select on public.profile_style for select to authenticated using (true);
drop policy if exists profile_style_insert on public.profile_style;
create policy profile_style_insert on public.profile_style for insert to authenticated with check (user_id = auth.uid());
drop policy if exists profile_style_update on public.profile_style;
create policy profile_style_update on public.profile_style for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists profile_style_delete on public.profile_style;
create policy profile_style_delete on public.profile_style for delete to authenticated using (user_id = auth.uid());

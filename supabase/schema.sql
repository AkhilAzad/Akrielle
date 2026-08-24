-- ===========================================================================
-- AXL — Supabase schema (accounts: profile, preferences, history, media)
-- ===========================================================================
-- Run this ONCE in your Supabase project:
--   Dashboard → SQL Editor → New query → paste this file → Run.
--
-- It is idempotent — safe to re-run. It creates the tables the app's account
-- features use — `analyses` (saved scans), `profiles` (profile + preferences),
-- `portfolio_items` (private gallery) — plus a private Storage bucket, and
-- locks everything down with row-level security so a signed-in user can only
-- ever read or write their OWN rows and their OWN files.
--
-- Images: stored ONLY in the private `user-media` bucket, and ONLY for
-- signed-in users who have turned on "save photos". Anonymous scanning stores
-- nothing at all. (See lib/supabase/db.ts + SUPABASE_SETUP.md.)
-- ===========================================================================


-- 1. Table -------------------------------------------------------------------
-- `id`           surrogate key, generated server-side.
-- `user_id`      the owner. Defaults to auth.uid() so the client never has to
--                send it; the INSERT policy below also enforces it. Cascades
--                on user deletion so history is cleaned up automatically.
-- `created_at`   set server-side; the app orders history by this, newest first.
-- `beauty_score` the rounded 0–100 score (kept as a column for cheap sorting
--                / display without parsing the JSON).
-- `result`       the full AnalysisResult object as JSONB.
create table if not exists public.analyses (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null default auth.uid()
                             references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  beauty_score integer     not null,
  result       jsonb       not null
);

-- Index for the "my history, newest first" query the account page runs.
create index if not exists analyses_user_created_idx
  on public.analyses (user_id, created_at desc);


-- 2. Privileges --------------------------------------------------------------
-- Signed-in users (the `authenticated` role) may operate on the table; access
-- is then narrowed to their own rows by the RLS policies below. The `anon`
-- role is intentionally granted nothing — anonymous visitors never touch this
-- table (scanning works fully without an account).
grant select, insert, delete on public.analyses to authenticated;


-- 3. Row-level security ------------------------------------------------------
alter table public.analyses enable row level security;

-- Read only your own analyses.
drop policy if exists "Users can read own analyses" on public.analyses;
create policy "Users can read own analyses"
  on public.analyses
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Insert only rows that belong to you. WITH CHECK guards the column default
-- so a client cannot write a row under someone else's id.
drop policy if exists "Users can insert own analyses" on public.analyses;
create policy "Users can insert own analyses"
  on public.analyses
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Delete only your own analyses.
drop policy if exists "Users can delete own analyses" on public.analyses;
create policy "Users can delete own analyses"
  on public.analyses
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Opt-in scan photo. NULL for everyone by default; populated with a Storage
-- path ONLY when a signed-in user has turned on "save photos" (see section 7
-- + lib/supabase/db.ts). The default behaviour remains: the photo is not kept.
alter table public.analyses
  add column if not exists image_path text;


-- 4. Profiles ----------------------------------------------------------------
-- One row per user holding their PERMANENT profile + preferences. Mirrors the
-- app's ProfileData shape: small JSONB sub-objects the client reads/writes as a
-- unit, plus a display name + date of birth (previously kept only in local
-- storage) and an optional avatar image path in Storage. Anonymous visitors
-- never create a row here — a profile row exists only once you sign in.
create table if not exists public.profiles (
  user_id      uuid        primary key default auth.uid()
                             references auth.users (id) on delete cascade,
  display_name text,
  dob          jsonb,
  personal     jsonb       not null default '{}'::jsonb,
  appearance   jsonb       not null default '{}'::jsonb,
  beauty       jsonb       not null default '{}'::jsonb,
  app          jsonb       not null default '{}'::jsonb,
  avatar_path  text,
  updated_at   timestamptz not null default now()
);

grant select, insert, update, delete on public.profiles to authenticated;

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = user_id);

-- Insert only your own row. WITH CHECK guards the auth.uid() column default so
-- a client can never create a profile under someone else's id.
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = user_id);

-- Update only your own row (used by the upsert path).
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete to authenticated
  using (auth.uid() = user_id);


-- 5. Portfolio items ---------------------------------------------------------
-- A capped, private gallery. Each row points at an object in the `user-media`
-- Storage bucket — the image bytes live in Storage, not in the database.
create table if not exists public.portfolio_items (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null default auth.uid()
                             references auth.users (id) on delete cascade,
  storage_path text        not null,
  name         text,
  added_at     timestamptz not null default now()
);

-- Index for the "my portfolio, newest first" query.
create index if not exists portfolio_items_user_added_idx
  on public.portfolio_items (user_id, added_at desc);

grant select, insert, delete on public.portfolio_items to authenticated;

alter table public.portfolio_items enable row level security;

drop policy if exists "Users can read own portfolio" on public.portfolio_items;
create policy "Users can read own portfolio"
  on public.portfolio_items for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own portfolio" on public.portfolio_items;
create policy "Users can insert own portfolio"
  on public.portfolio_items for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own portfolio" on public.portfolio_items;
create policy "Users can delete own portfolio"
  on public.portfolio_items for delete to authenticated
  using (auth.uid() = user_id);


-- 6. Storage bucket + policies -----------------------------------------------
-- A single PRIVATE bucket holds every user image (avatars, opt-in saved scans,
-- portfolio photos). Objects are namespaced by user id as the FIRST path
-- segment, e.g.  <user-id>/portfolio/<item>.jpg . The policies below key off
-- that first segment so a user can only ever touch files inside their own
-- folder. Images are served through short-lived signed URLs, never public
-- links (the bucket is not public).
insert into storage.buckets (id, name, public)
values ('user-media', 'user-media', false)
on conflict (id) do nothing;

drop policy if exists "Users can read own media" on storage.objects;
create policy "Users can read own media"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'user-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can upload own media" on storage.objects;
create policy "Users can upload own media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'user-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update own media" on storage.objects;
create policy "Users can update own media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'user-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'user-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own media" on storage.objects;
create policy "Users can delete own media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'user-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ===========================================================================
-- Done. Next: copy your Project URL + anon public key into .env.local
-- (see SUPABASE_SETUP.md), then enable Email and Google auth providers.
-- ===========================================================================

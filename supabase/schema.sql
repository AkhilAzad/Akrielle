-- ===========================================================================
-- Alkline — Supabase schema for saved beauty analyses
-- ===========================================================================
-- Run this ONCE in your Supabase project:
--   Dashboard → SQL Editor → New query → paste this file → Run.
--
-- It is idempotent — safe to re-run. It creates the `analyses` table used by
-- the app's history feature and locks it down with row-level security so a
-- signed-in user can only ever read, create, or delete their OWN rows.
--
-- What is stored: the analysis result (JSON) + the rounded beauty score.
-- What is NEVER stored: the uploaded photo. (See lib/supabase/db.ts.)
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

-- ===========================================================================
-- Done. Next: copy your Project URL + anon public key into .env.local
-- (see SUPABASE_SETUP.md), then enable Email and Google auth providers.
-- ===========================================================================

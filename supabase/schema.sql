-- ===========================================================================
-- Tagid – database schema
-- Run this in the Supabase SQL editor (or via the CLI) before using the app.
-- It is idempotent-ish: safe to re-run during development.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUM types
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('teacher', 'student');
exception when duplicate_object then null; end $$;

do $$ begin
  create type mission_type as enum ('single_choice', 'multi_choice', 'text', 'number');
exception when duplicate_object then null; end $$;

do $$ begin
  create type session_status as enum ('draft', 'live', 'ended');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles: 1:1 with auth.users, holds role + name
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        user_role not null default 'teacher',
  created_at  timestamptz not null default now()
);

-- Create a profile row automatically whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'teacher')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- activities: a learning unit owned by a teacher
-- ---------------------------------------------------------------------------
create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  description text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- missions: ordered tasks within an activity
-- ---------------------------------------------------------------------------
create table if not exists public.missions (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  position    int  not null default 0,
  title       text not null,
  prompt      text not null default '',
  type        mission_type not null default 'single_choice',
  options     jsonb,            -- array of strings for choice types
  answer      text,             -- correct answer (csv for multi_choice)
  points      int  not null default 10,
  created_at  timestamptz not null default now()
);
create index if not exists missions_activity_idx on public.missions (activity_id, position);

-- ---------------------------------------------------------------------------
-- nfc_tags: physical tags bound to a mission
-- ---------------------------------------------------------------------------
create table if not exists public.nfc_tags (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles (id) on delete cascade,
  code        text not null unique,           -- short code in the tag URL
  label       text,
  mission_id  uuid references public.missions (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- sessions: a live run of an activity for a class
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities (id) on delete cascade,
  teacher_id  uuid not null references public.profiles (id) on delete cascade,
  join_code   text not null unique,
  status      session_status not null default 'draft',
  started_at  timestamptz,
  ended_at    timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- participants: students who joined a session (no auth account required)
-- ---------------------------------------------------------------------------
create table if not exists public.participants (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions (id) on delete cascade,
  display_name  text not null,
  score         int  not null default 0,
  joined_at     timestamptz not null default now()
);
create index if not exists participants_session_idx on public.participants (session_id);

-- ---------------------------------------------------------------------------
-- submissions: an answer to a mission within a session
-- ---------------------------------------------------------------------------
create table if not exists public.submissions (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.sessions (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  mission_id     uuid not null references public.missions (id) on delete cascade,
  answer         text not null default '',
  is_correct     boolean not null default false,
  points_awarded int not null default 0,
  created_at     timestamptz not null default now(),
  unique (participant_id, mission_id)   -- one submission per mission per student
);
create index if not exists submissions_session_idx on public.submissions (session_id);

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.profiles     enable row level security;
alter table public.activities   enable row level security;
alter table public.missions     enable row level security;
alter table public.nfc_tags     enable row level security;
alter table public.sessions     enable row level security;
alter table public.participants enable row level security;
alter table public.submissions  enable row level security;

-- profiles: a user can read/update their own profile
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id);

-- activities: owned by teacher
drop policy if exists "activities owner all" on public.activities;
create policy "activities owner all" on public.activities
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

-- missions: teacher who owns the parent activity
drop policy if exists "missions owner all" on public.missions;
create policy "missions owner all" on public.missions
  for all using (
    exists (select 1 from public.activities a
            where a.id = missions.activity_id and a.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from public.activities a
            where a.id = missions.activity_id and a.teacher_id = auth.uid())
  );

-- nfc_tags: owned by teacher
drop policy if exists "tags owner all" on public.nfc_tags;
create policy "tags owner all" on public.nfc_tags
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

-- sessions: owned by teacher
drop policy if exists "sessions owner all" on public.sessions;
create policy "sessions owner all" on public.sessions
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

-- participants & submissions are managed server-side via the service role
-- (student flow has no auth user). The service role bypasses RLS, and the
-- teacher can read them through their session. Teachers may read participants
-- and submissions of their own sessions:
drop policy if exists "participants teacher read" on public.participants;
create policy "participants teacher read" on public.participants
  for select using (
    exists (select 1 from public.sessions s
            where s.id = participants.session_id and s.teacher_id = auth.uid())
  );

drop policy if exists "submissions teacher read" on public.submissions;
create policy "submissions teacher read" on public.submissions
  for select using (
    exists (select 1 from public.sessions s
            where s.id = submissions.session_id and s.teacher_id = auth.uid())
  );

-- ===========================================================================
-- Helper: increment a participant's score atomically
-- ===========================================================================
create or replace function public.add_participant_score(p_participant uuid, p_points int)
returns void
language sql
security definer set search_path = public
as $$
  update public.participants
     set score = score + p_points
   where id = p_participant;
$$;

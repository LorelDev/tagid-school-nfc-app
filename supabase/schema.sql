-- ===========================================================================
-- תגיד (Tagid) – full database schema
-- Run in the Supabase SQL editor (or psql) before using the app.
-- Safe to re-run during development.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUM types
-- ---------------------------------------------------------------------------
do $$ begin create type user_role as enum
  ('super_admin','school_admin','teacher','student'); exception when duplicate_object then null; end $$;

do $$ begin create type tag_status as enum
  ('unassigned','assigned','disabled'); exception when duplicate_object then null; end $$;

do $$ begin create type activity_mode as enum
  ('station_race','treasure_hunt','social','active_lesson','escape_room','hackathon'); exception when duplicate_object then null; end $$;

do $$ begin create type activity_status as enum
  ('draft','published','archived'); exception when duplicate_object then null; end $$;

do $$ begin create type unlock_type as enum
  ('open','dependency'); exception when duplicate_object then null; end $$;

do $$ begin create type mission_type as enum
  ('multiple_choice','open_text','yes_no','rating','group_reflection','final_answer','knowledge_piece'); exception when duplicate_object then null; end $$;

do $$ begin create type session_status as enum
  ('draft','active','paused','completed'); exception when duplicate_object then null; end $$;

do $$ begin create type progress_status as enum
  ('locked','unlocked','in_progress','completed'); exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- schools
-- ---------------------------------------------------------------------------
create table if not exists public.schools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  school_id   uuid references public.schools (id) on delete set null,
  full_name   text,
  email       text,
  role        user_role not null default 'teacher',
  created_at  timestamptz not null default now()
);

-- Auto-create a profile on signup. The very first user becomes super_admin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role user_role;
  v_count int;
begin
  select count(*) into v_count from public.profiles;
  if v_count = 0 then
    v_role := 'super_admin';
  else
    v_role := coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'teacher');
  end if;

  insert into public.profiles (id, full_name, email, role, school_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    v_role,
    nullif(new.raw_user_meta_data ->> 'school_id','')::uuid
  ) on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- classes
-- ---------------------------------------------------------------------------
create table if not exists public.classes (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools (id) on delete cascade,
  name        text not null,
  grade       text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- tags (physical NFC tags)
-- ---------------------------------------------------------------------------
create table if not exists public.tags (
  id                   uuid primary key default gen_random_uuid(),
  school_id            uuid not null references public.schools (id) on delete cascade,
  tag_code             text not null unique,
  physical_label       text,
  location_name        text,
  location_description  text,
  status               tag_status not null default 'unassigned',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists tags_school_idx on public.tags (school_id);

-- ---------------------------------------------------------------------------
-- activities
-- ---------------------------------------------------------------------------
create table if not exists public.activities (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references public.schools (id) on delete cascade,
  created_by        uuid references public.profiles (id) on delete set null,
  title             text not null,
  description       text,
  grade_level       text,
  subject           text,
  mode              activity_mode not null default 'station_race',
  status            activity_status not null default 'draft',
  estimated_minutes int default 45,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists activities_school_idx on public.activities (school_id);

-- ---------------------------------------------------------------------------
-- stations
-- ---------------------------------------------------------------------------
create table if not exists public.stations (
  id                   uuid primary key default gen_random_uuid(),
  activity_id          uuid not null references public.activities (id) on delete cascade,
  tag_id               uuid references public.tags (id) on delete set null,
  title                text not null,
  location_hint        text,
  order_index          int not null default 0,
  unlock_type          unlock_type not null default 'open',
  depends_on_station_id uuid references public.stations (id) on delete set null,
  points               int not null default 10,
  created_at           timestamptz not null default now()
);
create index if not exists stations_activity_idx on public.stations (activity_id, order_index);

-- ---------------------------------------------------------------------------
-- missions
-- ---------------------------------------------------------------------------
create table if not exists public.missions (
  id                        uuid primary key default gen_random_uuid(),
  station_id                uuid not null references public.stations (id) on delete cascade,
  mission_type              mission_type not null default 'open_text',
  prompt                    text not null default '',
  helper_text               text,
  answer_options            jsonb,        -- array of strings
  correct_answer            text,
  requires_teacher_approval boolean not null default false,
  points                    int not null default 10,
  knowledge_piece           text,
  order_index               int not null default 0,
  created_at                timestamptz not null default now()
);
create index if not exists missions_station_idx on public.missions (station_id, order_index);

-- ---------------------------------------------------------------------------
-- sessions
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
  id           uuid primary key default gen_random_uuid(),
  activity_id  uuid not null references public.activities (id) on delete cascade,
  school_id    uuid not null references public.schools (id) on delete cascade,
  teacher_id   uuid references public.profiles (id) on delete set null,
  class_id     uuid references public.classes (id) on delete set null,
  session_code text not null unique,
  status       session_status not null default 'draft',
  started_at   timestamptz,
  paused_at    timestamptz,
  ended_at     timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists sessions_code_idx on public.sessions (session_code);

-- ---------------------------------------------------------------------------
-- groups (teams)
-- ---------------------------------------------------------------------------
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions (id) on delete cascade,
  name        text not null,
  color       text not null default '#0ea5b7',
  score       int  not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists groups_session_idx on public.groups (session_id);

-- ---------------------------------------------------------------------------
-- participants (pseudonymous students)
-- ---------------------------------------------------------------------------
create table if not exists public.participants (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references public.sessions (id) on delete cascade,
  group_id           uuid references public.groups (id) on delete set null,
  display_name       text not null,
  device_fingerprint text,
  joined_at          timestamptz not null default now(),
  last_seen_at       timestamptz not null default now()
);
create index if not exists participants_session_idx on public.participants (session_id);

-- ---------------------------------------------------------------------------
-- station_progress (per group, per station)
-- ---------------------------------------------------------------------------
create table if not exists public.station_progress (
  id                        uuid primary key default gen_random_uuid(),
  session_id                uuid not null references public.sessions (id) on delete cascade,
  group_id                  uuid not null references public.groups (id) on delete cascade,
  station_id                uuid not null references public.stations (id) on delete cascade,
  status                    progress_status not null default 'unlocked',
  unlocked_at               timestamptz,
  started_at                timestamptz,
  completed_at              timestamptz,
  completed_by_participant_id uuid references public.participants (id) on delete set null,
  unique (group_id, station_id)
);
create index if not exists station_progress_session_idx on public.station_progress (session_id);

-- ---------------------------------------------------------------------------
-- responses
-- ---------------------------------------------------------------------------
create table if not exists public.responses (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.sessions (id) on delete cascade,
  group_id         uuid not null references public.groups (id) on delete cascade,
  participant_id   uuid references public.participants (id) on delete set null,
  station_id       uuid not null references public.stations (id) on delete cascade,
  mission_id       uuid not null references public.missions (id) on delete cascade,
  answer_text      text,
  answer_json      jsonb,
  is_correct       boolean not null default false,
  points_awarded   int not null default 0,
  teacher_approved boolean,
  created_at       timestamptz not null default now(),
  unique (group_id, mission_id)
);
create index if not exists responses_session_idx on public.responses (session_id);

-- ---------------------------------------------------------------------------
-- events (timeline)
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.sessions (id) on delete cascade,
  group_id       uuid references public.groups (id) on delete set null,
  participant_id uuid references public.participants (id) on delete set null,
  tag_id         uuid references public.tags (id) on delete set null,
  station_id     uuid references public.stations (id) on delete set null,
  event_type     text not null,
  event_payload  jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists events_session_idx on public.events (session_id, created_at);

-- ---------------------------------------------------------------------------
-- activity_templates
-- ---------------------------------------------------------------------------
create table if not exists public.activity_templates (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid references public.schools (id) on delete cascade,
  title         text not null,
  description   text,
  mode          activity_mode not null default 'station_race',
  template_json jsonb not null default '{}',
  is_global     boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- consents (minimal privacy record)
-- ---------------------------------------------------------------------------
create table if not exists public.consents (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid references public.schools (id) on delete cascade,
  participant_id uuid references public.participants (id) on delete set null,
  consent_type   text not null,
  status         text not null default 'granted',
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- helper: atomically add to a group's score
-- ---------------------------------------------------------------------------
create or replace function public.add_group_score(p_group uuid, p_points int)
returns void language sql security definer set search_path = public as $$
  update public.groups set score = score + p_points where id = p_group;
$$;

-- ===========================================================================
-- Row Level Security
-- Student-facing writes happen server-side via the service role (bypasses RLS).
-- These policies cover the authenticated teacher/admin dashboard.
-- ===========================================================================
alter table public.schools            enable row level security;
alter table public.profiles           enable row level security;
alter table public.classes            enable row level security;
alter table public.tags               enable row level security;
alter table public.activities         enable row level security;
alter table public.stations           enable row level security;
alter table public.missions           enable row level security;
alter table public.sessions           enable row level security;
alter table public.groups             enable row level security;
alter table public.participants       enable row level security;
alter table public.station_progress   enable row level security;
alter table public.responses          enable row level security;
alter table public.events             enable row level security;
alter table public.activity_templates enable row level security;
alter table public.consents           enable row level security;

-- helper: current user's school + role
create or replace function public.my_school() returns uuid
language sql stable security definer set search_path = public as $$
  select school_id from public.profiles where id = auth.uid();
$$;
create or replace function public.my_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- profiles: read self + same-school admins read their school
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select
  using (id = auth.uid() or school_id = public.my_school() or public.my_role() = 'super_admin');
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update using (id = auth.uid());

-- generic school-scoped policy applied to most tables
do $$
declare t text;
begin
  foreach t in array array['schools','classes','tags','activities','sessions','activity_templates','consents']
  loop
    execute format('drop policy if exists "%s school all" on public.%I;', t, t);
  end loop;
end $$;

drop policy if exists "schools read" on public.schools;
create policy "schools read" on public.schools for select
  using (id = public.my_school() or public.my_role() = 'super_admin');
drop policy if exists "schools write" on public.schools;
create policy "schools write" on public.schools for all
  using (public.my_role() = 'super_admin') with check (public.my_role() = 'super_admin');

create policy "classes school all" on public.classes for all
  using (school_id = public.my_school()) with check (school_id = public.my_school());
create policy "tags school all" on public.tags for all
  using (school_id = public.my_school()) with check (school_id = public.my_school());
create policy "activities school all" on public.activities for all
  using (school_id = public.my_school()) with check (school_id = public.my_school());
create policy "sessions school all" on public.sessions for all
  using (school_id = public.my_school()) with check (school_id = public.my_school());
create policy "templates school all" on public.activity_templates for all
  using (is_global or school_id = public.my_school())
  with check (school_id = public.my_school());
create policy "consents school all" on public.consents for all
  using (school_id = public.my_school()) with check (school_id = public.my_school());

-- stations / missions: via parent activity's school
create policy "stations via activity" on public.stations for all
  using (exists (select 1 from public.activities a where a.id = stations.activity_id and a.school_id = public.my_school()))
  with check (exists (select 1 from public.activities a where a.id = stations.activity_id and a.school_id = public.my_school()));
create policy "missions via station" on public.missions for all
  using (exists (select 1 from public.stations s join public.activities a on a.id = s.activity_id
                 where s.id = missions.station_id and a.school_id = public.my_school()))
  with check (exists (select 1 from public.stations s join public.activities a on a.id = s.activity_id
                 where s.id = missions.station_id and a.school_id = public.my_school()));

-- groups / participants / progress / responses / events: teacher reads via session school
do $$
declare t text;
begin
  foreach t in array array['groups','participants','station_progress','responses','events']
  loop
    execute format('drop policy if exists "%s via session" on public.%I;', t, t);
    execute format($f$create policy "%1$s via session" on public.%1$I for select
      using (exists (select 1 from public.sessions s where s.id = %1$I.session_id and s.school_id = public.my_school()));$f$, t);
  end loop;
end $$;

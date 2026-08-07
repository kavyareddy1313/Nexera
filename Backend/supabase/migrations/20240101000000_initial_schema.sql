-- ═══════════════════════════════════════════════════════════════════════════
-- Nexera Database Schema — Initial Migration
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Profiles (mirrors auth.users) ───────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  avatar_url    text,
  status        text default 'offline' check (status in ('online', 'offline', 'away', 'dnd')),
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view any profile"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ─── Workspaces ───────────────────────────────────────────────────────────────
create table if not exists public.workspaces (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text unique not null,
  owner_id      uuid references public.profiles(id) on delete cascade not null,
  created_at    timestamptz default now() not null
);

alter table public.workspaces enable row level security;

-- ─── Chat Rooms ───────────────────────────────────────────────────────────────
create table if not exists public.chat_rooms (
  id                uuid primary key default uuid_generate_v4(),
  workspace_id      uuid references public.workspaces(id) on delete cascade,
  name              text,
  type              text default 'direct' check (type in ('direct', 'group', 'channel')),
  last_message_at   timestamptz default now(),
  created_at        timestamptz default now() not null
);

alter table public.chat_rooms enable row level security;

-- ─── Chat Room Members ────────────────────────────────────────────────────────
create table if not exists public.chat_room_members (
  room_id     uuid references public.chat_rooms(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  joined_at   timestamptz default now(),
  primary key (room_id, user_id)
);

alter table public.chat_room_members enable row level security;

create policy "Members can see rooms they belong to"
  on public.chat_rooms for select
  using (exists (
    select 1 from public.chat_room_members
    where room_id = id and user_id = auth.uid()
  ));

-- ─── Messages ─────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id           uuid primary key default uuid_generate_v4(),
  room_id      uuid references public.chat_rooms(id) on delete cascade not null,
  sender_id    uuid references public.profiles(id) on delete set null,
  content      text not null,
  type         text default 'text' check (type in ('text', 'image', 'file')),
  edited_at    timestamptz,
  created_at   timestamptz default now() not null
);

alter table public.messages enable row level security;

create policy "Room members can read messages"
  on public.messages for select
  using (exists (
    select 1 from public.chat_room_members
    where room_id = messages.room_id and user_id = auth.uid()
  ));

create policy "Room members can insert messages"
  on public.messages for insert
  with check (sender_id = auth.uid());

create policy "Sender can delete own messages"
  on public.messages for delete
  using (sender_id = auth.uid());

-- ─── Meetings ─────────────────────────────────────────────────────────────────
create table if not exists public.meetings (
  id                uuid primary key default uuid_generate_v4(),
  title             text not null,
  created_by        uuid references public.profiles(id) on delete set null,
  scheduled_at      timestamptz not null,
  duration_minutes  integer default 60 check (duration_minutes > 0),
  recording_url     text,
  created_at        timestamptz default now() not null
);

alter table public.meetings enable row level security;

-- ─── Meeting Participants ─────────────────────────────────────────────────────
create table if not exists public.meeting_participants (
  meeting_id    uuid references public.meetings(id) on delete cascade,
  user_id       uuid references public.profiles(id) on delete cascade,
  primary key (meeting_id, user_id)
);

alter table public.meeting_participants enable row level security;

create policy "Participants can view their meetings"
  on public.meetings for select
  using (exists (
    select 1 from public.meeting_participants
    where meeting_id = id and user_id = auth.uid()
  ));

-- ─── Whiteboards ──────────────────────────────────────────────────────────────
create table if not exists public.whiteboards (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  workspace_id   uuid references public.workspaces(id) on delete cascade,
  created_by     uuid references public.profiles(id) on delete set null,
  snapshot       jsonb default '{}'::jsonb,
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);

alter table public.whiteboards enable row level security;

create policy "Workspace members can view whiteboards"
  on public.whiteboards for select using (true);

create policy "Creator can update whiteboard"
  on public.whiteboards for update using (created_by = auth.uid());

create policy "Creator can delete whiteboard"
  on public.whiteboards for delete using (created_by = auth.uid());

-- ─── Triggers: auto-update updated_at ─────────────────────────────────────────
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger whiteboards_updated_at before update on public.whiteboards
  for each row execute function public.update_updated_at();

-- ─── Trigger: create profile on signup ────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

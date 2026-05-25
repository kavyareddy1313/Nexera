-- ═══════════════════════════════════════════════════════════════════════════
-- Nexera Seed Data — Development Only
-- Run: supabase db reset (resets + re-seeds)
-- ═══════════════════════════════════════════════════════════════════════════

-- Note: Auth users must be created via Supabase dashboard or Admin API.
-- The trigger handle_new_user() will auto-create profiles.
-- This seed file populates workspace + chat data assuming users exist.

-- ─── Demo Workspace ───────────────────────────────────────────────────────────
insert into public.workspaces (id, name, slug, owner_id)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Nexera Demo Workspace',
  'nexera-demo',
  id
from public.profiles
limit 1
on conflict (slug) do nothing;

-- ─── General channel ──────────────────────────────────────────────────────────
insert into public.chat_rooms (id, workspace_id, name, type)
values (
  '00000000-0000-0000-0000-000000000010'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'General',
  'channel'
)
on conflict (id) do nothing;

-- ─── Add first user to General channel ────────────────────────────────────────
insert into public.chat_room_members (room_id, user_id)
select
  '00000000-0000-0000-0000-000000000010'::uuid,
  id
from public.profiles
limit 1
on conflict do nothing;

-- Migration 003: Add Profile Colors
-- Adds avatar_color_bg, avatar_color_text, and initials to the public.profiles table

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_color_bg TEXT,
  ADD COLUMN IF NOT EXISTS avatar_color_text TEXT,
  ADD COLUMN IF NOT EXISTS initials TEXT;

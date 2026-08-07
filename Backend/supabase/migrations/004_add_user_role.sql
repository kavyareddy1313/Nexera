-- Add role column to public.Users
ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'student' CHECK (role IN ('student', 'instructor')) NOT NULL;

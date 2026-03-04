-- PROFILES: Add more missing columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- TASKS: Add slug column
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS slug text;

-- FEEDBACK COMMENTS: Add is_hidden column
ALTER TABLE public.feedback_comments ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;

-- STAGES: Add weight column
ALTER TABLE public.stages ADD COLUMN IF NOT EXISTS weight numeric(5,2) DEFAULT 1;

-- Add username and social_links columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Add constraint for username format
ALTER TABLE public.profiles ADD CONSTRAINT username_format CHECK (username ~ '^[a-z0-9\-]{3,30}$');

-- RLS policy: anyone can view profile by username (public profile)
CREATE POLICY "Public can view profiles by username"
ON public.profiles
FOR SELECT
USING (username IS NOT NULL);

-- Set default username for admin
UPDATE public.profiles SET username = 'khanhngh' WHERE email = 'khanhngh.ueh@gmail.com';

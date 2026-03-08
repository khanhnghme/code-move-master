
-- Add project_limit and storage_limit_mb to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS project_limit integer DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS storage_limit_mb integer DEFAULT NULL;

-- Create is_moderator function for future use
CREATE OR REPLACE FUNCTION public.is_moderator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'leader')
  )
$$;

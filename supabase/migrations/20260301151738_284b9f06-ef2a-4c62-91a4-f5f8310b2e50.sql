
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended_until timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS suspension_reason text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS suspended_by uuid DEFAULT NULL;

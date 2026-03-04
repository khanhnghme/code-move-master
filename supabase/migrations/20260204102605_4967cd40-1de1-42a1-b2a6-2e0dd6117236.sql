-- PROFILES: Add phone column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- FEEDBACKS: Add is_hidden column
ALTER TABLE public.feedbacks ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;

-- FEEDBACK COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.feedback_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    feedback_id uuid NOT NULL REFERENCES public.feedbacks(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
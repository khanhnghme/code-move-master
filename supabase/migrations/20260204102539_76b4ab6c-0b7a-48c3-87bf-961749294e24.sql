-- TASK SCORES: Add missing columns
ALTER TABLE public.task_scores ADD COLUMN IF NOT EXISTS adjustment numeric(5,2) DEFAULT 0;
ALTER TABLE public.task_scores ADD COLUMN IF NOT EXISTS adjustment_reason text;
ALTER TABLE public.task_scores ADD COLUMN IF NOT EXISTS adjusted_by uuid REFERENCES auth.users(id);
ALTER TABLE public.task_scores ADD COLUMN IF NOT EXISTS adjusted_at timestamp with time zone;

-- STAGE WEIGHTS TABLE
CREATE TABLE IF NOT EXISTS public.stage_weights (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    stage_id uuid NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
    weight numeric(5,2) DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (group_id, stage_id)
);

-- MEMBER FINAL SCORES TABLE
CREATE TABLE IF NOT EXISTS public.member_final_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    weighted_average numeric(5,2),
    adjustment numeric(5,2) DEFAULT 0,
    final_score numeric(5,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (group_id, user_id)
);

-- SCORE APPEALS TABLE
CREATE TABLE IF NOT EXISTS public.score_appeals (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    task_score_id uuid REFERENCES public.task_scores(id) ON DELETE CASCADE,
    stage_score_id uuid REFERENCES public.member_stage_scores(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    status text DEFAULT 'pending' NOT NULL,
    reviewer_id uuid REFERENCES auth.users(id),
    reviewer_response text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- APPEAL ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS public.appeal_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    appeal_id uuid NOT NULL REFERENCES public.score_appeals(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size bigint NOT NULL,
    storage_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- SCORE ADJUSTMENT HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.score_adjustment_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    adjustment_type text NOT NULL,
    target_id uuid NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    previous_score numeric(5,2),
    new_score numeric(5,2),
    adjustment_value numeric(5,2),
    reason text,
    adjusted_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- TASK COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.task_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    parent_id uuid REFERENCES public.task_comments(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- MESSAGE MENTIONS TABLE
CREATE TABLE IF NOT EXISTS public.message_mentions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    message_id uuid NOT NULL,
    message_type text NOT NULL,
    mentioned_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mentioned_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
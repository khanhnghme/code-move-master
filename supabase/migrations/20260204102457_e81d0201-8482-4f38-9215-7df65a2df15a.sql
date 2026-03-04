-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'leader', 'member');
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.task_status AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'VERIFIED');

-- PROFILES TABLE
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id text NOT NULL UNIQUE,
    full_name text NOT NULL,
    email text NOT NULL,
    avatar_url text,
    is_approved boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    must_change_password boolean DEFAULT false NOT NULL
);

-- GROUPS TABLE
CREATE TABLE public.groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    class_code text,
    instructor_name text,
    instructor_email text,
    leader_id uuid REFERENCES auth.users(id),
    zalo_link text,
    additional_info text
);

-- GROUP MEMBERS TABLE
CREATE TABLE public.group_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role DEFAULT 'member'::public.app_role NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (group_id, user_id)
);

-- STAGES TABLE
CREATE TABLE public.stages (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    order_index integer DEFAULT 0 NOT NULL,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- TASKS TABLE
CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    status public.task_status DEFAULT 'TODO'::public.task_status NOT NULL,
    deadline timestamp with time zone,
    submission_link text,
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    stage_id uuid REFERENCES public.stages(id) ON DELETE SET NULL,
    short_id text
);

-- TASK ASSIGNMENTS TABLE
CREATE TABLE public.task_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (task_id, user_id)
);

-- SUBMISSION HISTORY TABLE
CREATE TABLE public.submission_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    submission_link text NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    note text,
    file_path text,
    file_name text,
    file_size bigint
);

-- TASK SCORES TABLE
CREATE TABLE public.task_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    base_score numeric(5,2) DEFAULT 100 NOT NULL,
    late_penalty numeric(5,2) DEFAULT 0 NOT NULL,
    review_penalty numeric(5,2) DEFAULT 0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    early_bonus boolean DEFAULT false NOT NULL,
    bug_hunter_bonus boolean DEFAULT false NOT NULL,
    final_score numeric(5,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (task_id, user_id)
);

-- MEMBER STAGE SCORES TABLE
CREATE TABLE public.member_stage_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    stage_id uuid NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    average_score numeric(5,2),
    late_task_count integer DEFAULT 0 NOT NULL,
    early_submission_bonus boolean DEFAULT false NOT NULL,
    bug_hunter_bonus boolean DEFAULT false NOT NULL,
    adjusted_score numeric(5,2),
    k_coefficient numeric(3,2) DEFAULT 1.0,
    final_stage_score numeric(5,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (stage_id, user_id)
);

-- USER ROLES TABLE
CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- PENDING APPROVALS TABLE
CREATE TABLE public.pending_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    status public.approval_status DEFAULT 'pending'::public.approval_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone,
    processed_by uuid REFERENCES auth.users(id),
    UNIQUE (user_id, group_id)
);

-- ACTIVITY LOGS TABLE
CREATE TABLE public.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL,
    user_name text NOT NULL,
    action text NOT NULL,
    action_type text NOT NULL,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- PROJECT MESSAGES TABLE
CREATE TABLE public.project_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    source_type text DEFAULT 'chat' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- INDEXES
CREATE INDEX idx_activity_logs_action_type ON public.activity_logs USING btree (action_type);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs USING btree (created_at DESC);
CREATE INDEX idx_activity_logs_group_id ON public.activity_logs USING btree (group_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs USING btree (user_id);
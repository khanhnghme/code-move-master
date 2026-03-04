-- ADD MISSING COLUMNS

-- Groups: add missing columns
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS share_token text;

-- Profiles: add year_batch column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year_batch text;

-- Submission history: add submission_type
ALTER TABLE public.submission_history ADD COLUMN IF NOT EXISTS submission_type text DEFAULT 'link';

-- Tasks: add is_hidden column
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
    group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- TASK NOTES TABLE
CREATE TABLE IF NOT EXISTS public.task_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    version_name text NOT NULL,
    content text,
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- TASK NOTE ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS public.task_note_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    note_id uuid NOT NULL REFERENCES public.task_notes(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size bigint NOT NULL,
    storage_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_email_by_student_id(_student_id text) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT email FROM public.profiles WHERE student_id = _student_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_leader(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'leader'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_group_leader(_user_id uuid, _group_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id
    AND group_id = _group_id
    AND role IN ('leader', 'admin')
  ) OR public.is_admin(_user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_task_assignee(_user_id uuid, _task_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.task_assignments
    WHERE user_id = _user_id AND task_id = _task_id
  )
$$;

-- UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- HANDLE NEW USER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, student_id, full_name, email, is_approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    '',
    NEW.email,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- CHECK ADMIN USER FUNCTION
CREATE OR REPLACE FUNCTION public.check_admin_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.email = 'khanhngh.ueh@gmail.com' THEN
    UPDATE public.profiles
    SET
      is_approved = true,
      full_name = COALESCE(full_name, 'Nguyễn Hoàng Khánh'),
      email = NEW.email
    WHERE id = NEW.id;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
-- GROUPS: Add missing columns
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS short_id text;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS slug text;

-- PROFILES: Add major column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS major text;

-- PROJECT_MESSAGES: Add source_task_id column
ALTER TABLE public.project_messages ADD COLUMN IF NOT EXISTS source_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE;

-- MESSAGE_MENTIONS: Add missing columns
ALTER TABLE public.message_mentions ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
ALTER TABLE public.message_mentions ADD COLUMN IF NOT EXISTS comment_id uuid REFERENCES public.task_comments(id) ON DELETE CASCADE;

-- FEEDBACKS TABLE
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    status text DEFAULT 'pending' NOT NULL,
    priority text DEFAULT 'medium' NOT NULL,
    admin_response text,
    responded_by uuid REFERENCES auth.users(id),
    responded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- STORAGE BUCKET FOR AVATARS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT DO NOTHING;

-- TRIGGERS FOR AUTH
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- TRIGGERS FOR PROFILES
DROP TRIGGER IF EXISTS on_profile_created_check_admin ON public.profiles;
CREATE TRIGGER on_profile_created_check_admin 
  AFTER INSERT ON public.profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION public.check_admin_user();

-- TRIGGERS FOR UPDATED_AT
DROP TRIGGER IF EXISTS update_groups_updated_at ON public.groups;
CREATE TRIGGER update_groups_updated_at 
  BEFORE UPDATE ON public.groups 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON public.tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_stages_updated_at ON public.stages;
CREATE TRIGGER update_stages_updated_at 
  BEFORE UPDATE ON public.stages 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_scores_updated_at ON public.task_scores;
CREATE TRIGGER update_task_scores_updated_at 
  BEFORE UPDATE ON public.task_scores 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_member_stage_scores_updated_at ON public.member_stage_scores;
CREATE TRIGGER update_member_stage_scores_updated_at 
  BEFORE UPDATE ON public.member_stage_scores 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
-- Triggers for auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Check admin trigger on profiles
DROP TRIGGER IF EXISTS on_profile_created_check_admin ON public.profiles;
CREATE TRIGGER on_profile_created_check_admin 
  AFTER INSERT ON public.profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION public.check_admin_user();

-- Updated_at triggers
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

DROP TRIGGER IF EXISTS update_feedbacks_updated_at ON public.feedbacks;
CREATE TRIGGER update_feedbacks_updated_at 
  BEFORE UPDATE ON public.feedbacks 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_notes_updated_at ON public.task_notes;
CREATE TRIGGER update_task_notes_updated_at 
  BEFORE UPDATE ON public.task_notes 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_messages_updated_at ON public.project_messages;
CREATE TRIGGER update_project_messages_updated_at 
  BEFORE UPDATE ON public.project_messages 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_comments_updated_at ON public.task_comments;
CREATE TRIGGER update_task_comments_updated_at 
  BEFORE UPDATE ON public.task_comments 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_score_appeals_updated_at ON public.score_appeals;
CREATE TRIGGER update_score_appeals_updated_at 
  BEFORE UPDATE ON public.score_appeals 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_stage_weights_updated_at ON public.stage_weights;
CREATE TRIGGER update_stage_weights_updated_at 
  BEFORE UPDATE ON public.stage_weights 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_member_final_scores_updated_at ON public.member_final_scores;
CREATE TRIGGER update_member_final_scores_updated_at 
  BEFORE UPDATE ON public.member_final_scores 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_feedback_comments_updated_at ON public.feedback_comments;
CREATE TRIGGER update_feedback_comments_updated_at 
  BEFORE UPDATE ON public.feedback_comments 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
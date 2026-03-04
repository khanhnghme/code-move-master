-- GROUPS: Add more missing columns  
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS show_members_public boolean DEFAULT true;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS show_activity_public boolean DEFAULT true;

-- STAGES: Add is_hidden column
ALTER TABLE public.stages ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_stage_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_note_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_final_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appeal_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_adjustment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_comments ENABLE ROW LEVEL SECURITY;

-- PROFILES RLS Policies
CREATE POLICY "Users can view all approved profiles" ON public.profiles 
  FOR SELECT TO authenticated 
  USING ((is_approved = true) OR (id = auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT TO authenticated 
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE TO authenticated 
  USING (id = auth.uid());

-- GROUPS RLS Policies
CREATE POLICY "Members can view their groups" ON public.groups 
  FOR SELECT TO authenticated 
  USING (public.is_group_member(auth.uid(), id) OR public.is_admin(auth.uid()) OR is_public = true);

CREATE POLICY "Leaders and admins can create groups" ON public.groups 
  FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'leader') OR public.is_admin(auth.uid()));

CREATE POLICY "Group leaders can update groups" ON public.groups 
  FOR UPDATE TO authenticated 
  USING (public.is_group_leader(auth.uid(), id));

CREATE POLICY "Group leaders can delete groups" ON public.groups 
  FOR DELETE TO authenticated 
  USING (public.is_group_leader(auth.uid(), id));

-- GROUP MEMBERS RLS Policies  
CREATE POLICY "Members can view group members" ON public.group_members 
  FOR SELECT TO authenticated 
  USING (public.is_group_member(auth.uid(), group_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Leaders can manage group members" ON public.group_members 
  TO authenticated 
  USING (public.is_group_leader(auth.uid(), group_id));

-- STAGES RLS Policies
CREATE POLICY "Group members can view stages" ON public.stages 
  FOR SELECT TO authenticated 
  USING (public.is_group_member(auth.uid(), group_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Leaders can manage stages" ON public.stages 
  TO authenticated 
  USING (public.is_group_leader(auth.uid(), group_id));

-- TASKS RLS Policies
CREATE POLICY "Group members can view tasks" ON public.tasks 
  FOR SELECT TO authenticated 
  USING (public.is_group_member(auth.uid(), group_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Leaders can create tasks" ON public.tasks 
  FOR INSERT TO authenticated 
  WITH CHECK (public.is_group_leader(auth.uid(), group_id));

CREATE POLICY "Leaders can update all task fields" ON public.tasks 
  FOR UPDATE USING (public.is_group_leader(auth.uid(), group_id));

CREATE POLICY "Assignees can update task status and submission" ON public.tasks 
  FOR UPDATE USING (public.is_task_assignee(auth.uid(), id)) 
  WITH CHECK (public.is_task_assignee(auth.uid(), id));

CREATE POLICY "Leaders can delete tasks" ON public.tasks 
  FOR DELETE TO authenticated 
  USING (public.is_group_leader(auth.uid(), group_id));

-- TASK ASSIGNMENTS RLS Policies
CREATE POLICY "Group members can view task assignments" ON public.task_assignments 
  FOR SELECT TO authenticated 
  USING ((EXISTS ( SELECT 1 FROM public.tasks t WHERE t.id = task_assignments.task_id AND public.is_group_member(auth.uid(), t.group_id))) OR public.is_admin(auth.uid()));

CREATE POLICY "Leaders can manage task assignments" ON public.task_assignments 
  TO authenticated 
  USING ((EXISTS ( SELECT 1 FROM public.tasks t WHERE t.id = task_assignments.task_id AND public.is_group_leader(auth.uid(), t.group_id))));

-- SUBMISSION HISTORY RLS Policies
CREATE POLICY "Group members can view submissions" ON public.submission_history 
  FOR SELECT TO authenticated 
  USING ((EXISTS ( SELECT 1 FROM public.tasks t WHERE t.id = submission_history.task_id AND public.is_group_member(auth.uid(), t.group_id))) OR public.is_admin(auth.uid()));

CREATE POLICY "Assignees can insert submissions" ON public.submission_history 
  FOR INSERT TO authenticated 
  WITH CHECK ((user_id = auth.uid()) AND public.is_task_assignee(auth.uid(), task_id));

-- TASK SCORES RLS Policies
CREATE POLICY "Group members can view scores" ON public.task_scores 
  FOR SELECT TO authenticated 
  USING ((EXISTS ( SELECT 1 FROM public.tasks t WHERE t.id = task_scores.task_id AND public.is_group_member(auth.uid(), t.group_id))) OR public.is_admin(auth.uid()));

CREATE POLICY "Leaders can manage scores" ON public.task_scores 
  TO authenticated 
  USING ((EXISTS ( SELECT 1 FROM public.tasks t WHERE t.id = task_scores.task_id AND public.is_group_leader(auth.uid(), t.group_id))));

-- USER ROLES RLS Policies
CREATE POLICY "Users can view own roles" ON public.user_roles 
  FOR SELECT TO authenticated 
  USING ((user_id = auth.uid()) OR public.is_admin(auth.uid()));

CREATE POLICY "Only admin can manage roles" ON public.user_roles 
  TO authenticated 
  USING (public.is_admin(auth.uid()));

-- ACTIVITY LOGS RLS Policies
CREATE POLICY "Leaders and admins can view activity logs" ON public.activity_logs 
  FOR SELECT USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'leader'));

CREATE POLICY "Leaders and admins can insert activity logs" ON public.activity_logs 
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'leader') OR (user_id = auth.uid()));

CREATE POLICY "Leaders and admins can delete activity logs" ON public.activity_logs 
  FOR DELETE USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'leader'));

-- MEMBER STAGE SCORES RLS Policies
CREATE POLICY "Group members can view stage scores" ON public.member_stage_scores 
  FOR SELECT TO authenticated 
  USING ((EXISTS ( SELECT 1 FROM public.stages s WHERE s.id = member_stage_scores.stage_id AND public.is_group_member(auth.uid(), s.group_id))) OR public.is_admin(auth.uid()));

CREATE POLICY "Leaders can manage stage scores" ON public.member_stage_scores 
  TO authenticated 
  USING ((EXISTS ( SELECT 1 FROM public.stages s WHERE s.id = member_stage_scores.stage_id AND public.is_group_leader(auth.uid(), s.group_id))));

-- PENDING APPROVALS RLS Policies  
CREATE POLICY "Users can view own approval requests" ON public.pending_approvals 
  FOR SELECT TO authenticated 
  USING ((user_id = auth.uid()) OR public.is_group_leader(auth.uid(), group_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create approval requests" ON public.pending_approvals 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Leaders can process approval requests" ON public.pending_approvals 
  FOR UPDATE TO authenticated 
  USING (public.is_group_leader(auth.uid(), group_id) OR public.is_admin(auth.uid()));

-- PROJECT MESSAGES RLS Policies
CREATE POLICY "Group members can view messages" ON public.project_messages 
  FOR SELECT TO authenticated 
  USING (public.is_group_member(auth.uid(), group_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Group members can insert messages" ON public.project_messages 
  FOR INSERT TO authenticated 
  WITH CHECK (public.is_group_member(auth.uid(), group_id) AND user_id = auth.uid());

CREATE POLICY "Users can update own messages" ON public.project_messages 
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own messages" ON public.project_messages 
  FOR DELETE TO authenticated 
  USING (user_id = auth.uid() OR public.is_group_leader(auth.uid(), group_id));

-- NOTIFICATIONS RLS Policies
CREATE POLICY "Users can view own notifications" ON public.notifications 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications 
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.notifications 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can delete own notifications" ON public.notifications 
  FOR DELETE TO authenticated 
  USING (user_id = auth.uid());

-- TASK NOTES RLS Policies
CREATE POLICY "Group members can view task notes" ON public.task_notes 
  FOR SELECT TO authenticated 
  USING ((EXISTS ( SELECT 1 FROM public.tasks t WHERE t.id = task_notes.task_id AND public.is_group_member(auth.uid(), t.group_id))) OR public.is_admin(auth.uid()));

CREATE POLICY "Assignees and leaders can manage task notes" ON public.task_notes 
  TO authenticated 
  USING ((EXISTS ( SELECT 1 FROM public.tasks t WHERE t.id = task_notes.task_id AND (public.is_task_assignee(auth.uid(), t.id) OR public.is_group_leader(auth.uid(), t.group_id)))));

-- TASK NOTE ATTACHMENTS RLS Policies
CREATE POLICY "Group members can view note attachments" ON public.task_note_attachments 
  FOR SELECT TO authenticated 
  USING ((EXISTS ( SELECT 1 FROM public.task_notes n JOIN public.tasks t ON n.task_id = t.id WHERE n.id = task_note_attachments.note_id AND public.is_group_member(auth.uid(), t.group_id))) OR public.is_admin(auth.uid()));

CREATE POLICY "Assignees and leaders can manage note attachments" ON public.task_note_attachments 
  TO authenticated 
  USING ((EXISTS ( SELECT 1 FROM public.task_notes n JOIN public.tasks t ON n.task_id = t.id WHERE n.id = task_note_attachments.note_id AND (public.is_task_assignee(auth.uid(), t.id) OR public.is_group_leader(auth.uid(), t.group_id)))));

-- STAGE WEIGHTS RLS Policies
CREATE POLICY "Group members can view stage weights" ON public.stage_weights 
  FOR SELECT TO authenticated 
  USING (public.is_group_member(auth.uid(), group_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Leaders can manage stage weights" ON public.stage_weights 
  TO authenticated 
  USING (public.is_group_leader(auth.uid(), group_id));

-- MEMBER FINAL SCORES RLS Policies
CREATE POLICY "Group members can view final scores" ON public.member_final_scores 
  FOR SELECT TO authenticated 
  USING (public.is_group_member(auth.uid(), group_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Leaders can manage final scores" ON public.member_final_scores 
  TO authenticated 
  USING (public.is_group_leader(auth.uid(), group_id));

-- SCORE APPEALS RLS Policies
CREATE POLICY "Users can view own appeals" ON public.score_appeals 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create appeals" ON public.score_appeals 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Leaders can update appeals" ON public.score_appeals 
  FOR UPDATE TO authenticated 
  USING (public.is_admin(auth.uid()) OR reviewer_id = auth.uid());

-- APPEAL ATTACHMENTS RLS Policies
CREATE POLICY "Users can view appeal attachments" ON public.appeal_attachments 
  FOR SELECT TO authenticated 
  USING ((EXISTS ( SELECT 1 FROM public.score_appeals a WHERE a.id = appeal_attachments.appeal_id AND (a.user_id = auth.uid() OR public.is_admin(auth.uid())))));

CREATE POLICY "Users can manage own appeal attachments" ON public.appeal_attachments 
  TO authenticated 
  USING ((EXISTS ( SELECT 1 FROM public.score_appeals a WHERE a.id = appeal_attachments.appeal_id AND a.user_id = auth.uid())));

-- SCORE ADJUSTMENT HISTORY RLS Policies
CREATE POLICY "Group members can view score history" ON public.score_adjustment_history 
  FOR SELECT TO authenticated 
  USING (public.is_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY "Leaders can insert score history" ON public.score_adjustment_history 
  FOR INSERT TO authenticated 
  WITH CHECK (public.is_admin(auth.uid()) OR adjusted_by = auth.uid());

-- TASK COMMENTS RLS Policies
CREATE POLICY "Group members can view comments" ON public.task_comments 
  FOR SELECT TO authenticated 
  USING ((EXISTS ( SELECT 1 FROM public.tasks t WHERE t.id = task_comments.task_id AND public.is_group_member(auth.uid(), t.group_id))) OR public.is_admin(auth.uid()));

CREATE POLICY "Group members can insert comments" ON public.task_comments 
  FOR INSERT TO authenticated 
  WITH CHECK ((EXISTS ( SELECT 1 FROM public.tasks t WHERE t.id = task_comments.task_id AND public.is_group_member(auth.uid(), t.group_id))) AND user_id = auth.uid());

CREATE POLICY "Users can update own comments" ON public.task_comments 
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users and leaders can delete comments" ON public.task_comments 
  FOR DELETE TO authenticated 
  USING (user_id = auth.uid() OR (EXISTS ( SELECT 1 FROM public.tasks t WHERE t.id = task_comments.task_id AND public.is_group_leader(auth.uid(), t.group_id))));

-- MESSAGE MENTIONS RLS Policies
CREATE POLICY "Users can view own mentions" ON public.message_mentions 
  FOR SELECT TO authenticated 
  USING (mentioned_user_id = auth.uid() OR mentioned_by = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert mentions" ON public.message_mentions 
  FOR INSERT TO authenticated 
  WITH CHECK (mentioned_by = auth.uid());

CREATE POLICY "Users can update own mentions" ON public.message_mentions 
  FOR UPDATE TO authenticated 
  USING (mentioned_user_id = auth.uid());

-- FEEDBACKS RLS Policies
CREATE POLICY "Users can view own feedbacks" ON public.feedbacks 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can create feedbacks" ON public.feedbacks 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own feedbacks" ON public.feedbacks 
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- FEEDBACK COMMENTS RLS Policies
CREATE POLICY "Users can view feedback comments" ON public.feedback_comments 
  FOR SELECT TO authenticated 
  USING ((EXISTS ( SELECT 1 FROM public.feedbacks f WHERE f.id = feedback_comments.feedback_id AND (f.user_id = auth.uid() OR public.is_admin(auth.uid())))));

CREATE POLICY "Users can insert feedback comments" ON public.feedback_comments 
  FOR INSERT TO authenticated 
  WITH CHECK ((EXISTS ( SELECT 1 FROM public.feedbacks f WHERE f.id = feedback_comments.feedback_id AND (f.user_id = auth.uid() OR public.is_admin(auth.uid())))) AND user_id = auth.uid());
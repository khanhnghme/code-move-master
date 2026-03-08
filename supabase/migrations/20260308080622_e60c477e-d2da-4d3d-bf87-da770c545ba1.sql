
-- Fix groups INSERT policy: change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Leaders and admins can create groups" ON public.groups;
CREATE POLICY "Leaders and admins can create groups"
  ON public.groups FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'leader'::app_role) OR is_admin(auth.uid()));

-- Fix groups SELECT policy: make PERMISSIVE
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;
CREATE POLICY "Members can view their groups"
  ON public.groups FOR SELECT
  TO authenticated
  USING (is_group_member(auth.uid(), id) OR is_admin(auth.uid()) OR (is_public = true));

DROP POLICY IF EXISTS "Public can view shared groups" ON public.groups;
CREATE POLICY "Public can view shared groups"
  ON public.groups FOR SELECT
  USING ((is_public = true) AND (share_token IS NOT NULL));

-- Fix groups UPDATE policy: make PERMISSIVE
DROP POLICY IF EXISTS "Group leaders can update groups" ON public.groups;
CREATE POLICY "Group leaders can update groups"
  ON public.groups FOR UPDATE
  TO authenticated
  USING (is_group_leader(auth.uid(), id));

-- Fix groups DELETE policy: make PERMISSIVE
DROP POLICY IF EXISTS "Group leaders can delete groups" ON public.groups;
CREATE POLICY "Group leaders can delete groups"
  ON public.groups FOR DELETE
  TO authenticated
  USING (is_group_leader(auth.uid(), id));

-- Fix group_members: allow group creator to add themselves (chicken-and-egg fix)
DROP POLICY IF EXISTS "Leaders can manage group members" ON public.group_members;
CREATE POLICY "Leaders can manage group members"
  ON public.group_members FOR ALL
  TO authenticated
  USING (is_group_leader(auth.uid(), group_id));

-- Allow group creator to insert first member (themselves)
CREATE POLICY "Group creator can add first member"
  ON public.group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (is_group_member(auth.uid(), group_id) OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public can view members of public groups" ON public.group_members;
CREATE POLICY "Public can view members of public groups"
  ON public.group_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM groups g WHERE g.id = group_members.group_id AND g.is_public = true AND g.show_members_public = true));

-- Fix stages policies for leaders
DROP POLICY IF EXISTS "Leaders can manage stages" ON public.stages;
CREATE POLICY "Leaders can manage stages"
  ON public.stages FOR ALL
  TO authenticated
  USING (is_group_leader(auth.uid(), group_id));

DROP POLICY IF EXISTS "Group members can view stages" ON public.stages;
CREATE POLICY "Group members can view stages"
  ON public.stages FOR SELECT
  TO authenticated
  USING (is_group_member(auth.uid(), group_id) OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public can view stages of public groups" ON public.stages;
CREATE POLICY "Public can view stages of public groups"
  ON public.stages FOR SELECT
  USING (EXISTS (SELECT 1 FROM groups g WHERE g.id = stages.group_id AND g.is_public = true));

-- Fix tasks policies
DROP POLICY IF EXISTS "Leaders can create tasks" ON public.tasks;
CREATE POLICY "Leaders can create tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (is_group_leader(auth.uid(), group_id));

DROP POLICY IF EXISTS "Leaders can update all task fields" ON public.tasks;
CREATE POLICY "Leaders can update all task fields"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (is_group_leader(auth.uid(), group_id));

DROP POLICY IF EXISTS "Leaders can delete tasks" ON public.tasks;
CREATE POLICY "Leaders can delete tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (is_group_leader(auth.uid(), group_id));

DROP POLICY IF EXISTS "Assignees can update task status and submission" ON public.tasks;
CREATE POLICY "Assignees can update task status and submission"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (is_task_assignee(auth.uid(), id))
  WITH CHECK (is_task_assignee(auth.uid(), id));

DROP POLICY IF EXISTS "Group members can view tasks" ON public.tasks;
CREATE POLICY "Group members can view tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (is_group_member(auth.uid(), group_id) OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public can view tasks of public groups" ON public.tasks;
CREATE POLICY "Public can view tasks of public groups"
  ON public.tasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM groups g WHERE g.id = tasks.group_id AND g.is_public = true));

-- Fix task_assignments policies
DROP POLICY IF EXISTS "Leaders can manage task assignments" ON public.task_assignments;
CREATE POLICY "Leaders can manage task assignments"
  ON public.task_assignments FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_assignments.task_id AND is_group_leader(auth.uid(), t.group_id)));

DROP POLICY IF EXISTS "Group members can view task assignments" ON public.task_assignments;
CREATE POLICY "Group members can view task assignments"
  ON public.task_assignments FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_assignments.task_id AND is_group_member(auth.uid(), t.group_id)) OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public can view task assignments of public groups" ON public.task_assignments;
CREATE POLICY "Public can view task assignments of public groups"
  ON public.task_assignments FOR SELECT
  USING (EXISTS (SELECT 1 FROM tasks t JOIN groups g ON g.id = t.group_id WHERE t.id = task_assignments.task_id AND g.is_public = true));

-- Fix project_resources policies
DROP POLICY IF EXISTS "Leaders can insert resources" ON public.project_resources;
CREATE POLICY "Leaders can insert resources"
  ON public.project_resources FOR INSERT
  TO authenticated
  WITH CHECK (is_group_leader(auth.uid(), group_id) AND uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Leaders can update resources" ON public.project_resources;
CREATE POLICY "Leaders can update resources"
  ON public.project_resources FOR UPDATE
  TO authenticated
  USING (is_group_leader(auth.uid(), group_id));

DROP POLICY IF EXISTS "Leaders can delete resources" ON public.project_resources;
CREATE POLICY "Leaders can delete resources"
  ON public.project_resources FOR DELETE
  TO authenticated
  USING (is_group_leader(auth.uid(), group_id));

DROP POLICY IF EXISTS "Group members can view resources" ON public.project_resources;
CREATE POLICY "Group members can view resources"
  ON public.project_resources FOR SELECT
  TO authenticated
  USING (is_group_member(auth.uid(), group_id) OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public can view resources of public groups" ON public.project_resources;
CREATE POLICY "Public can view resources of public groups"
  ON public.project_resources FOR SELECT
  USING (EXISTS (SELECT 1 FROM groups g WHERE g.id = project_resources.group_id AND g.is_public = true AND g.show_resources_public = true));

-- Fix activity_logs policies
DROP POLICY IF EXISTS "Leaders and admins can insert activity logs" ON public.activity_logs;
CREATE POLICY "Leaders and admins can insert activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'leader'::app_role) OR (user_id = auth.uid()));

DROP POLICY IF EXISTS "Leaders and admins can view activity logs" ON public.activity_logs;
CREATE POLICY "Leaders and admins can view activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'leader'::app_role));

DROP POLICY IF EXISTS "Leaders and admins can delete activity logs" ON public.activity_logs;
CREATE POLICY "Leaders and admins can delete activity logs"
  ON public.activity_logs FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'leader'::app_role));

DROP POLICY IF EXISTS "Public can view activity logs of public groups" ON public.activity_logs;
CREATE POLICY "Public can view activity logs of public groups"
  ON public.activity_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM groups g WHERE g.id = activity_logs.group_id AND g.is_public = true AND g.show_activity_public = true));

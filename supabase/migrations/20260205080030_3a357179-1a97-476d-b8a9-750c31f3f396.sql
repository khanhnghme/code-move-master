-- Add RLS policies for anonymous users to view public project data

-- Policy for stages - allow viewing stages of public groups
CREATE POLICY "Public can view stages of public groups"
ON public.stages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM groups g 
    WHERE g.id = stages.group_id 
    AND g.is_public = true
  )
);

-- Policy for tasks - allow viewing tasks of public groups
CREATE POLICY "Public can view tasks of public groups"
ON public.tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM groups g 
    WHERE g.id = tasks.group_id 
    AND g.is_public = true
  )
);

-- Policy for task_assignments - allow viewing assignments of public groups
CREATE POLICY "Public can view task assignments of public groups"
ON public.task_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN groups g ON g.id = t.group_id
    WHERE t.id = task_assignments.task_id 
    AND g.is_public = true
  )
);

-- Policy for group_members - allow viewing members of public groups if show_members_public is true
CREATE POLICY "Public can view members of public groups"
ON public.group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM groups g 
    WHERE g.id = group_members.group_id 
    AND g.is_public = true
    AND g.show_members_public = true
  )
);

-- Policy for profiles - allow viewing profiles of members in public groups
CREATE POLICY "Public can view profiles of public group members"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    JOIN groups g ON g.id = gm.group_id
    WHERE gm.user_id = profiles.id
    AND g.is_public = true
    AND g.show_members_public = true
  )
);

-- Policy for activity_logs - allow viewing logs of public groups if show_activity_public is true
CREATE POLICY "Public can view activity logs of public groups"
ON public.activity_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM groups g 
    WHERE g.id = activity_logs.group_id 
    AND g.is_public = true
    AND g.show_activity_public = true
  )
);
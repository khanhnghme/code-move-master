-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Assignees can insert submissions" ON public.submission_history;

-- Create new INSERT policy that allows:
-- 1. Task assignees can insert their own submissions
-- 2. Group leaders can insert submissions (for submitting on behalf of assignees)
-- 3. Admins can insert submissions
CREATE POLICY "Members and leaders can insert submissions"
ON public.submission_history
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND (
    -- User is an assignee of the task
    is_task_assignee(auth.uid(), task_id)
    OR
    -- User is a leader of the group that owns the task
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_id
      AND is_group_leader(auth.uid(), t.group_id)
    )
    OR
    -- User is an admin
    is_admin(auth.uid())
  )
);
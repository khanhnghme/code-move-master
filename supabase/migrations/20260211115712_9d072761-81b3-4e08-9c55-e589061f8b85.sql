
-- 1. Make created_by nullable for anonymous users
ALTER TABLE public.task_notes ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.task_notes ALTER COLUMN created_by SET DEFAULT NULL;

-- 2. Add permissive RLS policies for anonymous (unauthenticated) users on task_notes
-- Allow anyone to SELECT task_notes (for realtime and public views)
CREATE POLICY "Anyone can view task notes"
ON public.task_notes
FOR SELECT
USING (true);

-- Allow anyone to INSERT task notes
CREATE POLICY "Anyone can create task notes"
ON public.task_notes
FOR INSERT
WITH CHECK (true);

-- Allow anyone to UPDATE task notes
CREATE POLICY "Anyone can update task notes"
ON public.task_notes
FOR UPDATE
USING (true);

-- Allow anyone to DELETE task notes
CREATE POLICY "Anyone can delete task notes"
ON public.task_notes
FOR DELETE
USING (true);

-- Drop old restrictive policies since new ones are more permissive
DROP POLICY IF EXISTS "Assignees and leaders can manage task notes" ON public.task_notes;
DROP POLICY IF EXISTS "Group members can view task notes" ON public.task_notes;

-- 3. Same for task_note_attachments
CREATE POLICY "Anyone can view note attachments"
ON public.task_note_attachments
FOR SELECT
USING (true);

CREATE POLICY "Anyone can manage note attachments"
ON public.task_note_attachments
FOR ALL
USING (true);

DROP POLICY IF EXISTS "Assignees and leaders can manage note attachments" ON public.task_note_attachments;
DROP POLICY IF EXISTS "Group members can view note attachments" ON public.task_note_attachments;

-- 4. Enable realtime for task_notes
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_notes;


-- Fix storage policy: allow anonymous uploads to task-note-attachments bucket
-- First drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated uploads to task-note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from task-note-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read task-note-attachments" ON storage.objects;

-- Allow anyone (including anonymous) to upload
CREATE POLICY "Anyone can upload to task-note-attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-note-attachments');

-- Allow anyone to read
CREATE POLICY "Anyone can read task-note-attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-note-attachments');

-- Allow anyone to delete their uploads
CREATE POLICY "Anyone can delete from task-note-attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-note-attachments');

-- Fix task_note_attachments table RLS - allow anonymous insert/delete
DROP POLICY IF EXISTS "Anyone can view note attachments" ON public.task_note_attachments;
DROP POLICY IF EXISTS "Authenticated users can insert note attachments" ON public.task_note_attachments;
DROP POLICY IF EXISTS "Authenticated users can delete note attachments" ON public.task_note_attachments;
DROP POLICY IF EXISTS "Anyone can insert note attachments" ON public.task_note_attachments;
DROP POLICY IF EXISTS "Anyone can delete note attachments" ON public.task_note_attachments;

CREATE POLICY "Anyone can view note attachments"
ON public.task_note_attachments FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert note attachments"
ON public.task_note_attachments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can delete note attachments"
ON public.task_note_attachments FOR DELETE
USING (true);

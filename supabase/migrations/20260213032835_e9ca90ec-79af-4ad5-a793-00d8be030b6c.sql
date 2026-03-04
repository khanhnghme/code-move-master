
-- Add occurrence tracking columns to system_error_logs
ALTER TABLE public.system_error_logs 
ADD COLUMN IF NOT EXISTS occurrence_count integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_occurred_at timestamptz NOT NULL DEFAULT now();

-- Create unique index for deduplication by error_message + error_type
CREATE INDEX IF NOT EXISTS idx_system_error_logs_dedup 
ON public.system_error_logs (error_type, md5(error_message));

-- Ensure task-note-attachments bucket exists and is accessible
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-note-attachments', 'task-note-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Ensure storage policies exist for task-note-attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated uploads to task-note-attachments'
  ) THEN
    CREATE POLICY "Allow authenticated uploads to task-note-attachments"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'task-note-attachments' AND auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read task-note-attachments'
  ) THEN
    CREATE POLICY "Allow public read task-note-attachments"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'task-note-attachments');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated delete task-note-attachments'
  ) THEN
    CREATE POLICY "Allow authenticated delete task-note-attachments"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'task-note-attachments' AND auth.role() = 'authenticated');
  END IF;
END
$$;

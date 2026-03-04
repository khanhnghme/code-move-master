
-- Create system error logs table
CREATE TABLE public.system_error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_message TEXT NOT NULL,
  error_type TEXT NOT NULL DEFAULT 'runtime',
  error_stack TEXT,
  component TEXT,
  url TEXT,
  user_id UUID,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_error_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert error logs
CREATE POLICY "Authenticated users can insert error logs"
ON public.system_error_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow admins to read all error logs
CREATE POLICY "Admins can read error logs"
ON public.system_error_logs
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Allow admins to delete error logs
CREATE POLICY "Admins can delete error logs"
ON public.system_error_logs
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Allow anon to insert error logs (for unauthenticated errors)
CREATE POLICY "Anon can insert error logs"
ON public.system_error_logs
FOR INSERT
TO anon
WITH CHECK (true);

-- Index for fast queries
CREATE INDEX idx_system_error_logs_created_at ON public.system_error_logs(created_at DESC);
CREATE INDEX idx_system_error_logs_error_type ON public.system_error_logs(error_type);

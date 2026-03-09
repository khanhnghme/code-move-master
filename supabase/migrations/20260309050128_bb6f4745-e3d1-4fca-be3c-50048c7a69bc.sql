
-- Add email_notifications column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications boolean NOT NULL DEFAULT true;

-- Create email_logs table
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email_type text NOT NULL DEFAULT 'daily_digest',
  recipient_email text NOT NULL,
  tasks_count integer NOT NULL DEFAULT 0,
  digest_data jsonb DEFAULT '{}'::jsonb,
  sent_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view email logs
CREATE POLICY "Admins can view email logs" ON public.email_logs
  FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

-- Service role insert (via edge function with service key)
CREATE POLICY "Service can insert email logs" ON public.email_logs
  FOR INSERT
  WITH CHECK (true);

-- Index for checking daily duplicates
CREATE INDEX idx_email_logs_user_type_sent ON public.email_logs (user_id, email_type, sent_at);

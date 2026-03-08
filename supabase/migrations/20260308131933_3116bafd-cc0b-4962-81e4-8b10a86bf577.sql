
-- Table to store password reset OTP codes
CREATE TABLE public.password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Allow anon/authenticated to insert and select (needed for the flow)
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert reset codes" ON public.password_reset_codes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read reset codes" ON public.password_reset_codes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update reset codes" ON public.password_reset_codes
  FOR UPDATE USING (true);

-- Cleanup old codes automatically (optional index)
CREATE INDEX idx_reset_codes_email_expires ON public.password_reset_codes (email, expires_at);

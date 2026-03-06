
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid DEFAULT NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed to check maintenance mode)
CREATE POLICY "Anyone can read system settings"
ON public.system_settings
FOR SELECT
TO authenticated, anon
USING (true);

-- Only admin can modify settings
CREATE POLICY "Only admin can modify system settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Insert initial maintenance mode setting
INSERT INTO public.system_settings (key, value) 
VALUES ('maintenance_mode', '{"enabled": false, "message": "Hệ thống đang bảo trì, vui lòng quay lại sau."}'::jsonb);

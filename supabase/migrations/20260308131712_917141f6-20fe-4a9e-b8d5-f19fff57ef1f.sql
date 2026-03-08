
-- Update handle_new_user to check auto_approve setting
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _auto_approve boolean := false;
BEGIN
  -- Check if auto-approve is enabled
  SELECT COALESCE((value->>'enabled')::boolean, false) INTO _auto_approve
  FROM public.system_settings
  WHERE key = 'auto_approve_accounts';

  INSERT INTO public.profiles (id, student_id, full_name, email, is_approved, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'student_id', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    _auto_approve,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = COALESCE(
      EXCLUDED.avatar_url,
      profiles.avatar_url
    ),
    full_name = CASE
      WHEN profiles.full_name = '' OR profiles.full_name IS NULL
      THEN COALESCE(EXCLUDED.full_name, profiles.full_name)
      ELSE profiles.full_name
    END;
  RETURN NEW;
END;
$function$;


CREATE OR REPLACE FUNCTION public.check_join_member_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _limit integer;
  _current_count integer;
BEGIN
  SELECT join_member_limit INTO _limit FROM public.groups WHERE id = NEW.group_id;
  
  IF _limit IS NOT NULL THEN
    SELECT COUNT(*) INTO _current_count FROM public.group_members WHERE group_id = NEW.group_id;
    
    IF _current_count >= _limit THEN
      RAISE EXCEPTION 'Đã đạt giới hạn % thành viên cho project này', _limit;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_join_member_limit_trigger
  BEFORE INSERT ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.check_join_member_limit();

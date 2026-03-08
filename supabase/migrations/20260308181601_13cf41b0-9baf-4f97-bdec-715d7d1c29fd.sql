CREATE OR REPLACE FUNCTION public.get_group_member_count_for_join(_group_id uuid)
RETURNS TABLE(member_count bigint, join_member_limit integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(gm.id)::bigint AS member_count,
         g.join_member_limit
  FROM public.groups g
  LEFT JOIN public.group_members gm ON gm.group_id = g.id
  WHERE g.id = _group_id
    AND g.allow_join_by_code = true
  GROUP BY g.join_member_limit;
$$;
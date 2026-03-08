-- Add RLS policy allowing members to leave project within 48 hours of joining
CREATE POLICY "Members can leave within 48h"
ON public.group_members
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND joined_at > (now() - interval '48 hours')
  AND user_id != (SELECT created_by FROM public.groups WHERE id = group_id)
);
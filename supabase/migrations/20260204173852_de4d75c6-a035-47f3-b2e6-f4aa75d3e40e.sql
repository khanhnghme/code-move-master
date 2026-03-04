-- Drop existing policies with wrong parameter order
DROP POLICY IF EXISTS "Group leaders can create folders" ON public.resource_folders;
DROP POLICY IF EXISTS "Group leaders can update folders" ON public.resource_folders;
DROP POLICY IF EXISTS "Group leaders can delete folders" ON public.resource_folders;
DROP POLICY IF EXISTS "Group members can view folders" ON public.resource_folders;

-- Recreate policies with correct parameter order (user_id, group_id)
CREATE POLICY "Group members can view folders"
ON public.resource_folders
FOR SELECT
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group leaders can create folders"
ON public.resource_folders
FOR INSERT
WITH CHECK (public.is_group_leader(auth.uid(), group_id));

CREATE POLICY "Group leaders can update folders"
ON public.resource_folders
FOR UPDATE
USING (public.is_group_leader(auth.uid(), group_id));

CREATE POLICY "Group leaders can delete folders"
ON public.resource_folders
FOR DELETE
USING (public.is_group_leader(auth.uid(), group_id));
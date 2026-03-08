DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;
CREATE POLICY "Members can view their groups"
  ON public.groups FOR SELECT
  TO authenticated
  USING (
    is_group_member(auth.uid(), id)
    OR created_by = auth.uid()
    OR is_admin(auth.uid())
    OR (is_public = true)
  );
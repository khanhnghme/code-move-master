
-- Add join code columns to groups
ALTER TABLE public.groups ADD COLUMN join_code text UNIQUE;
ALTER TABLE public.groups ADD COLUMN allow_join_by_code boolean DEFAULT false;

-- Policy: authenticated users can join groups by valid code
CREATE POLICY "Users can join groups by code"
ON public.group_members FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'member'
  AND EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id
    AND g.allow_join_by_code = true
    AND g.join_code IS NOT NULL
  )
);

-- Policy: authenticated users can lookup groups by join_code for validation
CREATE POLICY "Users can lookup groups by join code"
ON public.groups FOR SELECT TO authenticated
USING (allow_join_by_code = true AND join_code IS NOT NULL);

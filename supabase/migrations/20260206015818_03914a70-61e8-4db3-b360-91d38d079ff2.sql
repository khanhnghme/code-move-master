-- Fix: Add policy for anonymous users to view public groups via share_token
-- The existing policy "Members can view their groups" restricts to authenticated users only

-- Create a new policy specifically for public/anonymous access
CREATE POLICY "Public can view shared groups"
ON public.groups FOR SELECT
USING (is_public = true AND share_token IS NOT NULL);
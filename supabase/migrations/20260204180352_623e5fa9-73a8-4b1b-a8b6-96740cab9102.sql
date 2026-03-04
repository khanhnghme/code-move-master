-- Add show_resources_public column to groups table
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS show_resources_public boolean DEFAULT true;

-- Update RLS policy for project_resources to allow public viewing when group is public
DROP POLICY IF EXISTS "Public can view resources of public groups" ON public.project_resources;

CREATE POLICY "Public can view resources of public groups"
ON public.project_resources
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = project_resources.group_id
    AND g.is_public = true
    AND g.show_resources_public = true
  )
);

-- Update RLS policy for resource_folders to allow public viewing
DROP POLICY IF EXISTS "Public can view folders of public groups" ON public.resource_folders;

CREATE POLICY "Public can view folders of public groups"
ON public.resource_folders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = resource_folders.group_id
    AND g.is_public = true
    AND g.show_resources_public = true
  )
);
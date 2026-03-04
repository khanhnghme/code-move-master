-- Create resource_folders table
CREATE TABLE public.resource_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add folder_id column to project_resources
ALTER TABLE public.project_resources 
ADD COLUMN folder_id UUID REFERENCES public.resource_folders(id) ON DELETE SET NULL;

-- Enable RLS on resource_folders
ALTER TABLE public.resource_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resource_folders
CREATE POLICY "Group members can view folders"
ON public.resource_folders
FOR SELECT
USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Group leaders can create folders"
ON public.resource_folders
FOR INSERT
WITH CHECK (public.is_group_leader(group_id, auth.uid()));

CREATE POLICY "Group leaders can update folders"
ON public.resource_folders
FOR UPDATE
USING (public.is_group_leader(group_id, auth.uid()));

CREATE POLICY "Group leaders can delete folders"
ON public.resource_folders
FOR DELETE
USING (public.is_group_leader(group_id, auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_resource_folders_group_id ON public.resource_folders(group_id);
CREATE INDEX idx_project_resources_folder_id ON public.project_resources(folder_id);
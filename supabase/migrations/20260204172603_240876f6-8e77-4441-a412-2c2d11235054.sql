-- Create project_resources table for storing file metadata
CREATE TABLE public.project_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  storage_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_type TEXT,
  category TEXT DEFAULT 'general',
  description TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_project_resources_group_id ON public.project_resources(group_id);
CREATE INDEX idx_project_resources_category ON public.project_resources(category);

-- Enable RLS
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- All group members can view resources
CREATE POLICY "Group members can view resources"
ON public.project_resources
FOR SELECT
USING (is_group_member(auth.uid(), group_id) OR is_admin(auth.uid()));

-- Leaders can insert resources
CREATE POLICY "Leaders can insert resources"
ON public.project_resources
FOR INSERT
WITH CHECK (
  is_group_leader(auth.uid(), group_id) AND uploaded_by = auth.uid()
);

-- Leaders can update resources
CREATE POLICY "Leaders can update resources"
ON public.project_resources
FOR UPDATE
USING (is_group_leader(auth.uid(), group_id));

-- Leaders can delete resources
CREATE POLICY "Leaders can delete resources"
ON public.project_resources
FOR DELETE
USING (is_group_leader(auth.uid(), group_id));

-- Create trigger for updated_at
CREATE TRIGGER update_project_resources_updated_at
BEFORE UPDATE ON public.project_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for project resources
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-resources', 'project-resources', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for project-resources bucket
CREATE POLICY "Anyone can view project resources"
ON storage.objects
FOR SELECT
USING (bucket_id = 'project-resources');

CREATE POLICY "Leaders can upload project resources"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'project-resources' AND auth.role() = 'authenticated');

CREATE POLICY "Leaders can update project resources"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'project-resources' AND auth.role() = 'authenticated');

CREATE POLICY "Leaders can delete project resources"
ON storage.objects
FOR DELETE
USING (bucket_id = 'project-resources' AND auth.role() = 'authenticated');
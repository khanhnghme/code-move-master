-- Add resource_type column to distinguish between file and link resources
ALTER TABLE public.project_resources 
ADD COLUMN IF NOT EXISTS resource_type TEXT NOT NULL DEFAULT 'file';

-- Add link_url column for link-type resources
ALTER TABLE public.project_resources 
ADD COLUMN IF NOT EXISTS link_url TEXT;

-- Make file_path nullable for link-type resources (since links won't have storage path)
ALTER TABLE public.project_resources 
ALTER COLUMN file_path DROP NOT NULL;

-- Make storage_name nullable for link-type resources
ALTER TABLE public.project_resources 
ALTER COLUMN storage_name DROP NOT NULL;

-- Comment
COMMENT ON COLUMN public.project_resources.resource_type IS 'Type of resource: file or link';
COMMENT ON COLUMN public.project_resources.link_url IS 'URL for link-type resources';
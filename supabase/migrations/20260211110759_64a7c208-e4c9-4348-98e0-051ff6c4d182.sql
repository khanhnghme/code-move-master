
-- Add display_order column to project_resources for drag-drop ordering
ALTER TABLE public.project_resources ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Set initial order based on created_at
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY group_id, folder_id ORDER BY created_at) as rn
  FROM public.project_resources
)
UPDATE public.project_resources SET display_order = ordered.rn
FROM ordered WHERE public.project_resources.id = ordered.id;

-- Create function to generate Vietnamese-safe slug
CREATE OR REPLACE FUNCTION public.generate_vietnamese_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  IF input_text IS NULL OR input_text = '' THEN
    RETURN '';
  END IF;
  
  result := lower(input_text);
  
  -- Vietnamese character mappings
  result := translate(result, 
    'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ',
    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd');
  
  -- Replace non-alphanumeric with hyphens
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
  
  -- Remove leading/trailing hyphens
  result := trim(both '-' from result);
  
  -- Limit length
  result := left(result, 50);
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger function for groups slug
CREATE OR REPLACE FUNCTION public.set_group_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Only generate if slug is empty or null
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := public.generate_vietnamese_slug(NEW.name);
    new_slug := base_slug;
    
    -- Handle duplicates by adding suffix
    WHILE EXISTS (SELECT 1 FROM public.groups WHERE slug = new_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := new_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for groups
DROP TRIGGER IF EXISTS set_group_slug_trigger ON public.groups;
CREATE TRIGGER set_group_slug_trigger
  BEFORE INSERT OR UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.set_group_slug();

-- Create trigger function for tasks slug
CREATE OR REPLACE FUNCTION public.set_task_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Only generate if slug is empty or null
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := public.generate_vietnamese_slug(NEW.title);
    new_slug := base_slug;
    
    -- Handle duplicates within the same group
    WHILE EXISTS (SELECT 1 FROM public.tasks WHERE slug = new_slug AND group_id = NEW.group_id AND id != NEW.id) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := new_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tasks
DROP TRIGGER IF EXISTS set_task_slug_trigger ON public.tasks;
CREATE TRIGGER set_task_slug_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_task_slug();

-- Update existing groups with empty slugs
UPDATE public.groups 
SET slug = slug 
WHERE slug IS NULL OR slug = '';

-- Update existing tasks with empty slugs
UPDATE public.tasks 
SET slug = slug 
WHERE slug IS NULL OR slug = '';
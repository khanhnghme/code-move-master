
-- Create profile achievements table
CREATE TABLE public.profile_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_path text,
  storage_name text,
  link_url text,
  category text NOT NULL DEFAULT 'general',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_achievements ENABLE ROW LEVEL SECURITY;

-- Owner can manage own achievements
CREATE POLICY "Users can manage own achievements"
ON public.profile_achievements
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Public can view achievements of users who have a username (public profile)
CREATE POLICY "Public can view achievements of public profiles"
ON public.profile_achievements
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = profile_achievements.user_id AND p.username IS NOT NULL
));

-- Create storage bucket for achievement images
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-achievements', 'profile-achievements', true);

-- Storage RLS: anyone can view
CREATE POLICY "Public can view achievement images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-achievements');

-- Owner can upload/delete own achievement images
CREATE POLICY "Users can upload achievement images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-achievements' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own achievement images"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-achievements' AND (storage.foldername(name))[1] = auth.uid()::text);

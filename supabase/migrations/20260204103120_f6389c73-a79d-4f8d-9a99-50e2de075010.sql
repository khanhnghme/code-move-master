-- Create required storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('task-submissions', 'task-submissions', true),
  ('appeal-attachments', 'appeal-attachments', true),
  ('task-note-attachments', 'task-note-attachments', true),
  ('group-images', 'group-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for task-submissions
CREATE POLICY "Anyone can view task submissions" ON storage.objects 
  FOR SELECT TO authenticated 
  USING (bucket_id = 'task-submissions');

CREATE POLICY "Authenticated users can upload task submissions" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'task-submissions');

CREATE POLICY "Users can delete own submissions" ON storage.objects 
  FOR DELETE TO authenticated 
  USING (bucket_id = 'task-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for appeal-attachments  
CREATE POLICY "Users can view own appeal attachments" ON storage.objects 
  FOR SELECT TO authenticated 
  USING (bucket_id = 'appeal-attachments');

CREATE POLICY "Users can upload appeal attachments" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'appeal-attachments');

-- Storage policies for task-note-attachments
CREATE POLICY "Group members can view note attachments" ON storage.objects 
  FOR SELECT TO authenticated 
  USING (bucket_id = 'task-note-attachments');

CREATE POLICY "Authenticated users can upload note attachments" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'task-note-attachments');

-- Storage policies for group-images
CREATE POLICY "Anyone can view group images" ON storage.objects 
  FOR SELECT TO authenticated 
  USING (bucket_id = 'group-images');

CREATE POLICY "Authenticated users can upload group images" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'group-images');

-- Avatars policies (bucket already exists)
CREATE POLICY "Anyone can view avatars" ON storage.objects 
  FOR SELECT TO authenticated 
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar" ON storage.objects 
  FOR UPDATE TO authenticated 
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar" ON storage.objects 
  FOR DELETE TO authenticated 
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
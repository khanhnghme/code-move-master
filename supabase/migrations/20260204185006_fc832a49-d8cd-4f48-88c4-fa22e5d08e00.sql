-- Bảng lưu kết nối Google Drive của user
CREATE TABLE public.google_drive_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  google_email TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  folder_id TEXT,
  folder_name TEXT DEFAULT 'TaskFlow Backup',
  is_active BOOLEAN DEFAULT true,
  total_files_backed_up INTEGER DEFAULT 0,
  total_size_backed_up BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Bảng tracking file đã backup
CREATE TABLE public.drive_file_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES public.google_drive_connections(id) ON DELETE CASCADE NOT NULL,
  original_bucket TEXT NOT NULL,
  original_path TEXT NOT NULL,
  drive_file_id TEXT NOT NULL,
  drive_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  backed_up_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(connection_id, original_bucket, original_path)
);

-- Enable RLS
ALTER TABLE public.google_drive_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_file_backups ENABLE ROW LEVEL SECURITY;

-- RLS policies for google_drive_connections
CREATE POLICY "Admins can view drive connections"
  ON public.google_drive_connections FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert drive connections"
  ON public.google_drive_connections FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Admins can update own drive connections"
  ON public.google_drive_connections FOR UPDATE
  USING (public.is_admin(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Admins can delete own drive connections"
  ON public.google_drive_connections FOR DELETE
  USING (public.is_admin(auth.uid()) AND user_id = auth.uid());

-- RLS policies for drive_file_backups
CREATE POLICY "Admins can view drive backups"
  ON public.drive_file_backups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.google_drive_connections c
      WHERE c.id = drive_file_backups.connection_id
      AND public.is_admin(auth.uid())
    )
  );

CREATE POLICY "Admins can insert drive backups"
  ON public.drive_file_backups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.google_drive_connections c
      WHERE c.id = drive_file_backups.connection_id
      AND public.is_admin(auth.uid())
    )
  );

CREATE POLICY "Admins can delete drive backups"
  ON public.drive_file_backups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.google_drive_connections c
      WHERE c.id = drive_file_backups.connection_id
      AND public.is_admin(auth.uid())
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_google_drive_connections_updated_at
  BEFORE UPDATE ON public.google_drive_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
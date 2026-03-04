-- Cập nhật RLS policies cho bảng google_drive_connections
-- Cho phép mỗi user tự quản lý kết nối của mình

-- Xóa các policies cũ chỉ dành cho admin
DROP POLICY IF EXISTS "Admins can view drive connections" ON google_drive_connections;
DROP POLICY IF EXISTS "Admins can insert drive connections" ON google_drive_connections;
DROP POLICY IF EXISTS "Admins can update own drive connections" ON google_drive_connections;
DROP POLICY IF EXISTS "Admins can delete own drive connections" ON google_drive_connections;

-- Tạo policies mới cho phép user tự quản lý kết nối của mình
CREATE POLICY "Users can view own drive connection"
  ON google_drive_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own drive connection"
  ON google_drive_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drive connection"
  ON google_drive_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drive connection"
  ON google_drive_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Cập nhật RLS cho drive_file_backups - cho phép user xem file backup của mình
DROP POLICY IF EXISTS "Admins can view drive backups" ON drive_file_backups;
DROP POLICY IF EXISTS "Admins can insert drive backups" ON drive_file_backups;
DROP POLICY IF EXISTS "Admins can delete drive backups" ON drive_file_backups;

CREATE POLICY "Users can view own drive backups"
  ON drive_file_backups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM google_drive_connections c
      WHERE c.id = drive_file_backups.connection_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own drive backups"
  ON drive_file_backups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM google_drive_connections c
      WHERE c.id = drive_file_backups.connection_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own drive backups"
  ON drive_file_backups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM google_drive_connections c
      WHERE c.id = drive_file_backups.connection_id
      AND c.user_id = auth.uid()
    )
  );
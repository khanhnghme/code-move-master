-- Xóa chức năng Google Drive hoàn toàn

-- Xóa bảng drive_file_backups trước (có foreign key)
DROP TABLE IF EXISTS public.drive_file_backups CASCADE;

-- Xóa bảng google_drive_connections
DROP TABLE IF EXISTS public.google_drive_connections CASCADE;
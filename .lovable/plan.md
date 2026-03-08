

# Tích hợp Google Drive Upload

## Tổng quan

Tạo luồng OAuth riêng cho Google Drive bên cạnh auth chính. User nhấn nút "Upload lên Google Drive" → đăng nhập Google (1 lần) → chọn/upload file lên Drive cá nhân → hệ thống lưu link chia sẻ.

## Yêu cầu từ Admin (1 lần duy nhất)

Bạn cần tạo Google Cloud Project và cung cấp 2 key (đều là public key):
1. **GOOGLE_API_KEY** — để dùng Google Picker widget
2. **GOOGLE_CLIENT_ID** — để xin quyền Drive từ user

Hướng dẫn:
1. Vào https://console.cloud.google.com → Tạo project mới
2. Enable **Google Picker API** và **Google Drive API**
3. Tạo **API Key** (APIs & Services → Credentials → Create → API Key)
4. Tạo **OAuth Client ID** (Type: Web Application, Authorized JS Origins: thêm URL preview và URL published của bạn)
5. Cung cấp 2 key này cho hệ thống (lưu trong system_settings)

## Kiến trúc kỹ thuật

```text
User nhấn "Upload lên Drive"
       ↓
Google Identity Services → Xin quyền drive.file
       ↓
Google Picker API mở → User chọn/upload file
       ↓
Picker trả về file metadata (id, name, url, size)
       ↓
Hệ thống set file sharing = "anyone with link"
       ↓
Lưu Google Drive link vào DB (0 bytes server storage)
```

## Các file cần tạo/sửa

### 1. Tạo `src/lib/googleDrive.ts`
- Helper load Google API scripts (gapi, google.accounts.oauth2)
- Hàm `initGoogleDrive(apiKey, clientId)` 
- Hàm `openPicker(accessToken)` → trả về file metadata
- Hàm `setFilePublic(accessToken, fileId)` → set sharing permission
- Cache access token trong session

### 2. Tạo `src/components/GoogleDriveUploadButton.tsx`
- Button "Upload lên Google Drive" với icon Drive
- Quản lý OAuth flow: lần đầu xin quyền, sau đó dùng cached token
- Gọi Picker API → nhận file → set sharing → trả callback với link + metadata
- Props: `onFileSelected(driveFile: { name, url, size, driveFileId })`

### 3. Tạo `src/pages/AdminSystem.tsx` — thêm section cài đặt Google Drive
- Form nhập Google API Key và Client ID
- Lưu vào `system_settings` table (key: `google_drive_config`)
- Toggle bật/tắt tính năng Google Drive upload

### 4. Sửa `src/components/MultiFileUploadSubmission.tsx`
- Thêm nút "Upload qua Google Drive" bên cạnh nút upload file thông thường
- Khi user chọn file từ Drive → thêm vào danh sách uploaded files với type `drive_link`
- File từ Drive hiển thị icon Google Drive thay vì icon file thông thường

### 5. Sửa `src/components/ResourceUploadDialog.tsx`
- Thêm tab thứ 4 "Google Drive" vào TabsList (thành 4 cols)
- Tab mới chứa GoogleDriveUploadButton + hướng dẫn
- File từ Drive → lưu như resource với `resource_type: 'drive_link'`

### 6. DB Migration
- Thêm giá trị `google_drive_config` vào `system_settings` nếu chưa có
- Không cần thêm cột mới — dùng `submission_link` / `link_url` hiện có để lưu Drive link

## Trải nghiệm người dùng

1. Admin vào Cài đặt hệ thống → nhập Google API Key + Client ID (1 lần)
2. User mở dialog nộp bài/tải tài nguyên → nhấn "Upload lên Google Drive"
3. Lần đầu: popup Google đăng nhập + xin quyền "Quản lý file do app tạo" → User nhấn Allow
4. Google Picker mở → User chọn file có sẵn hoặc upload file mới lên Drive
5. Hệ thống tự động set file sharing public → lưu link vào DB
6. Các lần sau: không cần đăng nhập lại (token cached trong session)

## Lưu ý bảo mật
- API Key và Client ID đều là **public key** — an toàn lưu trong DB
- Scope `drive.file` chỉ cho phép app truy cập file do chính app tạo/chọn
- Không truy cập được toàn bộ Drive của user


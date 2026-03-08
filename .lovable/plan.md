

# Tích hợp Google Drive - Upload file lên Drive của người dùng

## Ý tưởng

Thay vì upload file lên server, người dùng sẽ đăng nhập Google, chọn/upload file lên **Google Drive cá nhân** của họ. Hệ thống chỉ lưu **link chia sẻ** — không tốn dung lượng server.

## Cách hoạt động

```text
User chọn file → Google Drive Picker mở lên → User chọn file từ Drive hoặc upload file mới lên Drive
                                                          ↓
                                          Hệ thống nhận link chia sẻ
                                                          ↓
                                          Lưu link vào DB (không lưu file)
```

## Phương án kỹ thuật

### Google Picker API (Client-side)

Google cung cấp **Picker API** — một widget cho phép người dùng:
- Chọn file có sẵn trên Drive
- Upload file mới lên Drive cá nhân
- Trả về metadata (link, tên, loại file)

**Yêu cầu:**
1. **Google Cloud Project** với Picker API + Drive API enabled
2. **OAuth Client ID** (loại Web Application) — đây là public key, lưu trong code được
3. **API Key** cho Picker — cũng là public key

### Các bước triển khai

1. **Tạo component `GoogleDrivePicker`**
   - Load Google Picker API script
   - Xử lý OAuth2 flow (xin quyền `drive.file` scope — chỉ truy cập file do app tạo/chọn)
   - Hiển thị Picker widget
   - Trả về file metadata (link, tên, kích thước)

2. **Tích hợp vào `MultiFileUploadSubmission`**
   - Thêm tab/button "Upload qua Google Drive" bên cạnh upload trực tiếp
   - Khi user chọn file từ Picker → lưu link như `submission_link`

3. **Tích hợp vào `ResourceUploadDialog`**
   - Thêm tab "Google Drive" bên cạnh tab File và Link hiện tại
   - File từ Drive → lưu như resource link

4. **Lưu trữ trong DB**
   - Không cần thêm bảng mới
   - Dùng trường `submission_link` / resource link hiện có
   - Thêm metadata field để phân biệt nguồn (drive vs direct upload)

### Giới hạn & Lưu ý

- User cần đăng nhập Google (có thể dùng chung với Google Sign-in nếu có)
- File phụ thuộc vào Drive của user — nếu user xóa file trên Drive, link sẽ hỏng
- Cần user tự tạo Google Cloud Project và cung cấp Client ID + API Key (vì đây là public key nên an toàn)
- Scope `drive.file` chỉ cho phép app truy cập file do chính app tạo/chọn, không truy cập toàn bộ Drive

### Thay đổi cần làm

| File | Thay đổi |
|------|----------|
| Tạo `src/components/GoogleDrivePicker.tsx` | Component wrapper cho Google Picker API |
| `src/components/MultiFileUploadSubmission.tsx` | Thêm option "Upload qua Google Drive" |
| `src/components/ResourceUploadDialog.tsx` | Thêm tab Google Drive |
| Migration SQL | Thêm cột `source_type` vào bảng liên quan (phân biệt drive/direct) |

## Câu hỏi cần xác nhận

Trước khi triển khai, bạn cần:
1. **Tạo Google Cloud Project** và enable Picker API + Drive API
2. Cung cấp **Google API Key** và **OAuth Client ID** (cả hai đều là public key)

Bạn có muốn tiến hành với phương án này không? Nếu bạn đã có Google Cloud Project, hãy cung cấp API Key và Client ID để bắt đầu.


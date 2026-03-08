

# Plan: Bỏ email khỏi tất cả luồng tạo tài khoản, bắt buộc liên kết Google lần đầu đăng nhập

## Tổng quan
Hiện tại có 3 nơi tạo tài khoản yêu cầu email:
1. **Đăng ký thành viên** (`MemberAuthForm.tsx`) — form đăng ký
2. **Admin/Leader tạo thành viên trong project** (`MemberManagementCard.tsx`) — dialog "Tạo mới"
3. **Import Excel** (`ExcelMemberImport.tsx`) — cột Email bắt buộc
4. **Edge function** (`manage-users/index.ts`) — `create_member` action

Tất cả sẽ bỏ trường email, dùng email tạm `{mssv}@teamworks.local`. Lần đầu đăng nhập → bắt buộc liên kết Google → lấy email thật.

## Thay đổi cụ thể

### 1. `MemberAuthForm.tsx` — Bỏ email + confirm password khỏi form đăng ký
- Xóa trường Email và Xác nhận mật khẩu
- Chỉ giữ: MSSV + Họ tên + Mật khẩu + Chính sách
- Khi submit: tự tạo email tạm `{mssv}@teamworks.local`

### 2. `MemberManagementCard.tsx` — Bỏ email khỏi dialog tạo thành viên
- Xóa trường Email, state `newMemberEmail`
- Khi gọi edge function: truyền email tạm `{mssv}@teamworks.local`
- Cập nhật toast thông báo không còn hiện email

### 3. `ExcelMemberImport.tsx` — Email không bắt buộc
- Cột Email thành optional (không có `*`)
- Nếu Excel không có email → tự tạo email tạm từ MSSV
- Validation không báo lỗi thiếu email nữa

### 4. `manage-users/index.ts` — Edge function tự tạo email tạm
- Nếu `create_member` không nhận email hoặc email rỗng → tự tạo `{student_id}@teamworks.local`
- Giữ nguyên các action khác

### 5. Tạo `ForceGoogleLinkScreen.tsx` — Màn hình bắt buộc liên kết Google
- Hiện khi user đăng nhập nhưng email vẫn là `@teamworks.local`
- Nút "Liên kết tài khoản Google" dùng `supabase.auth.linkIdentity({ provider: 'google' })`
- Sau khi liên kết → cập nhật email thật vào profiles
- Có nút đăng xuất

### 6. `AuthContext.tsx` — Thêm trạng thái `needsGoogleLink`
- Kiểm tra email chứa `@teamworks.local` → hiện `ForceGoogleLinkScreen`
- Render trước cả `needsProfileCompletion` và `SuspendedScreen`

### Không cần thay đổi database
- `handle_new_user` trigger và profiles table giữ nguyên


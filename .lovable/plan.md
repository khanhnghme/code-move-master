

# Chính sách hệ thống Teamworks UEH

Dựa trên phân tích chi tiết toàn bộ codebase, database schema, RLS policies, và luồng hoạt động, tôi sẽ soạn một bản **Chính sách hệ thống (System Policy)** đầy đủ bằng Markdown và cập nhật vào `system_settings` với key `system_policy`.

## Nội dung chính sách sẽ bao gồm

### 1. Giới thiệu & Phạm vi áp dụng
- Teamworks UEH là nền tảng quản lý công việc nhóm dành cho sinh viên UEH
- Áp dụng cho tất cả người dùng khi đăng ký/đăng nhập

### 2. Tài khoản & Xác thực
- Đăng ký bằng email UEH, MSSV, họ tên
- Tài khoản cần Admin duyệt trước khi sử dụng
- Mật khẩu tối thiểu 6 ký tự, bắt buộc đổi mật khẩu lần đầu nếu được tạo bởi Leader
- Không chia sẻ tài khoản, chịu trách nhiệm bảo mật

### 3. Vai trò & Quyền hạn
- **Admin**: Quản trị toàn hệ thống
- **Thành viên Nâng cao (Leader)**: Tạo và quản lý dự án
- **Thành viên**: Thực hiện task, nộp bài, xem điểm

### 4. Quy tắc sử dụng dự án
- Nội dung phù hợp, không spam
- Tuân thủ deadline
- Nộp bài đúng định dạng (file ≤ giới hạn, link hợp lệ)

### 5. Lưu trữ & Dung lượng
- Giới hạn 200MB/người dùng
- Vượt quota chỉ được nộp bằng link
- Admin không bị giới hạn

### 6. Chấm điểm & Khiếu nại
- Điểm dựa trên đóng góp task, hệ số K, bonus
- Khiếu nại trong thời hạn, kèm minh chứng

### 7. Tạm đình chỉ & Vi phạm
- Vi phạm có thể bị suspend từ 1 giờ đến vĩnh viễn
- Các hành vi vi phạm cụ thể

### 8. Bảo trì hệ thống
- Admin có quyền khóa hệ thống khi cần
- Thông báo trước khi bảo trì

### 9. Quyền riêng tư & Dữ liệu
- Dữ liệu được bảo vệ bởi RLS
- Chia sẻ công khai là tùy chọn của Leader

### 10. Điều khoản cuối
- Admin có quyền cập nhật chính sách
- Tiếp tục sử dụng = đồng ý chính sách mới

## Thực hiện

Cập nhật nội dung Markdown vào trang **Quản trị hệ thống → Chính sách hệ thống** (đã có sẵn UI editor trong `AdminSystem.tsx`). Nội dung sẽ được hiển thị cho người dùng khi đăng nhập/đăng ký thông qua `MemberAuthForm`.

**Không cần thay đổi code** — chỉ cần ghi nội dung policy vào database thông qua UI hiện có, hoặc tôi có thể tạo một migration để insert trực tiếp.


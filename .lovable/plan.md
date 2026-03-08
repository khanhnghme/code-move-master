

# Rate Limiting cho OTP

## Phân tích

Hiện tại edge function `password-reset-otp` không có giới hạn số lần gửi mã. Cần thêm rate limiting ở cả backend (edge function) và frontend (cooldown timer).

## Kế hoạch

### 1. Backend - Edge Function (`supabase/functions/password-reset-otp/index.ts`)

Trong action `send_code`, trước khi tạo mã mới, đếm số lượng mã đã gửi cho email trong khoảng thời gian gần đây:

- **Per-email**: Tối đa 3 lần gửi mã trong 15 phút. Nếu vượt quá, trả lỗi 429.
- **Cooldown**: Tối đa 1 lần mỗi 60 giây cho cùng một email (kiểm tra `created_at` của mã gần nhất).
- Query bảng `password_reset_codes` để đếm, không cần thêm bảng mới.

### 2. Frontend - MemberAuthForm (`src/components/MemberAuthForm.tsx`)

- Thêm countdown timer 60 giây sau khi gửi mã thành công.
- Disable nút "Gửi mã" trong thời gian countdown.
- Hiển thị số giây còn lại trên nút (ví dụ: "Gửi lại mã (45s)").
- Xử lý lỗi 429 từ backend và hiển thị thông báo phù hợp.

### 3. Không cần migration

Sử dụng dữ liệu có sẵn trong bảng `password_reset_codes` (cột `created_at`, `email`) để kiểm tra rate limit.


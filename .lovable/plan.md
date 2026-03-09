

## Kế hoạch: Email Digest hàng ngày - 1 email tổng hợp / user / ngày

Gộp tất cả thông tin (deadline sắp hết + task mới) vào **1 email duy nhất** cho mỗi user. Chỉ gửi khi user thực sự có task liên quan (được giao hoặc là thành viên project có task mới). Không có task = không gửi = không tốn quota.

### Ước tính quota

| Trường hợp | Emails/ngày |
|---|---|
| 20 user, chỉ 8 user có task liên quan | **~8 emails** |
| + Reset password | +5-10 |
| **Tổng** | **~13-18/ngày** (rất an toàn trong 100) |

### 1. Database Migration

- Thêm cột `email_notifications` (boolean, default true) vào `profiles`
- Tạo bảng `email_logs` (id, user_id, email_type, recipient_email, tasks_count, digest_data jsonb, sent_at) với RLS: admin SELECT, service INSERT

### 2. Insert system_settings

- Key: `email_daily_digest`, value: `{"enabled": true, "deadline_hours": 24}`

### 3. Edge Function: `supabase/functions/email-digest/index.ts`

Logic:
1. Đọc setting `email_daily_digest` → nếu `enabled = false` thì dừng
2. Query task có deadline trong X giờ tới → JOIN `task_assignments` + `profiles` → gom theo user
3. Query task được tạo trong 24h qua → JOIN `task_assignments` + `profiles` → gom theo user  
4. Merge 2 danh sách theo user_id. **User không có gì = skip hoàn toàn**
5. Check `profiles.email_notifications = true`
6. Check `email_logs`: đã gửi `daily_digest` cho user hôm nay → skip
7. Gửi 1 email HTML qua Resend, log vào `email_logs`
8. Trả về kết quả: `{sent: X, skipped: Y, total_users: Z}`

### 4. Admin System UI (thêm card mới)

Thêm card "Email Digest hàng ngày" vào trang AdminSystem:
- Switch bật/tắt toàn hệ thống (lưu `system_settings`)
- Slider chọn thời gian nhắc deadline: 12h / 24h / 48h
- Nút "Gửi ngay" → gọi edge function, hiển thị kết quả (đã gửi X email, bỏ qua Y user không có task)
- Counter: "Đã gửi X email hôm nay" (query `email_logs` WHERE sent_at > today)
- Bảng 5 lần gửi gần nhất

### 5. PersonalInfo - Toggle cho user

Thêm section "Email thông báo" với switch "Nhận email tổng hợp hàng ngày" → update `profiles.email_notifications`

### Files cần tạo/sửa

| File | Hành động |
|---|---|
| Migration SQL | Thêm cột + tạo bảng `email_logs` |
| Insert SQL | Thêm setting `email_daily_digest` |
| `supabase/functions/email-digest/index.ts` | Tạo mới |
| `supabase/config.toml` | Thêm config verify_jwt = false |
| `src/pages/AdminSystem.tsx` | Thêm card Email Digest |
| `src/pages/PersonalInfo.tsx` | Thêm toggle email |


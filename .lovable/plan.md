

## Thêm mục "Tiện ích" với trang cá nhân chi tiết (URL tùy chỉnh)

### Tổng quan
Thêm menu **"Tiện ích"** (admin-only) vào thanh điều hướng, sau mục "Quản trị". Chức năng đầu tiên: **Trang cá nhân công khai** với URL dạng `/u/khanhngh` — hiển thị thông tin chi tiết về bản thân (trường học, chuyên ngành, kỹ năng, liên kết mạng xã hội...).

### Thay đổi cần thực hiện

**1. Database**
- Thêm cột `username` (text, unique, nullable) vào bảng `profiles` — dùng làm slug cho URL cá nhân
- Thêm cột `social_links` (jsonb, default `{}`) vào `profiles` — lưu các đường liên kết (GitHub, LinkedIn, Facebook...)
- Thêm RLS policy cho phép **ai cũng xem được** trang cá nhân công khai qua username

**2. Routing (`App.tsx`)**
- Thêm route `/u/:username` → trang `PublicProfile` (public, không cần đăng nhập)
- Thêm route `/utilities` → trang `Utilities` (admin-only, protected)

**3. Navigation (`DashboardLayout.tsx`)**
- Thêm mục `{ name: 'Tiện ích', href: '/utilities', icon: Wrench, requiresAdmin: true }` sau "Quản trị"

**4. Trang mới**
- **`src/pages/Utilities.tsx`**: Trang hub tiện ích, hiển thị danh sách các công cụ (đầu tiên là "Trang cá nhân")
- **`src/pages/PublicProfile.tsx`**: Trang cá nhân công khai — hiển thị avatar, tên, trường, chuyên ngành, kỹ năng, bio, liên kết mạng xã hội. Giao diện đẹp, responsive
- **Phần chỉnh sửa trang cá nhân** trong Utilities: Form để user nhập username, chọn thông tin hiển thị, thêm liên kết mạng xã hội

**5. Logic**
- Admin mặc định có username `khanhngh` (set qua migration dựa trên email `khanhngh.ueh@gmail.com`)
- Khi truy cập `/u/khanhngh` → query profiles theo username → hiển thị trang cá nhân công khai
- Validation username: chỉ chữ thường, số, dấu gạch ngang; unique; 3-30 ký tự

### Cấu trúc file

```text
src/pages/Utilities.tsx          ← Hub tiện ích (admin)
src/pages/PublicProfile.tsx      ← Trang cá nhân công khai
```

### Giao diện trang cá nhân công khai (`/u/khanhngh`)
- Header với ảnh bìa gradient + avatar lớn
- Thông tin: Tên, MSSV, Trường/Khoa, Chuyên ngành, Khóa
- Bio / giới thiệu bản thân
- Kỹ năng (badges)
- Liên kết mạng xã hội (icons)
- Danh sách dự án công khai (nếu có)


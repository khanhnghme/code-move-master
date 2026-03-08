

# Dark Mode Toggle

## Hiện trạng
- CSS variables cho `.dark` class đã có đầy đủ trong `index.css` (line 88-139)
- Layout dùng top navigation bar (không phải sidebar), với dropdown menu user ở góc phải
- `next-themes` đã cài sẵn nhưng chưa sử dụng

## Kế hoạch

### 1. Tạo ThemeProvider wrapper
- Tạo `src/components/ThemeProvider.tsx` sử dụng `next-themes` với `attribute="class"`, `storageKey="theme"`, `defaultTheme="light"`

### 2. Wrap App trong ThemeProvider
- Trong `src/App.tsx`, wrap toàn bộ app bên trong `ThemeProvider`

### 3. Thêm nút toggle Dark Mode
- Trong `DashboardLayout.tsx`, thêm nút Moon/Sun icon vào khu vực bên phải header (cạnh NotificationBell)
- Click để chuyển đổi giữa light/dark mode
- Dùng `useTheme()` hook từ `next-themes`
- Icon: `Sun` khi dark mode, `Moon` khi light mode

### 4. Không cần migration
- Preference lưu trong localStorage bởi `next-themes` tự động


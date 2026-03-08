

# Nâng cấp AI model tạo ảnh minh họa

## Vấn đề
Edge function hiện tại dùng model `google/gemini-2.5-flash-image` (chất lượng thấp). Cần chuyển sang `google/gemini-3-pro-image-preview` (chất lượng cao nhất) để tạo ảnh đẹp hơn cho từng trang.

## Thay đổi

### 1. Cập nhật edge function `generate-intro-images`
- Đổi model từ `google/gemini-2.5-flash-image` sang `google/gemini-3-pro-image-preview`
- Cải thiện prompt chi tiết hơn cho 5 trang, mô tả rõ ràng hơn từng chức năng
- Tăng delay giữa các request (model pro chậm hơn, cần chờ lâu hơn)

### 2. Prompt mới cho từng trang

| Trang | Mô tả prompt |
|-------|-------------|
| 1 - Tổng quan | Professional 3D illustration of a modern team collaboration platform dashboard showing colorful analytics charts, task cards, team avatars with progress indicators, clean UI design |
| 2 - Quản lý Task | Vibrant 3D illustration of a Kanban board interface with colorful task cards being dragged between columns (To Do, In Progress, Done, Verified), deadline timers, file upload icons |
| 3 - Chấm điểm | Elegant 3D illustration of an automated scoring system with gold trophies, star ratings, bar chart comparisons, percentage circles, leaderboard rankings |
| 4 - Quản lý dự án | Professional 3D illustration of project management with team organization chart, timeline/gantt chart, folder structure, resource sharing icons |
| 5 - Tính năng nâng cao | Futuristic 3D illustration of AI assistant robot chatting, document export (PDF/Excel), security shield with lock, real-time notification bells, communication bubbles |

### 3. Không thay đổi
- UI Landing.tsx giữ nguyên
- Admin trigger button giữ nguyên
- Storage logic giữ nguyên


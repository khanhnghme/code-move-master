

# Redesign Popup "Giới thiệu Teamworks UEH" với hình ảnh AI

## Tổng quan
Redesign toàn bộ 5 trang trong popup giới thiệu, mỗi trang sử dụng hình minh họa được tạo bởi AI (Lovable AI - google/gemini-2.5-flash-image). Hình ảnh sẽ được generate 1 lần, lưu vào storage bucket `system-assets`, và hiển thị lại từ URL.

## Kiến trúc

```text
┌─────────────────────────────────────────────┐
│  Edge Function: generate-intro-images       │
│  - Gọi AI gateway với prompt cho 5 ảnh     │
│  - Decode base64 → upload system-assets     │
│  - Trả về 5 public URLs                    │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  system_settings: intro_images              │
│  { page1: url, page2: url, ... page5: url } │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  Landing.tsx - Popup Pages                  │
│  - Load URLs từ system_settings             │
│  - Mỗi page có hero image + nội dung mới   │
└─────────────────────────────────────────────┘
```

## Chi tiết từng trang (redesign)

Mỗi trang sẽ có layout mới: **Hero image lớn ở trên** + nội dung tóm tắt bên dưới, thay vì chỉ dùng icon và CSS mockup như hiện tại.

| Trang | Chủ đề | Prompt hình AI |
|-------|--------|----------------|
| 1 | Tổng quan hệ thống | Isometric illustration of a modern team collaboration dashboard with charts, task boards, and student avatars |
| 2 | Quản lý Task | Flat illustration of a Kanban board with colorful sticky notes, deadlines, and progress bars |
| 3 | Hệ thống chấm điểm | Illustration of a scoring/grading system with charts, stars, medals on a clean dashboard |
| 4 | Quản lý dự án | Illustration of project management with team hierarchy, timeline, file folders |
| 5 | Tính năng nâng cao | Futuristic illustration of AI assistant, chat bubbles, export reports, security shields |

## Thực hiện cụ thể

### 1. Tạo edge function `generate-intro-images`
- Gọi Lovable AI gateway với model `google/gemini-2.5-flash-image` cho 5 prompts
- Decode base64 images → upload vào `system-assets` bucket
- Lưu URLs vào `system_settings` key `intro_images`
- Chỉ generate nếu chưa có (kiểm tra key trong system_settings)

### 2. Redesign 5 page components trong `Landing.tsx`
- Mỗi page: hero image chiếm ~40% chiều cao, nội dung bên dưới được tinh gọn
- Thêm hiệu ứng fade-in cho ảnh
- Giữ lại nội dung thông tin quan trọng nhưng layout đẹp hơn, thoáng hơn
- Fallback: nếu chưa có ảnh thì hiển thị gradient placeholder

### 3. Thêm nút Admin generate ảnh
- Trong `AdminSystem.tsx`: thêm nút "Tạo ảnh minh họa AI" để trigger edge function
- Hiển thị preview 5 ảnh sau khi generate xong

## Không thay đổi
- Cấu trúc popup (header, footer nav, page tabs) giữ nguyên
- Keyboard navigation (arrow keys, Escape) giữ nguyên
- Animations slide-in giữ nguyên


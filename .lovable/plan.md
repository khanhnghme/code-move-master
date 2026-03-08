

# Cải thiện Video Nền — Gradient + Blur + Vignette + Particles

## Hiện trạng
- Dashboard: overlay đơn giản `bg-background/60`
- Landing: gradient 3 điểm nhưng vẫn khá cơ bản
- Không có blur, vignette hay particle

## Kế hoạch

### 1. Cập nhật overlay video ở Dashboard (`src/pages/Dashboard.tsx`)
- Thay overlay đơn sắc bằng **gradient đa lớp** blend màu UEH (teal → transparent → teal nhẹ)
- Thêm **CSS backdrop-filter: blur(2px)** trên overlay để video mờ nhẹ, nội dung nổi bật
- Thêm **vignette layer** (radial-gradient trong suốt ở giữa, tối dần ra rìa)

### 2. Cập nhật overlay video ở Landing (`src/pages/Landing.tsx`)
- Tương tự Dashboard: gradient đa lớp + blur nhẹ + vignette
- Giữ nguyên hiệu ứng fade-in khi video load

### 3. Thêm Particle overlay component (`src/components/VideoParticles.tsx`)
- Component nhẹ dùng CSS animation thuần (không thư viện ngoài)
- 15-20 chấm sáng nhỏ (`::after` pseudo hoặc div nhỏ) với animation float lên/xuống random
- `pointer-events-none`, z-index nằm giữa video và content
- Import vào cả Dashboard và Landing khi video bật

### 4. CSS mới trong `src/index.css`
- Thêm keyframes `float-particle` với các variation
- Class `.vignette-overlay` với radial-gradient
- Class `.video-blur-overlay` với backdrop-filter

## Tóm tắt thay đổi file
| File | Thay đổi |
|------|----------|
| `src/index.css` | Thêm keyframes particle, class vignette & blur |
| `src/components/VideoParticles.tsx` | Component mới — hạt sáng CSS thuần |
| `src/pages/Dashboard.tsx` | Overlay mới: gradient đa lớp + blur + vignette + particles |
| `src/pages/Landing.tsx` | Tương tự Dashboard |


# 🚀 HƯỚNG DẪN SETUP VÀ TÁI TẠO WEBSITE TEAMWORKS UEH
# COMPLETE REBUILD GUIDE - VERSION 6.0

> **Phiên bản:** 6.0 (MEETINGS + MAINTENANCE + POLICY + AI SCORES)  
> **Cập nhật lần cuối:** 08/03/2026  
> **Tác giả:** Nguyễn Hoàng Khánh (khanhngh.ueh@gmail.com)  
> **Đơn vị:** Trường Đại học Kinh tế TP. Hồ Chí Minh (UEH)  
> **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)

---

## 📋 MỤC LỤC CHI TIẾT

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Công nghệ & Phiên bản](#2-công-nghệ--phiên-bản)
3. [Supabase - Cấu hình chi tiết](#3-supabase---cấu-hình-chi-tiết)
   - 3.1 Tạo Project
   - 3.2 Database Schema (32 bảng)
   - 3.3 Database Functions
   - 3.4 Database Triggers
   - 3.5 Row Level Security (RLS) - CHI TIẾT TẤT CẢ POLICIES
   - 3.6 Storage Buckets & Policies
   - 3.7 Auth Configuration
4. [Edge Functions - Chi tiết code](#4-edge-functions)
5. [Biến môi trường (ENV)](#5-biến-môi-trường-env)
6. [Design System & Theming](#6-design-system--theming)
7. [Cấu trúc thư mục Source Code](#7-cấu-trúc-thư-mục-source-code)
8. [Components - Danh sách đầy đủ](#8-components---danh-sách-đầy-đủ)
9. [Pages & Routing](#9-pages--routing)
10. [Quy tắc hệ thống bắt buộc](#10-quy-tắc-hệ-thống-bắt-buộc)
11. [Hướng dẫn Setup Step-by-Step](#11-hướng-dẫn-setup-step-by-step)
12. [Tạo tài khoản Admin đầu tiên](#12-tạo-tài-khoản-admin-đầu-tiên)
13. [Checklist sau khi Setup](#13-checklist-sau-khi-setup)
14. [Những lưu ý quan trọng](#14-những-lưu-ý-quan-trọng)
15. [Troubleshooting](#15-troubleshooting)
16. [Backup & Restore](#16-backup--restore)
17. [Changelog](#17-changelog)

---

# PHẦN A: TỔNG QUAN

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Mô tả
**Teamworks UEH** là hệ thống quản lý công việc nhóm dành cho sinh viên Đại học Kinh tế TP.HCM (UEH). 

**Mục đích chính:**
- Quản lý dự án nhóm một cách minh bạch
- Phân công và theo dõi tiến độ công việc
- Tính điểm tự động dựa trên đóng góp của từng thành viên
- Hỗ trợ giao tiếp nội bộ nhóm
- Trợ lý AI thông minh hỗ trợ tra cứu thông tin

### 1.2 Chức năng chính - Chi tiết

| # | Chức năng | Mô tả chi tiết | Component chính |
|---|-----------|----------------|-----------------|
| 1 | **Đăng nhập/Đăng ký** | Email/password, MSSV login, đổi mật khẩu lần đầu | `AuthForm.tsx`, `MemberAuthForm.tsx` |
| 2 | **Dashboard** | Tổng quan dự án, thống kê nhanh | `Dashboard.tsx`, `DashboardProjectCard.tsx` |
| 3 | **Quản lý nhóm** | Tạo/sửa/xóa nhóm, thêm thành viên, phân quyền | `Groups.tsx`, `GroupDetail.tsx` |
| 4 | **Quản lý Task** | Tạo/sửa/xóa task, gán nhiều người, deadline | `TaskListView.tsx`, `TaskCard.tsx` |
| 5 | **Kanban Board** | Xem task dạng bảng, kéo thả thay đổi trạng thái | `KanbanBoard.tsx` |
| 6 | **Giai đoạn (Stage)** | Chia dự án thành giai đoạn, trọng số điểm | `StageManagement.tsx` |
| 7 | **Nộp bài** | Upload file/link, lịch sử nộp bài | `TaskSubmissionDialog.tsx`, `MultiFileUploadSubmission.tsx` |
| 8 | **Ghi chú Task** | Ghi chú nhiều phiên bản, đính kèm file | `TaskNotes.tsx`, `CompactTaskNotes.tsx` |
| 9 | **Tính điểm** | Chấm điểm task, tính điểm giai đoạn, tổng kết | `ProcessScores.tsx`, `TaskScoringDialog.tsx` |
| 10 | **Khiếu nại** | Gửi khiếu nại, đính kèm minh chứng | `AppealDialog.tsx`, `AppealReviewDialog.tsx` |
| 11 | **Tài liệu nhóm** | Upload, tổ chức thư mục | `ProjectResources.tsx` |
| 12 | **Thông báo** | Realtime, mention @user | `NotificationBell.tsx` |
| 13 | **Trò chuyện** | Chat nhóm, liên kết task | `Communication.tsx`, `TaskComments.tsx` |
| 14 | **AI Assistant** | Trợ lý AI tra cứu thông tin (tasks, meetings, scores) | `AIAssistantButton.tsx`, `AIAssistantPanel.tsx` |
| 15 | **Xuất báo cáo** | PDF/Excel: nhật ký, bảng điểm | `ProjectEvidenceExport.tsx` |
| 16 | **Chia sẻ công khai** | Public link, tùy chọn hiển thị | `ShareSettingsCard.tsx`, `PublicProjectView.tsx` |
| 17 | **Quản lý Admin** | Quản lý user, backup/restore, hệ thống | `AdminUsers.tsx`, `AdminBackup.tsx`, `AdminSystem.tsx` |
| 18 | **Tạm đình chỉ** | Suspend/unsuspend thành viên | `SuspendMemberDialog.tsx`, `SuspendedScreen.tsx` |
| 19 | **Import Excel** | Nhập danh sách thành viên từ Excel | `ExcelMemberImport.tsx` |
| 20 | **Error Logging** | Ghi nhận lỗi hệ thống tự động | `SystemErrorLogs.tsx`, `errorLogger.ts` |
| 21 | **Xem trước file** | Preview file trực tiếp trong app | `FilePreview.tsx` |
| 22 | **Họp nhóm** | Tạo/quản lý buổi họp, Jitsi video call, điểm danh, chat phòng họp | `GroupMeetings.tsx`, `CreateMeetingDialog.tsx`, `MeetingRoom.tsx` |
| 23 | **Chế độ bảo trì** | Bật/tắt bảo trì theo lịch, hiển thị cho non-admin | `MaintenanceScreen.tsx`, `AdminSystem.tsx` |
| 24 | **Chính sách hệ thống** | Soạn policy Markdown, bắt buộc đồng ý khi đăng nhập/đăng ký | `MemberAuthForm.tsx` |
| 25 | **Chuyển nhượng dự án** | Chuyển quyền sở hữu project cho thành viên khác | `ProjectTransferDialog.tsx` |

### 1.3 Đối tượng sử dụng - Chi tiết quyền

#### ADMIN (System-level)
```
✅ Đăng nhập vào hệ thống
✅ Xem tất cả dự án trong hệ thống
✅ Quản lý tất cả user (tạo, sửa, xóa, reset password)
✅ Duyệt tài khoản mới đăng ký
✅ Xem nhật ký hệ thống (system activity logs)
✅ Backup/Restore database
✅ Xem và trả lời feedback từ user
✅ Bật/tắt chế độ bảo trì (đặt lịch bắt đầu/kết thúc)
✅ Soạn và cập nhật Chính sách hệ thống (Markdown)
✅ Tất cả quyền của Leader
```

#### LEADER (Group-level)
```
✅ Tạo nhóm mới
✅ Thêm/xóa thành viên vào nhóm mình
✅ Phân quyền member trong nhóm (leader, member)
✅ Tạo/sửa/xóa giai đoạn (stage)
✅ Tạo/sửa/xóa task
✅ Gán/bỏ gán người thực hiện task
✅ Gia hạn deadline task
✅ Duyệt task (chuyển sang VERIFIED)
✅ Chấm điểm task
✅ Điều chỉnh điểm
✅ Xử lý khiếu nại
✅ Xuất báo cáo (PDF/Excel)
✅ Quản lý tài liệu dự án
✅ Cấu hình chia sẻ công khai
✅ Tạo/sửa/xóa cuộc họp nhóm
✅ Quản lý điểm danh cuộc họp
✅ Chuyển nhượng quyền sở hữu project
✅ Tất cả quyền của Member
```

#### MEMBER (Group-level)
```
✅ Xem danh sách task được gán
✅ Cập nhật trạng thái task (TODO → IN_PROGRESS → DONE)
✅ Nộp bài (upload file hoặc link)
✅ Xem lịch sử nộp bài
✅ Thêm ghi chú cho task
✅ Xem điểm cá nhân
✅ Gửi khiếu nại điểm
✅ Chat trong nhóm
✅ Mention @user
✅ Sử dụng AI Assistant
✅ Xem tài liệu dự án
✅ Cập nhật thông tin cá nhân
✅ Tham gia cuộc họp nhóm (Jitsi video call)
✅ Xem và cập nhật điểm danh cuộc họp
✅ Chat trong phòng họp
✅ Đồng ý Chính sách hệ thống khi đăng nhập/đăng ký
```

### 1.4 Luồng hoạt động chi tiết

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              LUỒNG HOẠT ĐỘNG CHÍNH                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║ 1. ONBOARDING                                                              ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                                                                  │
│  [User mới] ──▶ Đăng ký (email, MSSV, họ tên) ──▶ Xác minh email               │
│        │                                              │                         │
│        │                                              ▼                         │
│        │                                     [Chờ Admin duyệt]                  │
│        │                                              │                         │
│        │                                              ▼                         │
│        │                                     [is_approved = true]               │
│        │                                              │                         │
│        ▼                                              ▼                         │
│  [Member được Leader tạo]                    [Đăng nhập lần đầu]               │
│        │                                              │                         │
│        │ password mặc định: 123456                    │                         │
│        │ must_change_password = true                  │                         │
│        │                                              ▼                         │
│        └─────────────────────────────────▶ [Đổi mật khẩu bắt buộc]             │
│                                                       │                         │
│                                                       ▼                         │
│                                              [Upload avatar (tùy chọn)]         │
│                                                       │                         │
│                                                       ▼                         │
│                                              [Vào Dashboard]                    │
│                                                                                  │
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║ 2. TẠO VÀ QUẢN LÝ DỰ ÁN                                                    ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                                                                  │
│  [Leader] ──▶ Tạo nhóm mới ──▶ Điền thông tin (tên, mã lớp, GVHD...)          │
│        │                              │                                         │
│        │                              ▼                                         │
│        │                     [Thêm thành viên]                                  │
│        │                              │                                         │
│        │                     ┌───────┴───────┐                                  │
│        │                     ▼               ▼                                  │
│        │              [Tạo account    [Thêm user                               │
│        │               mới cho         đã có                                   │
│        │               member]         trong hệ thống]                         │
│        │                     │               │                                  │
│        │                     └───────┬───────┘                                  │
│        │                             ▼                                          │
│        │                     [Phân quyền: leader/member]                        │
│        │                             │                                          │
│        ▼                             ▼                                          │
│  [Tạo giai đoạn] ◀────────── [Cấu hình nhóm hoàn tất]                          │
│        │                                                                        │
│        ▼                                                                        │
│  [Đặt trọng số cho từng giai đoạn]                                             │
│        │                                                                        │
│        ▼                                                                        │
│  [Tạo task trong mỗi giai đoạn]                                                │
│        │                                                                        │
│        ▼                                                                        │
│  [Gán người thực hiện + đặt deadline]                                          │
│                                                                                  │
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║ 3. THỰC HIỆN CÔNG VIỆC                                                     ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                                                                  │
│  [Member nhận task] ──▶ Xem chi tiết ──▶ Chuyển TODO → IN_PROGRESS            │
│                                │                                                │
│                                ▼                                                │
│                       [Thực hiện công việc]                                     │
│                                │                                                │
│                       ┌────────┼────────┐                                       │
│                       ▼        ▼        ▼                                       │
│                 [Thêm ghi  [Chat với  [Upload                                   │
│                  chú]      nhóm]      file/link]                                │
│                       │        │        │                                       │
│                       └────────┼────────┘                                       │
│                                ▼                                                │
│                       [Chuyển IN_PROGRESS → DONE]                               │
│                                │                                                │
│                                ▼                                                │
│                       [Thông báo đến Leader]                                    │
│                                │                                                │
│                                ▼                                                │
│                       [Leader review]                                           │
│                                │                                                │
│                       ┌───────┴───────┐                                         │
│                       ▼               ▼                                         │
│               [Yêu cầu sửa]   [Duyệt: DONE → VERIFIED]                         │
│                       │               │                                         │
│                       ▼               ▼                                         │
│               [review_count++]  [Task hoàn thành]                               │
│               [Quay lại làm]                                                    │
│                                                                                  │
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║ 4. TÍNH ĐIỂM                                                               ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                                                                  │
│  [Task hoàn thành] ──▶ [Leader chấm điểm task]                                 │
│                                │                                                │
│                                ▼                                                │
│   ┌────────────────────────────────────────────────────────────┐               │
│   │ CÔNG THỨC ĐIỂM TASK:                                        │               │
│   │                                                              │               │
│   │ final_score = base_score (100)                              │               │
│   │             - late_penalty (nếu trễ deadline)               │               │
│   │             - review_penalty (5 điểm/lần sửa)               │               │
│   │             + early_bonus (+5 nếu nộp sớm 24h)              │               │
│   │             + bug_hunter_bonus (+5)                         │               │
│   │             + adjustment (điều chỉnh thủ công)              │               │
│   └────────────────────────────────────────────────────────────┘               │
│                                │                                                │
│                                ▼                                                │
│                       [Tính điểm giai đoạn]                                     │
│                                │                                                │
│   ┌────────────────────────────────────────────────────────────┐               │
│   │ CÔNG THỨC ĐIỂM GIAI ĐOẠN:                                   │               │
│   │                                                              │               │
│   │ stage_score = average(task_scores) × k_coefficient          │               │
│   │             + bonuses                                        │               │
│   │                                                              │               │
│   │ k_coefficient: hệ số phạt nếu có nhiều task trễ             │               │
│   └────────────────────────────────────────────────────────────┘               │
│                                │                                                │
│                                ▼                                                │
│                       [Tính điểm tổng kết]                                      │
│                                │                                                │
│   ┌────────────────────────────────────────────────────────────┐               │
│   │ CÔNG THỨC ĐIỂM TỔNG KẾT:                                    │               │
│   │                                                              │               │
│   │ final = Σ(stage_score × stage_weight) / Σ(stage_weight)     │               │
│   │       + final_adjustment                                     │               │
│   └────────────────────────────────────────────────────────────┘               │
│                                                                                  │
│  ╔═══════════════════════════════════════════════════════════════════════════╗  │
│  ║ 5. KHIẾU NẠI                                                               ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════╝  │
│                                                                                  │
│  [Member xem điểm] ──▶ Không đồng ý ──▶ [Gửi khiếu nại]                        │
│                                              │                                  │
│                                              ▼                                  │
│                                      [Điền lý do + upload minh chứng]          │
│                                              │                                  │
│                                              ▼                                  │
│                                      [Thông báo đến Leader]                    │
│                                              │                                  │
│                                              ▼                                  │
│                                      [Leader xem xét]                          │
│                                              │                                  │
│                                      ┌───────┴───────┐                          │
│                                      ▼               ▼                          │
│                              [Chấp nhận]      [Từ chối]                        │
│                                      │               │                          │
│                                      ▼               ▼                          │
│                              [Điều chỉnh    [Ghi lý do                         │
│                               điểm]          từ chối]                          │
│                                      │               │                          │
│                                      └───────┬───────┘                          │
│                                              ▼                                  │
│                                      [Thông báo kết quả đến Member]            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# PHẦN B: CÔNG NGHỆ

## 2. CÔNG NGHỆ & PHIÊN BẢN

### 2.1 Frontend Stack

| Công nghệ | Phiên bản | Mục đích | File cấu hình |
|-----------|-----------|----------|---------------|
| **React** | ^18.3.1 | UI Framework (SPA) | `package.json` |
| **Vite** | ^5.x | Build tool, HMR | `vite.config.ts` |
| **TypeScript** | ^5.x | Type safety | `tsconfig.json` |
| **Tailwind CSS** | ^3.x | Utility-first CSS | `tailwind.config.ts` |
| **shadcn/ui** | Latest | UI Components (Radix-based) | `components.json` |
| **TanStack Query** | ^5.90.16 | Server state, caching | Trong components |
| **React Router DOM** | ^6.30.1 | Client routing | `src/App.tsx` |
| **Lucide React** | ^0.462.0 | Icon library (1000+) | Import per component |

### 2.2 Backend Stack

| Công nghệ | Phiên bản | Mục đích | Cấu hình |
|-----------|-----------|----------|----------|
| **Supabase** | Latest | BaaS Platform | Dashboard |
| **PostgreSQL** | 15+ | Database | Managed |
| **PostgREST** | Auto | REST API | Auto-generated |
| **Deno** | 1.x | Edge Functions | `supabase/functions/` |

### 2.3 Danh sách Dependencies (package.json)

```json
{
  "dependencies": {
    "@hello-pangea/dnd": "^18.0.1",
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.11",
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-aspect-ratio": "^1.1.7",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.2",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-context-menu": "^2.2.15",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-hover-card": "^1.1.14",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-menubar": "^1.1.15",
    "@radix-ui/react-navigation-menu": "^1.2.13",
    "@radix-ui/react-popover": "^1.1.14",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-radio-group": "^1.3.7",
    "@radix-ui/react-scroll-area": "^1.2.9",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slider": "^1.3.5",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-toggle": "^1.1.9",
    "@radix-ui/react-toggle-group": "^1.1.10",
    "@radix-ui/react-tooltip": "^1.2.7",
    "@supabase/supabase-js": "^2.87.3",
    "@tanstack/react-query": "^5.90.16",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.6.0",
    "input-otp": "^1.4.2",
    "jspdf": "^4.1.0",
    "jspdf-autotable": "^5.0.7",
    "jszip": "^3.10.1",
    "lucide-react": "^0.462.0",
    "next-themes": "^0.3.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.61.1",
    "react-markdown": "^10.1.0",
    "react-resizable-panels": "^2.1.9",
    "react-router-dom": "^6.30.1",
    "recharts": "^2.15.4",
    "sonner": "^1.7.4",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.9",
    "xlsx": "^0.18.5",
    "zod": "^3.25.76"
  }
}
```

### 2.4 Mục đích từng thư viện

| Thư viện | Mục đích cụ thể | Sử dụng ở đâu |
|----------|-----------------|---------------|
| `@hello-pangea/dnd` | Kéo thả task trong Kanban | `KanbanBoard.tsx` |
| `@hookform/resolvers` | Kết nối react-hook-form với zod | Forms |
| `@radix-ui/*` | Base components cho shadcn/ui | `src/components/ui/` |
| `@supabase/supabase-js` | Supabase client | `client.ts` |
| `@tanstack/react-query` | Data fetching, caching | All data components |
| `class-variance-authority` | Variant styling | Button, Badge... |
| `clsx` + `tailwind-merge` | Conditional classes | `utils.ts` |
| `cmdk` | Command palette | Command component |
| `date-fns` | Date manipulation | Deadline, format dates |
| `jspdf` + `jspdf-autotable` | PDF export | Reports |
| `jszip` | ZIP files | Bulk export |
| `lucide-react` | Icons | Throughout app |
| `next-themes` | Dark mode | Theme provider |
| `react-day-picker` | Date picker | Calendar component |
| `react-hook-form` | Form state | All forms |
| `react-markdown` | Render markdown | AI responses |
| `recharts` | Charts | Statistics |
| `sonner` | Toast notifications | Feedback |
| `vaul` | Drawer component | Mobile drawer |
| `xlsx` | Excel export | Data export |
| `zod` | Schema validation | Form + API |

---

# PHẦN C: SUPABASE CHI TIẾT

## 3. SUPABASE - CẤU HÌNH CHI TIẾT

### 3.1 Tạo Supabase Project

#### Bước 1: Đăng ký/Đăng nhập
1. Truy cập https://supabase.com
2. Đăng nhập bằng GitHub hoặc Email

#### Bước 2: Tạo Project mới
1. Click **"New Project"**
2. Chọn Organization (hoặc tạo mới)
3. Điền thông tin:
   ```
   Project Name: teamworks-ueh
   Database Password: [Tạo mật khẩu mạnh - LƯU LẠI!]
   Region: Southeast Asia (Singapore)
   Pricing Plan: Free tier (hoặc Pro cho production)
   ```
4. Click **"Create new project"**
5. Đợi 2-3 phút

#### Bước 3: Lấy thông tin kết nối
**Vào Settings → API:**
```
Project URL:        https://[project-id].supabase.co
anon (public) key:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key:   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (⚠️ BÍ MẬT!)
```

⚠️ **BẢO MẬT:**
- ✅ `anon key` - An toàn ở client-side (đã được rate limit + RLS)
- ❌ `service_role key` - CHỈ dùng ở Edge Functions, KHÔNG BAO GIỜ lộ ra client

---

### 3.2 DATABASE SCHEMA - ĐẦY ĐỦ 28 BẢNG

#### 3.2.0 TẠO ENUM TYPES (CHẠY ĐẦU TIÊN!)

```sql
-- =============================================
-- BƯỚC 1: TẠO ENUM TYPES
-- =============================================

-- Vai trò trong hệ thống
CREATE TYPE public.app_role AS ENUM ('admin', 'leader', 'member');

-- Trạng thái phê duyệt
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Trạng thái task
CREATE TYPE public.task_status AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'VERIFIED');
```

---

#### 3.2.1 Bảng `profiles`

**Mục đích:** Lưu thông tin mở rộng của user (auth.users chỉ lưu email, password)

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  student_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  major TEXT,
  year_batch TEXT,
  skills TEXT,
  bio TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  -- Suspension fields
  suspended_until TIMESTAMPTZ,
  suspension_reason TEXT,
  suspended_at TIMESTAMPTZ,
  suspended_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Comments
COMMENT ON TABLE public.profiles IS 'Extended user profile information';
COMMENT ON COLUMN public.profiles.id IS 'Matches auth.users.id (no direct FK to avoid issues)';
COMMENT ON COLUMN public.profiles.is_approved IS 'Admin approval status';
COMMENT ON COLUMN public.profiles.must_change_password IS 'Force password change on first login';
```

**Chi tiết columns:**

| Column | Type | Nullable | Default | Mô tả | Ví dụ |
|--------|------|----------|---------|-------|-------|
| id | UUID | ❌ | - | PK, khớp auth.users.id | `a1b2c3...` |
| student_id | TEXT | ❌ | - | Mã số sinh viên | `31241570562` |
| full_name | TEXT | ❌ | - | Họ tên đầy đủ | `Nguyễn Hoàng Khánh` |
| email | TEXT | ❌ | - | Email đăng nhập | `khanhngh@ueh.edu.vn` |
| avatar_url | TEXT | ✅ | NULL | URL ảnh đại diện từ Storage | `https://...avatars/...` |
| phone | TEXT | ✅ | NULL | Số điện thoại | `0901234567` |
| major | TEXT | ✅ | NULL | Ngành học | `Marketing` |
| year_batch | TEXT | ✅ | NULL | Khóa học | `K48` |
| skills | TEXT | ✅ | NULL | Kỹ năng (comma-separated) | `Python, Excel, SPSS` |
| bio | TEXT | ✅ | NULL | Giới thiệu bản thân | `Sinh viên năm 3...` |
| is_approved | BOOLEAN | ❌ | false | Admin đã duyệt | true/false |
| must_change_password | BOOLEAN | ❌ | false | Buộc đổi mật khẩu | true/false |
| suspended_until | TIMESTAMPTZ | ✅ | NULL | Thời hạn đình chỉ | `2024-04-01T00:00:00Z` |
| suspension_reason | TEXT | ✅ | NULL | Lý do đình chỉ | `Vi phạm nội quy` |
| suspended_at | TIMESTAMPTZ | ✅ | NULL | Thời điểm bị đình chỉ | `2024-03-15T10:00:00Z` |
| suspended_by | UUID | ✅ | NULL | Người thực hiện đình chỉ | UUID |
| created_at | TIMESTAMPTZ | ❌ | now() | Thời điểm tạo | `2024-01-15T10:30:00Z` |
| updated_at | TIMESTAMPTZ | ❌ | now() | Thời điểm cập nhật | `2024-01-20T14:45:00Z` |

---

#### 3.2.2 Bảng `user_roles`

**Mục đích:** Lưu role của user (TÁCH RIÊNG vì lý do bảo mật - tránh user tự nâng quyền)

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

COMMENT ON TABLE public.user_roles IS 'User system-level roles (separate for security)';
```

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| id | UUID | ❌ | gen_random_uuid() | Primary key |
| user_id | UUID | ❌ | - | Tham chiếu đến auth.users.id |
| role | app_role | ❌ | - | admin, leader, hoặc member |
| created_at | TIMESTAMPTZ | ❌ | now() | Thời điểm gán role |

**Lưu ý quan trọng:**
- Một user có thể có nhiều role
- UNIQUE constraint đảm bảo không có duplicate
- Chỉ admin mới có thể INSERT/UPDATE/DELETE (qua RLS)

---

#### 3.2.3 Bảng `groups`

**Mục đích:** Lưu thông tin nhóm dự án

```sql
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  short_id TEXT UNIQUE,
  image_url TEXT,
  class_code TEXT,
  instructor_name TEXT,
  instructor_email TEXT,
  zalo_link TEXT,
  additional_info TEXT,
  leader_id UUID,
  created_by UUID NOT NULL,
  is_public BOOLEAN DEFAULT false,
  show_members_public BOOLEAN DEFAULT true,
  show_activity_public BOOLEAN DEFAULT true,
  show_resources_public BOOLEAN DEFAULT true,
  activity_logging_enabled BOOLEAN DEFAULT true,
  share_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_groups_slug ON public.groups(slug);
CREATE INDEX idx_groups_share_token ON public.groups(share_token);
CREATE INDEX idx_groups_created_by ON public.groups(created_by);
```

| Column | Mô tả | Ví dụ |
|--------|-------|-------|
| slug | URL-friendly name (auto-generated) | `du-an-marketing-k48` |
| short_id | Mã ngắn để chia sẻ | `GRP001` |
| image_url | Ảnh đại diện nhóm | `https://...group-images/...` |
| class_code | Mã lớp học phần | `MKT301.2` |
| instructor_name | Tên GVHD | `TS. Nguyễn Văn A` |
| instructor_email | Email GVHD | `nguyenvana@ueh.edu.vn` |
| zalo_link | Link nhóm Zalo | `https://zalo.me/g/...` |
| additional_info | Thông tin thêm | `Họp vào thứ 3 hàng tuần` |
| leader_id | ID của leader chính | UUID |
| is_public | Cho phép xem công khai | true/false |
| show_*_public | Tùy chọn hiển thị khi public | true/false |
| activity_logging_enabled | Bật/tắt ghi nhật ký | true/false |
| share_token | Token để tạo share link | `abc123xyz` |

---

#### 3.2.4 Bảng `group_members`

```sql
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
```

**Lưu ý:** 
- Role ở đây là GROUP-LEVEL role (khác với user_roles là SYSTEM-LEVEL)
- Một user có thể là member của nhiều groups với role khác nhau

---

#### 3.2.5 Bảng `stages`

```sql
CREATE TABLE public.stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  weight NUMERIC DEFAULT 1,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stages_group ON public.stages(group_id);
CREATE INDEX idx_stages_order ON public.stages(group_id, order_index);
```

| Column | Mô tả | Ví dụ |
|--------|-------|-------|
| order_index | Thứ tự hiển thị (0, 1, 2...) | 0 |
| weight | Trọng số khi tính điểm | 2.0 (gấp đôi bình thường) |
| is_hidden | Ẩn khỏi danh sách | false |

---

#### 3.2.6 Bảng `tasks`

```sql
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES stages(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT,
  short_id TEXT,
  status task_status NOT NULL DEFAULT 'TODO',
  deadline TIMESTAMPTZ,
  extended_deadline TIMESTAMPTZ,
  submission_link TEXT,
  max_file_size BIGINT DEFAULT 10485760,
  is_hidden BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_group ON public.tasks(group_id);
CREATE INDEX idx_tasks_stage ON public.tasks(stage_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_slug ON public.tasks(slug);
```

| Column | Mô tả | Ví dụ |
|--------|-------|-------|
| status | Trạng thái task | `TODO`, `IN_PROGRESS`, `DONE`, `VERIFIED` |
| deadline | Deadline gốc | `2024-03-15T23:59:00Z` |
| extended_deadline | Deadline gia hạn (nếu có) | `2024-03-17T23:59:00Z` |
| max_file_size | Giới hạn file upload (bytes) | 10485760 (10MB) |
| submission_link | Link nộp bài (nếu dùng link) | `https://drive.google.com/...` |

---

#### 3.2.7 Bảng `task_assignments`

```sql
CREATE TABLE public.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id)
);

CREATE INDEX idx_task_assignments_task ON public.task_assignments(task_id);
CREATE INDEX idx_task_assignments_user ON public.task_assignments(user_id);
```

**Relationship:** 1 Task → N Users (nhiều người được gán cùng 1 task)

---

#### 3.2.8 Bảng `submission_history`

```sql
CREATE TABLE public.submission_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  submission_link TEXT NOT NULL,
  submission_type TEXT DEFAULT 'link',
  file_name TEXT,
  file_path TEXT,
  file_size BIGINT,
  note TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_submission_task ON public.submission_history(task_id);
CREATE INDEX idx_submission_user ON public.submission_history(user_id);
CREATE INDEX idx_submission_time ON public.submission_history(submitted_at DESC);
```

| submission_type | Mô tả |
|-----------------|-------|
| `link` | Nộp bằng URL |
| `file` | Nộp bằng upload file |

---

#### 3.2.9 Bảng `task_scores`

```sql
CREATE TABLE public.task_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  base_score NUMERIC NOT NULL DEFAULT 100,
  late_penalty NUMERIC NOT NULL DEFAULT 0,
  review_penalty NUMERIC NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  early_bonus BOOLEAN NOT NULL DEFAULT false,
  bug_hunter_bonus BOOLEAN NOT NULL DEFAULT false,
  adjustment NUMERIC DEFAULT 0,
  adjustment_reason TEXT,
  adjusted_by UUID,
  adjusted_at TIMESTAMPTZ,
  final_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id)
);

CREATE INDEX idx_task_scores_task ON public.task_scores(task_id);
CREATE INDEX idx_task_scores_user ON public.task_scores(user_id);
```

**Công thức:**
```
final_score = base_score 
            - late_penalty 
            - review_penalty (review_count × 5)
            + (early_bonus ? 5 : 0) 
            + (bug_hunter_bonus ? 5 : 0)
            + adjustment
```

---

#### 3.2.10 Bảng `member_stage_scores`

```sql
CREATE TABLE public.member_stage_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  average_score NUMERIC,
  k_coefficient NUMERIC DEFAULT 1.0,
  adjusted_score NUMERIC,
  early_submission_bonus BOOLEAN NOT NULL DEFAULT false,
  bug_hunter_bonus BOOLEAN NOT NULL DEFAULT false,
  late_task_count INTEGER NOT NULL DEFAULT 0,
  final_stage_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(stage_id, user_id)
);

CREATE INDEX idx_stage_scores_stage ON public.member_stage_scores(stage_id);
CREATE INDEX idx_stage_scores_user ON public.member_stage_scores(user_id);
```

---

#### 3.2.11 Bảng `member_final_scores`

```sql
CREATE TABLE public.member_final_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  weighted_average NUMERIC,
  adjustment NUMERIC DEFAULT 0,
  final_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_final_scores_group ON public.member_final_scores(group_id);
CREATE INDEX idx_final_scores_user ON public.member_final_scores(user_id);
```

---

#### 3.2.12 Bảng `stage_weights`

```sql
CREATE TABLE public.stage_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, stage_id)
);
```

---

#### 3.2.13 Bảng `score_appeals`

```sql
CREATE TABLE public.score_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_score_id UUID REFERENCES task_scores(id),
  stage_score_id UUID REFERENCES member_stage_scores(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_id UUID,
  reviewer_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appeals_user ON public.score_appeals(user_id);
CREATE INDEX idx_appeals_status ON public.score_appeals(status);
```

| status | Mô tả |
|--------|-------|
| `pending` | Đang chờ xử lý |
| `approved` | Đã chấp nhận |
| `rejected` | Đã từ chối |

---

#### 3.2.14 Bảng `appeal_attachments`

```sql
CREATE TABLE public.appeal_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appeal_id UUID NOT NULL REFERENCES score_appeals(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  storage_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appeal_attachments ON public.appeal_attachments(appeal_id);
```

---

#### 3.2.15 Bảng `score_adjustment_history`

```sql
CREATE TABLE public.score_adjustment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_id UUID NOT NULL,
  adjustment_type TEXT NOT NULL,
  previous_score NUMERIC,
  adjustment_value NUMERIC,
  new_score NUMERIC,
  reason TEXT,
  adjusted_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_adjustment_history_user ON public.score_adjustment_history(user_id);
CREATE INDEX idx_adjustment_history_type ON public.score_adjustment_history(adjustment_type);
```

| adjustment_type | target_id tham chiếu đến |
|-----------------|-------------------------|
| `task` | task_scores.id |
| `stage` | member_stage_scores.id |
| `final` | member_final_scores.id |

---

#### 3.2.16 Bảng `task_notes`

```sql
CREATE TABLE public.task_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  version_name TEXT NOT NULL,
  content TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_notes_task ON public.task_notes(task_id);
CREATE INDEX idx_task_notes_created ON public.task_notes(created_at DESC);
```

---

#### 3.2.17 Bảng `task_note_attachments`

```sql
CREATE TABLE public.task_note_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES task_notes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  storage_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_note_attachments ON public.task_note_attachments(note_id);
```

---

#### 3.2.18 Bảng `task_comments`

```sql
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_comments_task ON public.task_comments(task_id);
CREATE INDEX idx_task_comments_parent ON public.task_comments(parent_id);
```

**Lưu ý:** `parent_id` cho phép reply comment (nested comments)

---

#### 3.2.19 Bảng `project_messages`

```sql
CREATE TABLE public.project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'chat',
  source_task_id UUID REFERENCES tasks(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_messages_group ON public.project_messages(group_id);
CREATE INDEX idx_project_messages_time ON public.project_messages(created_at DESC);
```

| source_type | Mô tả |
|-------------|-------|
| `chat` | Tin nhắn chat thông thường |
| `task_update` | Auto-generated từ task update |

---

#### 3.2.20 Bảng `message_mentions`

```sql
CREATE TABLE public.message_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  message_type TEXT NOT NULL,
  comment_id UUID REFERENCES task_comments(id),
  mentioned_user_id UUID NOT NULL,
  mentioned_by UUID NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mentions_user ON public.message_mentions(mentioned_user_id);
CREATE INDEX idx_mentions_unread ON public.message_mentions(mentioned_user_id, is_read);
```

---

#### 3.2.21 Bảng `notifications`

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  group_id UUID REFERENCES groups(id),
  task_id UUID REFERENCES tasks(id),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_time ON public.notifications(created_at DESC);
```

| type | Mô tả |
|------|-------|
| `task_assigned` | Được gán task mới |
| `task_updated` | Task được cập nhật |
| `deadline_reminder` | Nhắc deadline |
| `mention` | Được mention |
| `appeal_result` | Kết quả khiếu nại |
| `score_updated` | Điểm được cập nhật |

---

#### 3.2.22 Bảng `activity_logs`

```sql
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_group ON public.activity_logs(group_id);
CREATE INDEX idx_activity_logs_time ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_type ON public.activity_logs(action_type);
```

| action_type | Ví dụ |
|-------------|-------|
| `task_created` | Tạo task mới |
| `task_updated` | Cập nhật task |
| `task_deleted` | Xóa task |
| `task_status_changed` | Đổi trạng thái |
| `submission` | Nộp bài |
| `member_added` | Thêm thành viên |
| `member_removed` | Xóa thành viên |
| `score_updated` | Cập nhật điểm |

---

#### 3.2.23 Bảng `project_resources`

```sql
CREATE TABLE public.project_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES resource_folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL DEFAULT 'file',
  file_path TEXT,
  storage_name TEXT,
  file_type TEXT,
  file_size BIGINT NOT NULL DEFAULT 0,
  link_url TEXT,
  category TEXT DEFAULT 'general',
  display_order INTEGER DEFAULT 0,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resources_group ON public.project_resources(group_id);
CREATE INDEX idx_resources_folder ON public.project_resources(folder_id);
```

| Column | Type | Nullable | Default | Mô tả | Ví dụ |
|--------|------|----------|---------|-------|-------|
| id | UUID | ❌ | gen_random_uuid() | Primary key | |
| group_id | UUID | ❌ | - | FK → groups.id | |
| folder_id | UUID | ✅ | NULL | FK → resource_folders.id | |
| name | TEXT | ❌ | - | Tên tài liệu | `Báo cáo tuần 1` |
| description | TEXT | ✅ | NULL | Mô tả | |
| resource_type | TEXT | ❌ | 'file' | Loại: 'file' hoặc 'link' | `file` |
| file_path | TEXT | ✅ | NULL | Path trong Storage (nếu type=file) | `grp1/1706198400000.pdf` |
| storage_name | TEXT | ✅ | NULL | Tên file trong storage | `1706198400000-a7b2c3.pdf` |
| file_type | TEXT | ✅ | NULL | MIME type | `application/pdf` |
| file_size | BIGINT | ❌ | 0 | Kích thước file (bytes) | `1048576` |
| link_url | TEXT | ✅ | NULL | URL (nếu type=link) | `https://docs.google.com/...` |
| category | TEXT | ✅ | 'general' | Danh mục tài liệu | `template` |
| display_order | INTEGER | ✅ | 0 | Thứ tự hiển thị | `1` |
| uploaded_by | UUID | ❌ | - | Người upload | |
| created_at | TIMESTAMPTZ | ❌ | now() | Thời điểm tạo | |
| updated_at | TIMESTAMPTZ | ❌ | now() | Thời điểm cập nhật | |

**resource_type values:**

| Value | Mô tả |
|-------|-------|
| `file` | File upload lên Storage |
| `link` | Link URL bên ngoài |

---

#### 3.2.24 Bảng `resource_folders`

```sql
CREATE TABLE public.resource_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_folders_group ON public.resource_folders(group_id);
```

---

#### 3.2.25 Bảng `pending_approvals`

```sql
CREATE TABLE public.pending_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_pending_group ON public.pending_approvals(group_id);
CREATE INDEX idx_pending_status ON public.pending_approvals(status);
```

---

#### 3.2.26 Bảng `feedbacks`

```sql
CREATE TABLE public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  group_id UUID REFERENCES groups(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  responded_by UUID,
  responded_at TIMESTAMPTZ,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedbacks_user ON public.feedbacks(user_id);
CREATE INDEX idx_feedbacks_status ON public.feedbacks(status);
```

| type | Mô tả |
|------|-------|
| `bug` | Báo lỗi |
| `feature` | Đề xuất tính năng |
| `question` | Câu hỏi |
| `other` | Khác |

| priority | Mô tả |
|----------|-------|
| `low` | Thấp |
| `medium` | Trung bình |
| `high` | Cao |
| `urgent` | Khẩn cấp |

---

#### 3.2.27 Bảng `feedback_comments`

```sql
CREATE TABLE public.feedback_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedbacks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_comments ON public.feedback_comments(feedback_id);
```

---

#### 3.2.28 Bảng `system_error_logs`

**Mục đích:** Ghi nhận lỗi hệ thống tự động từ frontend để admin theo dõi

```sql
CREATE TABLE public.system_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL DEFAULT 'runtime',
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component TEXT,
  url TEXT,
  user_id UUID,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  occurrence_count INTEGER NOT NULL DEFAULT 1,
  last_occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_error_logs_type ON public.system_error_logs(error_type);
CREATE INDEX idx_error_logs_time ON public.system_error_logs(created_at DESC);
CREATE INDEX idx_error_logs_user ON public.system_error_logs(user_id);
```

| Column | Mô tả | Ví dụ |
|--------|-------|-------|
| error_type | Loại lỗi | `runtime`, `network`, `unhandled` |
| error_message | Thông điệp lỗi | `Cannot read property 'id'` |
| error_stack | Stack trace | `Error at Component.tsx:42` |
| component | Component gây lỗi | `TaskListView` |
| url | URL khi xảy ra lỗi | `/p/my-project` |
| occurrence_count | Số lần xảy ra | 5 |
| last_occurred_at | Lần cuối xảy ra | `2024-03-15T10:00:00Z` |

---

#### 3.2.29 Bảng `system_settings`

**Mục đích:** Lưu cấu hình hệ thống (chế độ bảo trì, chính sách hệ thống, v.v.)

```sql
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_system_settings_key ON public.system_settings(key);
```

**Các key hiện có:**

| key | Mô tả | Cấu trúc value |
|-----|--------|----------------|
| `maintenance_mode` | Chế độ bảo trì | `{ enabled: bool, message: string, start_at?: string, end_at?: string }` |
| `system_policy` | Chính sách hệ thống | `{ content: string (Markdown), updated_at: string }` |

---

#### 3.2.30 Bảng `meetings`

**Mục đích:** Quản lý cuộc họp nhóm với tích hợp Jitsi Meet

```sql
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled',
  jitsi_room_name TEXT NOT NULL,
  external_link TEXT,
  notes TEXT,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meetings_group ON public.meetings(group_id);
CREATE INDEX idx_meetings_scheduled ON public.meetings(scheduled_at);
```

| status | Mô tả |
|--------|-------|
| `scheduled` | Đã lên lịch |
| `in_progress` | Đang diễn ra |
| `completed` | Đã kết thúc |
| `cancelled` | Đã hủy |

---

#### 3.2.31 Bảng `meeting_attendance`

**Mục đích:** Điểm danh thành viên tham gia cuộc họp

```sql
CREATE TABLE public.meeting_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'absent',
  joined_at TIMESTAMPTZ,
  marked_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

CREATE INDEX idx_attendance_meeting ON public.meeting_attendance(meeting_id);
```

| status | Mô tả |
|--------|-------|
| `present` | Có mặt |
| `absent` | Vắng mặt |
| `late` | Đến trễ |
| `excused` | Có phép |

---

#### 3.2.32 Bảng `meeting_messages`

**Mục đích:** Tin nhắn chat trong phòng họp

```sql
CREATE TABLE public.meeting_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meeting_messages ON public.meeting_messages(meeting_id);
```

---

### 3.3 DATABASE FUNCTIONS

```sql
-- =============================================
-- BƯỚC 3: TẠO FUNCTIONS (SECURITY DEFINER)
-- =============================================

-- Function lấy email từ student_id
CREATE OR REPLACE FUNCTION public.get_email_by_student_id(_student_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE student_id = _student_id LIMIT 1;
$$;

-- Kiểm tra user có role cụ thể
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Kiểm tra là admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- Kiểm tra là leader (system-level)
CREATE OR REPLACE FUNCTION public.is_leader(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'leader'
  )
$$;

-- Kiểm tra là thành viên nhóm
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Kiểm tra là leader của nhóm (group-level)
CREATE OR REPLACE FUNCTION public.is_group_leader(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id
    AND group_id = _group_id
    AND role IN ('leader', 'admin')
  ) OR public.is_admin(_user_id)
$$;

-- Kiểm tra là người được gán task
CREATE OR REPLACE FUNCTION public.is_task_assignee(_user_id uuid, _task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.task_assignments
    WHERE user_id = _user_id AND task_id = _task_id
  )
$$;

-- Function tạo slug tiếng Việt
CREATE OR REPLACE FUNCTION public.generate_vietnamese_slug(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  result TEXT;
BEGIN
  IF input_text IS NULL OR input_text = '' THEN
    RETURN '';
  END IF;
  
  result := lower(input_text);
  
  -- Vietnamese character mappings
  result := translate(result, 
    'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ',
    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd');
  
  -- Replace non-alphanumeric with hyphens
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
  
  -- Trim hyphens
  result := trim(both '-' from result);
  
  -- Limit length
  result := left(result, 50);
  
  RETURN result;
END;
$$;

-- Function cập nhật updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

---

### 3.4 DATABASE TRIGGERS

```sql
-- =============================================
-- BƯỚC 4: TẠO TRIGGERS
-- =============================================

-- Trigger updated_at cho profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger updated_at cho groups
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger updated_at cho tasks
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger updated_at cho stages
CREATE TRIGGER update_stages_updated_at
  BEFORE UPDATE ON public.stages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger tạo profile khi user đăng ký
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, student_id, full_name, email, is_approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'student_id', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger auto-admin cho email cố định
CREATE OR REPLACE FUNCTION public.check_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'khanhngh.ueh@gmail.com' THEN
    UPDATE public.profiles
    SET
      is_approved = true,
      full_name = COALESCE(full_name, 'Nguyễn Hoàng Khánh'),
      email = NEW.email
    WHERE id = NEW.id;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_check_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.check_admin_user();

-- Trigger tạo slug cho groups
CREATE OR REPLACE FUNCTION public.set_group_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := public.generate_vietnamese_slug(NEW.name);
    new_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM public.groups WHERE slug = new_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := new_slug;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_group_slug_trigger
  BEFORE INSERT OR UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.set_group_slug();

-- Trigger tạo slug cho tasks
CREATE OR REPLACE FUNCTION public.set_task_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := public.generate_vietnamese_slug(NEW.title);
    new_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM public.tasks WHERE slug = new_slug AND group_id = NEW.group_id AND id != NEW.id) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := new_slug;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_task_slug_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_task_slug();
```

---

### 3.5 ROW LEVEL SECURITY (RLS) - CHI TIẾT TẤT CẢ 28 BẢNG

#### 3.5.1 Enable RLS (BẮT BUỘC!)

```sql
-- =============================================
-- BƯỚC 5: ENABLE RLS CHO TẤT CẢ 28 BẢNG
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_stage_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_final_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appeal_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_adjustment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_note_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_messages ENABLE ROW LEVEL SECURITY;
```

---

#### 3.5.2 Policies - `profiles`

**Quyền có:** SELECT, INSERT, UPDATE  
**Quyền KHÔNG có:** DELETE

```sql
-- Xem profile đã duyệt, profile bản thân, hoặc admin xem tất cả
CREATE POLICY "Users can view all approved profiles" ON public.profiles
FOR SELECT USING (
  (is_approved = true) OR (id = auth.uid()) OR is_admin(auth.uid())
);

-- Xem profile của member trong nhóm public
CREATE POLICY "Public can view profiles of public group members" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    JOIN groups g ON g.id = gm.group_id
    WHERE gm.user_id = profiles.id AND g.is_public = true AND g.show_members_public = true
  )
);

-- User tạo profile bản thân (qua trigger handle_new_user)
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (id = auth.uid());

-- User cập nhật profile bản thân
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (id = auth.uid());

-- Admin cập nhật bất kỳ profile
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE USING (is_admin(auth.uid()));
```

---

#### 3.5.3 Policies - `user_roles`

**Quyền có:** SELECT, ALL (admin only)  
**⚠️ BẢO MẬT QUAN TRỌNG:** Chỉ admin mới INSERT/UPDATE/DELETE role

```sql
-- User xem role bản thân, admin xem tất cả
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT USING (
  (user_id = auth.uid()) OR is_admin(auth.uid())
);

-- Chỉ admin mới có quyền thao tác toàn bộ
CREATE POLICY "Only admin can manage roles" ON public.user_roles
FOR ALL USING (is_admin(auth.uid()));
```

---

#### 3.5.4 Policies - `groups`

**Quyền có:** SELECT, INSERT, UPDATE, DELETE

```sql
-- Xem nhóm: member, admin, hoặc nhóm public
CREATE POLICY "Members can view their groups" ON public.groups
FOR SELECT USING (
  is_group_member(auth.uid(), id) OR is_admin(auth.uid()) OR (is_public = true)
);

-- Nhóm public có share_token → ai cũng xem được
CREATE POLICY "Public can view shared groups" ON public.groups
FOR SELECT USING (
  (is_public = true) AND (share_token IS NOT NULL)
);

-- Chỉ leader/admin tạo nhóm
CREATE POLICY "Leaders and admins can create groups" ON public.groups
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'leader'::app_role) OR is_admin(auth.uid())
);

-- Leader nhóm hoặc admin mới sửa
CREATE POLICY "Group leaders can update groups" ON public.groups
FOR UPDATE USING (is_group_leader(auth.uid(), id));

-- Leader nhóm mới xóa
CREATE POLICY "Group leaders can delete groups" ON public.groups
FOR DELETE USING (is_group_leader(auth.uid(), id));
```

---

#### 3.5.5 Policies - `group_members`

**Quyền có:** SELECT, ALL (leader)

```sql
-- Member cùng nhóm hoặc admin xem được
CREATE POLICY "Members can view group members" ON public.group_members
FOR SELECT USING (
  is_group_member(auth.uid(), group_id) OR is_admin(auth.uid())
);

-- Public xem member nếu nhóm public + show_members_public
CREATE POLICY "Public can view members of public groups" ON public.group_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_members.group_id AND g.is_public = true AND g.show_members_public = true
  )
);

-- Leader quản lý toàn bộ (thêm/xóa/sửa member)
CREATE POLICY "Leaders can manage group members" ON public.group_members
FOR ALL USING (is_group_leader(auth.uid(), group_id));
```

---

#### 3.5.6 Policies - `stages`

**Quyền có:** SELECT, ALL (leader)

```sql
-- Member nhóm hoặc admin xem
CREATE POLICY "Group members can view stages" ON public.stages
FOR SELECT USING (
  is_group_member(auth.uid(), group_id) OR is_admin(auth.uid())
);

-- Public xem stages nếu nhóm public
CREATE POLICY "Public can view stages of public groups" ON public.stages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM groups g WHERE g.id = stages.group_id AND g.is_public = true
  )
);

-- Leader quản lý toàn bộ stages
CREATE POLICY "Leaders can manage stages" ON public.stages
FOR ALL USING (is_group_leader(auth.uid(), group_id));
```

---

#### 3.5.7 Policies - `tasks`

**Quyền có:** SELECT, INSERT, UPDATE, DELETE

```sql
-- Member nhóm hoặc admin xem
CREATE POLICY "Group members can view tasks" ON public.tasks
FOR SELECT USING (
  is_group_member(auth.uid(), group_id) OR is_admin(auth.uid())
);

-- Public xem tasks nếu nhóm public
CREATE POLICY "Public can view tasks of public groups" ON public.tasks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM groups g WHERE g.id = tasks.group_id AND g.is_public = true
  )
);

-- Leader tạo task
CREATE POLICY "Leaders can create tasks" ON public.tasks
FOR INSERT WITH CHECK (is_group_leader(auth.uid(), group_id));

-- Leader sửa tất cả field
CREATE POLICY "Leaders can update all task fields" ON public.tasks
FOR UPDATE USING (is_group_leader(auth.uid(), group_id));

-- Assignee sửa status + submission
CREATE POLICY "Assignees can update task status and submission" ON public.tasks
FOR UPDATE USING (is_task_assignee(auth.uid(), id))
WITH CHECK (is_task_assignee(auth.uid(), id));

-- Leader xóa task
CREATE POLICY "Leaders can delete tasks" ON public.tasks
FOR DELETE USING (is_group_leader(auth.uid(), group_id));
```

---

#### 3.5.8 Policies - `task_assignments`

**Quyền có:** SELECT, ALL (leader)

```sql
-- Member nhóm hoặc admin xem
CREATE POLICY "Group members can view task assignments" ON public.task_assignments
FOR SELECT USING (
  (EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_assignments.task_id AND is_group_member(auth.uid(), t.group_id)
  )) OR is_admin(auth.uid())
);

-- Public xem assignments nếu nhóm public
CREATE POLICY "Public can view task assignments of public groups" ON public.task_assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN groups g ON g.id = t.group_id
    WHERE t.id = task_assignments.task_id AND g.is_public = true
  )
);

-- Leader quản lý assignments
CREATE POLICY "Leaders can manage task assignments" ON public.task_assignments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_assignments.task_id AND is_group_leader(auth.uid(), t.group_id)
  )
);
```

---

#### 3.5.9 Policies - `submission_history`

**Quyền có:** SELECT, INSERT  
**Quyền KHÔNG có:** UPDATE, DELETE

```sql
-- Member nhóm hoặc admin xem
CREATE POLICY "Group members can view submissions" ON public.submission_history
FOR SELECT USING (
  (EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = submission_history.task_id AND is_group_member(auth.uid(), t.group_id)
  )) OR is_admin(auth.uid())
);

-- Assignee, leader, hoặc admin nộp bài
CREATE POLICY "Members and leaders can insert submissions" ON public.submission_history
FOR INSERT WITH CHECK (
  (user_id = auth.uid()) AND (
    is_task_assignee(auth.uid(), task_id)
    OR (EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = submission_history.task_id AND is_group_leader(auth.uid(), t.group_id)
    ))
    OR is_admin(auth.uid())
  )
);
```

---

#### 3.5.10 Policies - `task_scores`

**Quyền có:** SELECT, ALL (leader)

```sql
-- Member nhóm hoặc admin xem
CREATE POLICY "Group members can view scores" ON public.task_scores
FOR SELECT USING (
  (EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_scores.task_id AND is_group_member(auth.uid(), t.group_id)
  )) OR is_admin(auth.uid())
);

-- Leader quản lý điểm
CREATE POLICY "Leaders can manage scores" ON public.task_scores
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_scores.task_id AND is_group_leader(auth.uid(), t.group_id)
  )
);
```

---

#### 3.5.11 Policies - `member_stage_scores`

**Quyền có:** SELECT, ALL (leader)

```sql
-- Member nhóm hoặc admin xem
CREATE POLICY "Group members can view stage scores" ON public.member_stage_scores
FOR SELECT USING (
  (EXISTS (
    SELECT 1 FROM stages s
    WHERE s.id = member_stage_scores.stage_id AND is_group_member(auth.uid(), s.group_id)
  )) OR is_admin(auth.uid())
);

-- Leader quản lý
CREATE POLICY "Leaders can manage stage scores" ON public.member_stage_scores
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM stages s
    WHERE s.id = member_stage_scores.stage_id AND is_group_leader(auth.uid(), s.group_id)
  )
);
```

---

#### 3.5.12 Policies - `member_final_scores`

**Quyền có:** SELECT, ALL (leader)

```sql
-- Member nhóm hoặc admin xem
CREATE POLICY "Group members can view final scores" ON public.member_final_scores
FOR SELECT USING (
  is_group_member(auth.uid(), group_id) OR is_admin(auth.uid())
);

-- Leader quản lý
CREATE POLICY "Leaders can manage final scores" ON public.member_final_scores
FOR ALL USING (is_group_leader(auth.uid(), group_id));
```

---

#### 3.5.13 Policies - `stage_weights`

**Quyền có:** SELECT, ALL (leader)

```sql
-- Member nhóm hoặc admin xem
CREATE POLICY "Group members can view stage weights" ON public.stage_weights
FOR SELECT USING (
  is_group_member(auth.uid(), group_id) OR is_admin(auth.uid())
);

-- Leader quản lý
CREATE POLICY "Leaders can manage stage weights" ON public.stage_weights
FOR ALL USING (is_group_leader(auth.uid(), group_id));
```

---

#### 3.5.14 Policies - `score_appeals`

**Quyền có:** SELECT, INSERT, UPDATE  
**Quyền KHÔNG có:** DELETE

```sql
-- User xem khiếu nại bản thân, admin xem tất cả
CREATE POLICY "Users can view own appeals" ON public.score_appeals
FOR SELECT USING (
  (user_id = auth.uid()) OR is_admin(auth.uid())
);

-- User tạo khiếu nại
CREATE POLICY "Users can create appeals" ON public.score_appeals
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Leader/admin xử lý khiếu nại
CREATE POLICY "Leaders can update appeals" ON public.score_appeals
FOR UPDATE USING (
  is_admin(auth.uid()) OR (reviewer_id = auth.uid())
);
```

---

#### 3.5.15 Policies - `appeal_attachments`

**Quyền có:** SELECT, ALL (owner)

```sql
-- User xem attachment của khiếu nại mình hoặc admin
CREATE POLICY "Users can view appeal attachments" ON public.appeal_attachments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM score_appeals a
    WHERE a.id = appeal_attachments.appeal_id AND (a.user_id = auth.uid() OR is_admin(auth.uid()))
  )
);

-- User quản lý attachment của khiếu nại mình
CREATE POLICY "Users can manage own appeal attachments" ON public.appeal_attachments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM score_appeals a
    WHERE a.id = appeal_attachments.appeal_id AND a.user_id = auth.uid()
  )
);
```

---

#### 3.5.16 Policies - `score_adjustment_history`

**Quyền có:** SELECT, INSERT  
**Quyền KHÔNG có:** UPDATE, DELETE

```sql
-- Admin hoặc user xem lịch sử điểm bản thân
CREATE POLICY "Group members can view score history" ON public.score_adjustment_history
FOR SELECT USING (
  is_admin(auth.uid()) OR (user_id = auth.uid())
);

-- Admin hoặc leader ghi lịch sử
CREATE POLICY "Leaders can insert score history" ON public.score_adjustment_history
FOR INSERT WITH CHECK (
  is_admin(auth.uid()) OR (adjusted_by = auth.uid())
);
```

---

#### 3.5.17 Policies - `task_notes`

**Quyền có:** SELECT, INSERT, UPDATE, DELETE (tất cả authenticated)

```sql
CREATE POLICY "Anyone can view task notes" ON public.task_notes
FOR SELECT USING (true);

CREATE POLICY "Anyone can create task notes" ON public.task_notes
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update task notes" ON public.task_notes
FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete task notes" ON public.task_notes
FOR DELETE USING (true);
```

> **Lưu ý:** Các policy này cho phép tất cả authenticated users. RLS chỉ chặn anonymous. Quyền truy cập thực tế được kiểm soát bởi logic frontend (chỉ member nhóm mới thấy task → mới thấy notes).

---

#### 3.5.18 Policies - `task_note_attachments`

**Quyền có:** SELECT, INSERT, DELETE, ALL (tất cả authenticated)

```sql
CREATE POLICY "Anyone can view note attachments" ON public.task_note_attachments
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert note attachments" ON public.task_note_attachments
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete note attachments" ON public.task_note_attachments
FOR DELETE USING (true);

CREATE POLICY "Anyone can manage note attachments" ON public.task_note_attachments
FOR ALL USING (true);
```

---

#### 3.5.19 Policies - `task_comments`

**Quyền có:** SELECT, INSERT, UPDATE, DELETE

```sql
-- Member nhóm hoặc admin xem
CREATE POLICY "Group members can view comments" ON public.task_comments
FOR SELECT USING (
  (EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_comments.task_id AND is_group_member(auth.uid(), t.group_id)
  )) OR is_admin(auth.uid())
);

-- Member nhóm viết comment
CREATE POLICY "Group members can insert comments" ON public.task_comments
FOR INSERT WITH CHECK (
  (EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_comments.task_id AND is_group_member(auth.uid(), t.group_id)
  )) AND (user_id = auth.uid())
);

-- User sửa comment bản thân
CREATE POLICY "Users can update own comments" ON public.task_comments
FOR UPDATE USING (user_id = auth.uid());

-- User xóa comment bản thân hoặc leader xóa
CREATE POLICY "Users and leaders can delete comments" ON public.task_comments
FOR DELETE USING (
  (user_id = auth.uid()) OR (EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_comments.task_id AND is_group_leader(auth.uid(), t.group_id)
  ))
);
```

---

#### 3.5.20 Policies - `project_messages`

**Quyền có:** SELECT, INSERT, UPDATE, DELETE

```sql
-- Member nhóm hoặc admin xem
CREATE POLICY "Group members can view messages" ON public.project_messages
FOR SELECT USING (
  is_group_member(auth.uid(), group_id) OR is_admin(auth.uid())
);

-- Member nhóm gửi tin nhắn (chỉ với user_id = auth.uid())
CREATE POLICY "Group members can insert messages" ON public.project_messages
FOR INSERT WITH CHECK (
  is_group_member(auth.uid(), group_id) AND (user_id = auth.uid())
);

-- User sửa tin nhắn bản thân
CREATE POLICY "Users can update own messages" ON public.project_messages
FOR UPDATE USING (user_id = auth.uid());

-- User xóa tin nhắn bản thân hoặc leader xóa
CREATE POLICY "Users can delete own messages" ON public.project_messages
FOR DELETE USING (
  (user_id = auth.uid()) OR is_group_leader(auth.uid(), group_id)
);
```

---

#### 3.5.21 Policies - `message_mentions`

**Quyền có:** SELECT, INSERT, UPDATE  
**Quyền KHÔNG có:** DELETE

```sql
-- User xem mention bản thân, hoặc admin
CREATE POLICY "Users can view own mentions" ON public.message_mentions
FOR SELECT USING (
  (mentioned_user_id = auth.uid()) OR (mentioned_by = auth.uid()) OR is_admin(auth.uid())
);

-- User tạo mention
CREATE POLICY "Users can insert mentions" ON public.message_mentions
FOR INSERT WITH CHECK (mentioned_by = auth.uid());

-- User cập nhật mention bản thân (đánh dấu đã đọc)
CREATE POLICY "Users can update own mentions" ON public.message_mentions
FOR UPDATE USING (mentioned_user_id = auth.uid());
```

---

#### 3.5.22 Policies - `notifications`

**Quyền có:** SELECT, INSERT, UPDATE, DELETE

```sql
-- User xem thông báo bản thân
CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

-- Hệ thống tạo thông báo (cho mọi authenticated user)
CREATE POLICY "System can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

-- User cập nhật thông báo bản thân (đánh dấu đã đọc)
CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (user_id = auth.uid());

-- User xóa thông báo bản thân
CREATE POLICY "Users can delete own notifications" ON public.notifications
FOR DELETE USING (user_id = auth.uid());
```

---

#### 3.5.23 Policies - `activity_logs`

**Quyền có:** SELECT, INSERT, DELETE  
**Quyền KHÔNG có:** UPDATE

```sql
-- Leader/admin xem nhật ký
CREATE POLICY "Leaders and admins can view activity logs" ON public.activity_logs
FOR SELECT USING (
  is_admin(auth.uid()) OR has_role(auth.uid(), 'leader'::app_role)
);

-- Public xem nhật ký nếu nhóm public + show_activity_public
CREATE POLICY "Public can view activity logs of public groups" ON public.activity_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = activity_logs.group_id AND g.is_public = true AND g.show_activity_public = true
  )
);

-- Leader/admin hoặc user bản thân ghi nhật ký
CREATE POLICY "Leaders and admins can insert activity logs" ON public.activity_logs
FOR INSERT WITH CHECK (
  is_admin(auth.uid()) OR has_role(auth.uid(), 'leader'::app_role) OR (user_id = auth.uid())
);

-- Leader/admin xóa nhật ký
CREATE POLICY "Leaders and admins can delete activity logs" ON public.activity_logs
FOR DELETE USING (
  is_admin(auth.uid()) OR has_role(auth.uid(), 'leader'::app_role)
);
```

---

#### 3.5.24 Policies - `project_resources`

**Quyền có:** SELECT, INSERT, UPDATE, DELETE

```sql
-- Member nhóm hoặc admin xem
CREATE POLICY "Group members can view resources" ON public.project_resources
FOR SELECT USING (
  is_group_member(auth.uid(), group_id) OR is_admin(auth.uid())
);

-- Public xem tài liệu nếu nhóm public + show_resources_public
CREATE POLICY "Public can view resources of public groups" ON public.project_resources
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = project_resources.group_id AND g.is_public = true AND g.show_resources_public = true
  )
);

-- Leader upload tài liệu
CREATE POLICY "Leaders can insert resources" ON public.project_resources
FOR INSERT WITH CHECK (
  is_group_leader(auth.uid(), group_id) AND (uploaded_by = auth.uid())
);

-- Leader sửa tài liệu
CREATE POLICY "Leaders can update resources" ON public.project_resources
FOR UPDATE USING (is_group_leader(auth.uid(), group_id));

-- Leader xóa tài liệu
CREATE POLICY "Leaders can delete resources" ON public.project_resources
FOR DELETE USING (is_group_leader(auth.uid(), group_id));
```

---

#### 3.5.25 Policies - `resource_folders`

**Quyền có:** SELECT, INSERT, UPDATE, DELETE

```sql
-- Member nhóm xem thư mục
CREATE POLICY "Group members can view folders" ON public.resource_folders
FOR SELECT USING (is_group_member(auth.uid(), group_id));

-- Public xem thư mục nếu nhóm public + show_resources_public
CREATE POLICY "Public can view folders of public groups" ON public.resource_folders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = resource_folders.group_id AND g.is_public = true AND g.show_resources_public = true
  )
);

-- Leader tạo thư mục
CREATE POLICY "Group leaders can create folders" ON public.resource_folders
FOR INSERT WITH CHECK (is_group_leader(auth.uid(), group_id));

-- Leader sửa thư mục
CREATE POLICY "Group leaders can update folders" ON public.resource_folders
FOR UPDATE USING (is_group_leader(auth.uid(), group_id));

-- Leader xóa thư mục
CREATE POLICY "Group leaders can delete folders" ON public.resource_folders
FOR DELETE USING (is_group_leader(auth.uid(), group_id));
```

---

#### 3.5.26 Policies - `pending_approvals`

**Quyền có:** SELECT, INSERT, UPDATE  
**Quyền KHÔNG có:** DELETE

```sql
-- User xem yêu cầu bản thân, leader nhóm, hoặc admin
CREATE POLICY "Users can view own approval requests" ON public.pending_approvals
FOR SELECT USING (
  (user_id = auth.uid()) OR is_group_leader(auth.uid(), group_id) OR is_admin(auth.uid())
);

-- User tạo yêu cầu
CREATE POLICY "Users can create approval requests" ON public.pending_approvals
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Leader/admin xử lý yêu cầu
CREATE POLICY "Leaders can process approval requests" ON public.pending_approvals
FOR UPDATE USING (
  is_group_leader(auth.uid(), group_id) OR is_admin(auth.uid())
);
```

---

#### 3.5.27 Policies - `feedbacks`

**Quyền có:** SELECT, INSERT, UPDATE  
**Quyền KHÔNG có:** DELETE

```sql
-- User xem feedback bản thân, admin xem tất cả
CREATE POLICY "Users can view own feedbacks" ON public.feedbacks
FOR SELECT USING (
  (user_id = auth.uid()) OR is_admin(auth.uid())
);

-- User tạo feedback
CREATE POLICY "Users can create feedbacks" ON public.feedbacks
FOR INSERT WITH CHECK (user_id = auth.uid());

-- User sửa feedback bản thân, admin sửa tất cả
CREATE POLICY "Users can update own feedbacks" ON public.feedbacks
FOR UPDATE USING (
  (user_id = auth.uid()) OR is_admin(auth.uid())
);
```

---

#### 3.5.28 Policies - `feedback_comments`

**Quyền có:** SELECT, INSERT  
**Quyền KHÔNG có:** UPDATE, DELETE

```sql
-- Xem comment nếu thuộc feedback bản thân hoặc admin
CREATE POLICY "Users can view feedback comments" ON public.feedback_comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM feedbacks f
    WHERE f.id = feedback_comments.feedback_id AND (f.user_id = auth.uid() OR is_admin(auth.uid()))
  )
);

-- Gửi comment vào feedback bản thân hoặc admin
CREATE POLICY "Users can insert feedback comments" ON public.feedback_comments
FOR INSERT WITH CHECK (
  (EXISTS (
    SELECT 1 FROM feedbacks f
    WHERE f.id = feedback_comments.feedback_id AND (f.user_id = auth.uid() OR is_admin(auth.uid()))
  )) AND (user_id = auth.uid())
);
```

---

#### 3.5.29 Policies - `system_error_logs`

**Quyền có:** SELECT (admin), INSERT (tất cả), DELETE (admin)  
**Quyền KHÔNG có:** UPDATE

```sql
-- Admin xem log lỗi
CREATE POLICY "Admins can read error logs" ON public.system_error_logs
FOR SELECT USING (is_admin(auth.uid()));

-- Tất cả user (kể cả anonymous) ghi log lỗi
CREATE POLICY "Anon can insert error logs" ON public.system_error_logs
FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can insert error logs" ON public.system_error_logs
FOR INSERT WITH CHECK (true);

-- Admin xóa log lỗi
CREATE POLICY "Admins can delete error logs" ON public.system_error_logs
FOR DELETE USING (is_admin(auth.uid()));
```

---

#### 3.5.30 Policies - `system_settings`

**Quyền có:** SELECT (tất cả), ALL (admin)

```sql
-- Tất cả user đọc system settings (cho maintenance mode, policy)
CREATE POLICY "Anyone can read system settings" ON public.system_settings
FOR SELECT USING (true);

-- Chỉ admin sửa system settings
CREATE POLICY "Only admin can modify system settings" ON public.system_settings
FOR ALL USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
```

---

#### 3.5.31 Policies - `meetings`

**Quyền có:** SELECT (member/admin), ALL (leader)

```sql
-- Thành viên nhóm xem cuộc họp
CREATE POLICY "Group members can view meetings" ON public.meetings
FOR SELECT USING (
  is_group_member(auth.uid(), group_id) OR is_admin(auth.uid())
);

-- Leader quản lý cuộc họp
CREATE POLICY "Leaders can manage meetings" ON public.meetings
FOR ALL USING (is_group_leader(auth.uid(), group_id));
```

---

#### 3.5.32 Policies - `meeting_attendance`

**Quyền có:** SELECT (member/admin), ALL (leader), UPDATE (self)

```sql
-- Thành viên nhóm xem điểm danh
CREATE POLICY "Group members can view attendance" ON public.meeting_attendance
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = meeting_attendance.meeting_id
    AND (is_group_member(auth.uid(), m.group_id) OR is_admin(auth.uid()))
  )
);

-- Leader quản lý điểm danh
CREATE POLICY "Leaders can manage attendance" ON public.meeting_attendance
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = meeting_attendance.meeting_id
    AND is_group_leader(auth.uid(), m.group_id)
  )
);

-- Thành viên tự cập nhật điểm danh
CREATE POLICY "Members can update own attendance" ON public.meeting_attendance
FOR UPDATE USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

---

#### 3.5.33 Policies - `meeting_messages`

**Quyền có:** SELECT (member/admin), INSERT (member), DELETE (self/leader)  
**Quyền KHÔNG có:** UPDATE

```sql
-- Thành viên nhóm xem tin nhắn
CREATE POLICY "Group members can view meeting messages" ON public.meeting_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = meeting_messages.meeting_id
    AND (is_group_member(auth.uid(), m.group_id) OR is_admin(auth.uid()))
  )
);

-- Thành viên nhóm gửi tin nhắn
CREATE POLICY "Group members can insert meeting messages" ON public.meeting_messages
FOR INSERT WITH CHECK (
  (user_id = auth.uid()) AND EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = meeting_messages.meeting_id
    AND is_group_member(auth.uid(), m.group_id)
  )
);

-- Xóa tin nhắn (bản thân hoặc leader)
CREATE POLICY "Leaders can delete meeting messages" ON public.meeting_messages
FOR DELETE USING (
  (user_id = auth.uid()) OR EXISTS (
    SELECT 1 FROM meetings m
    WHERE m.id = meeting_messages.meeting_id
    AND is_group_leader(auth.uid(), m.group_id)
  )
);
```

---

#### 3.5.34 BẢNG TỔNG HỢP QUYỀN RLS

| # | Bảng | SELECT | INSERT | UPDATE | DELETE |
|---|------|--------|--------|--------|--------|
| 1 | profiles | approved/self/admin | self | self/admin | ❌ |
| 2 | user_roles | self/admin | admin | admin | admin |
| 3 | groups | member/admin/public | leader/admin | leader | leader |
| 4 | group_members | member/admin/public | leader | leader | leader |
| 5 | stages | member/admin/public | leader | leader | leader |
| 6 | tasks | member/admin/public | leader | leader/assignee | leader |
| 7 | task_assignments | member/admin/public | leader | leader | leader |
| 8 | submission_history | member/admin | assignee/leader/admin | ❌ | ❌ |
| 9 | task_scores | member/admin | leader | leader | leader |
| 10 | member_stage_scores | member/admin | leader | leader | leader |
| 11 | member_final_scores | member/admin | leader | leader | leader |
| 12 | stage_weights | member/admin | leader | leader | leader |
| 13 | score_appeals | self/admin | self | leader/admin | ❌ |
| 14 | appeal_attachments | self/admin | self | self | self |
| 15 | score_adjustment_history | self/admin | leader/admin | ❌ | ❌ |
| 16 | task_notes | all | all | all | all |
| 17 | task_note_attachments | all | all | all | all |
| 18 | task_comments | member/admin | member (self) | self | self/leader |
| 19 | project_messages | member/admin | member (self) | self | self/leader |
| 20 | message_mentions | self/admin | self | self | ❌ |
| 21 | notifications | self | all | self | self |
| 22 | activity_logs | leader/admin/public | leader/admin/self | ❌ | leader/admin |
| 23 | project_resources | member/admin/public | leader | leader | leader |
| 24 | resource_folders | member/public | leader | leader | leader |
| 25 | pending_approvals | self/leader/admin | self | leader/admin | ❌ |
| 26 | feedbacks | self/admin | self | self/admin | ❌ |
| 27 | feedback_comments | self/admin | self/admin | ❌ | ❌ |
| 28 | system_error_logs | admin | all | ❌ | admin |
| 29 | system_settings | all | admin | admin | admin |
| 30 | meetings | member/admin | leader | leader | leader |
| 31 | meeting_attendance | member/admin | leader | leader/self | leader |
| 32 | meeting_messages | member/admin | member (self) | ❌ | self/leader |

---

### 3.6 SUPABASE STORAGE - CHI TIẾT ĐẦY ĐỦ

> ⚠️ **QUAN TRỌNG:** Dự án này SỬ DỤNG SUPABASE STORAGE để lưu trữ tất cả file. Không sử dụng bất kỳ dịch vụ storage nào khác.

> 📝 **CHANGELOG STORAGE:**  
> - **04/02/2026**: Khởi tạo 6 buckets (avatars, group-images, task-submissions, task-note-attachments, appeal-attachments, project-resources)  
> - Mọi thay đổi về storage (thêm/xóa bucket, đổi quyền, đổi cách lưu) **BẮT BUỘC** phải cập nhật vào phần này

---

#### 3.6.1 TỔNG QUAN STORAGE

| # | Bucket Name | Public | Mô tả chi tiết | Component sử dụng |
|---|-------------|--------|----------------|-------------------|
| 1 | `avatars` | ✅ Yes | Ảnh đại diện người dùng | `AvatarUpload.tsx`, `PersonalInfo.tsx` |
| 2 | `group-images` | ✅ Yes | Ảnh cover/banner của nhóm | `GroupInfoCard.tsx` |
| 3 | `task-submissions` | ✅ Yes | File nộp bài của task | `MultiFileUploadSubmission.tsx`, `TaskSubmissionDialog.tsx` |
| 4 | `task-note-attachments` | ✅ Yes | File đính kèm trong ghi chú task | `TaskNotes.tsx`, `CompactTaskNotes.tsx` |
| 5 | `appeal-attachments` | ✅ Yes | Minh chứng đính kèm khiếu nại điểm | `ProcessScores.tsx`, `AppealReviewDialog.tsx` |
| 6 | `project-resources` | ✅ Yes | Tài liệu dự án, file chia sẻ nhóm | `ProjectResources.tsx` |

---

#### 3.6.2 CHI TIẾT TỪNG BUCKET

##### 📁 BUCKET 1: `avatars`

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên bucket** | `avatars` |
| **Public/Private** | PUBLIC (ai cũng xem được URL) |
| **Mục đích** | Lưu ảnh đại diện của user |
| **Giới hạn file** | Max 2MB, chỉ ảnh (jpg, png, gif, webp) |
| **Liên kết DB** | `profiles.avatar_url` lưu public URL |

**Naming Convention:**
```
{user_id}/{timestamp}.{extension}
```

**Ví dụ path thực tế:**
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890/1706198400000.png
```

**Component sử dụng:**
- `src/components/AvatarUpload.tsx` - Upload/delete avatar
- `src/pages/PersonalInfo.tsx` - Hiển thị và cập nhật avatar

**Flow hoạt động:**
```
1. User chọn ảnh → AvatarUpload.tsx
2. Validate: size ≤ 2MB, type = image/*
3. Xóa ảnh cũ (nếu có) từ storage
4. Upload ảnh mới: supabase.storage.from('avatars').upload(...)
5. Lấy public URL: supabase.storage.from('avatars').getPublicUrl(...)
6. Update profiles.avatar_url = public URL
```

---

##### 📁 BUCKET 2: `group-images`

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên bucket** | `group-images` |
| **Public/Private** | PUBLIC |
| **Mục đích** | Ảnh cover/banner/logo của nhóm |
| **Giới hạn file** | Max 5MB, chỉ ảnh |
| **Liên kết DB** | `groups.image_url` lưu public URL |

**Naming Convention:**
```
{group_id}/{timestamp}.{extension}
```

**Ví dụ path thực tế:**
```
x1y2z3a4-b5c6-7890-defg-hi1234567890/1706198400000.jpg
```

**Component sử dụng:**
- `src/components/GroupInfoCard.tsx` - Upload ảnh nhóm

**Ai có quyền:**
- SELECT: Tất cả (public)
- INSERT: Leader của nhóm đó
- UPDATE: Leader của nhóm đó
- DELETE: Leader của nhóm đó hoặc Admin

---

##### 📁 BUCKET 3: `task-submissions`

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên bucket** | `task-submissions` |
| **Public/Private** | PUBLIC |
| **Mục đích** | Lưu file nộp bài cho các task |
| **Giới hạn file** | Cấu hình trong `tasks.max_file_size` (mặc định 10MB, tối đa 100MB) |
| **Liên kết DB** | `submission_history.file_path`, `submission_history.file_name`, `submission_history.file_size` |

**Naming Convention:**
```
{user_id}/{task_id}/{uuid}.{extension}
```

**Ví dụ path thực tế:**
```
a1b2c3d4/e5f6g7h8/550e8400-e29b-41d4-a716-446655440000.pdf
```

**Component sử dụng:**
- `src/components/MultiFileUploadSubmission.tsx` - Upload multi-file
- `src/components/TaskSubmissionDialog.tsx` - Dialog nộp bài
- `src/components/SubmissionHistoryPopup.tsx` - Xem lịch sử nộp bài

**Flow hoạt động:**
```
1. Member chọn file(s) để nộp
2. Validate: tổng size ≤ task.max_file_size
3. Generate safe storage name: {uuid}.{ext}
4. Upload: supabase.storage.from('task-submissions').upload(...)
5. Insert vào submission_history với submission_type = 'file'
6. Nếu upload fail → rollback: xóa các file đã upload
```

**Ai có quyền:**
- SELECT: Tất cả authenticated users (để xem file của nhóm)
- INSERT: Authenticated users
- DELETE: Owner của file hoặc Admin

---

##### 📁 BUCKET 4: `task-note-attachments`

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên bucket** | `task-note-attachments` |
| **Public/Private** | PUBLIC |
| **Mục đích** | File đính kèm trong ghi chú task |
| **Giới hạn file** | Max 10MB/file |
| **Liên kết DB** | `task_note_attachments.file_path`, `task_note_attachments.file_name`, `task_note_attachments.storage_name` |

**Naming Convention:**
```
{task_id}/{note_id}/{timestamp}_{safe_filename}.{extension}
```

**Ví dụ path thực tế:**
```
task123/note456/1706198400000_screenshot.png
```

**Component sử dụng:**
- `src/components/TaskNotes.tsx` - Quản lý ghi chú
- `src/components/CompactTaskNotes.tsx` - Ghi chú dạng compact

**Flow hoạt động:**
```
1. User tạo/edit ghi chú và chọn file đính kèm
2. Upload: supabase.storage.from('task-note-attachments').upload(...)
3. Insert vào task_note_attachments
4. Khi xóa note → cascade delete attachments + remove from storage
```

**Ai có quyền:**
- SELECT: Group members
- INSERT: Task assignees hoặc Group leaders
- DELETE: Task assignees hoặc Group leaders

---

##### 📁 BUCKET 5: `appeal-attachments`

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên bucket** | `appeal-attachments` |
| **Public/Private** | PUBLIC |
| **Mục đích** | Minh chứng đính kèm khi khiếu nại điểm |
| **Giới hạn file** | Max 5MB/file |
| **Liên kết DB** | `appeal_attachments.file_path`, `appeal_attachments.file_name`, `appeal_attachments.storage_name` |

**Naming Convention:**
```
{user_id}/{appeal_id}/{timestamp}_{filename}.{extension}
```

**Ví dụ path thực tế:**
```
user123/appeal456/1706198400000_evidence.pdf
```

**Component sử dụng:**
- `src/components/scores/ProcessScores.tsx` - Tạo khiếu nại + upload file
- `src/components/scores/AppealReviewDialog.tsx` - Review khiếu nại + xem file

**Flow hoạt động:**
```
1. User gửi khiếu nại với file minh chứng
2. Upload: supabase.storage.from('appeal-attachments').upload(...)
3. Insert vào appeal_attachments
4. Leader/Admin review: tạo signed URL để xem/tải
```

**Ai có quyền:**
- SELECT: Owner khiếu nại hoặc Admin
- INSERT: Authenticated users (chủ khiếu nại)
- DELETE: Owner hoặc Admin

---

##### 📁 BUCKET 6: `project-resources`

| Thuộc tính | Giá trị |
|------------|---------|
| **Tên bucket** | `project-resources` |
| **Public/Private** | PUBLIC |
| **Mục đích** | Tài liệu dự án, file chia sẻ trong nhóm |
| **Giới hạn file** | Max 50MB/file |
| **Liên kết DB** | `project_resources.file_path`, `project_resources.storage_name`, `project_resources.folder_id` |

**Naming Convention:**
```
{group_id}/{timestamp}-{random}.{extension}
```

**Ví dụ path thực tế:**
```
group123/1706198400000-a7b2c3.docx
```

**Component sử dụng:**
- `src/components/ProjectResources.tsx` - Quản lý tài liệu nhóm

**Categories hỗ trợ:**
| Value | Label | Màu |
|-------|-------|-----|
| `general` | Tài liệu chung | Blue |
| `template` | Mẫu/Template | Purple |
| `reference` | Tham khảo | Green |
| `guide` | Hướng dẫn | Orange |
| `plugin` | Plugin/Công cụ | Pink |

**Flow hoạt động:**
```
1. Leader upload file → chọn category, mô tả
2. Upload: supabase.storage.from('project-resources').upload(...)
3. Get public URL
4. Insert vào project_resources với folder_id (nếu có)
5. Có thể tổ chức vào resource_folders
```

**Ai có quyền:**
- SELECT: Tất cả (public URL) hoặc Group members (qua DB)
- INSERT: Group leaders
- DELETE: Group leaders hoặc Admin

---

#### 3.6.3 TẠO BUCKETS (SQL)

```sql
-- =============================================
-- BƯỚC 6: TẠO STORAGE BUCKETS
-- =============================================
-- Chạy trong SQL Editor của Supabase Dashboard

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('group-images', 'group-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('task-submissions', 'task-submissions', true, 104857600, NULL),
  ('task-note-attachments', 'task-note-attachments', true, 10485760, NULL),
  ('appeal-attachments', 'appeal-attachments', true, 5242880, NULL),
  ('project-resources', 'project-resources', true, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
```

**Giải thích:**
- `file_size_limit`: Bytes (2097152 = 2MB, 104857600 = 100MB)
- `allowed_mime_types`: NULL = cho phép tất cả loại file
- `public = true`: Cho phép truy cập public URL

---

#### 3.6.4 STORAGE POLICIES (SQL)

```sql
-- =============================================
-- STORAGE POLICIES - CHI TIẾT
-- =============================================

-- ========== AVATARS ==========
-- Ai cũng có thể xem avatar (public)
CREATE POLICY "avatars_public_select" ON storage.objects 
FOR SELECT USING (bucket_id = 'avatars');

-- Chỉ owner mới upload được avatar của mình
CREATE POLICY "avatars_owner_insert" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Chỉ owner mới update được
CREATE POLICY "avatars_owner_update" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Chỉ owner mới xóa được
CREATE POLICY "avatars_owner_delete" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ========== GROUP-IMAGES ==========
-- Ai cũng có thể xem (public)
CREATE POLICY "group_images_public_select" ON storage.objects 
FOR SELECT USING (bucket_id = 'group-images');

-- Chỉ leader của nhóm mới upload được
CREATE POLICY "group_images_leader_insert" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'group-images' 
  AND public.is_group_leader(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Chỉ leader mới update được
CREATE POLICY "group_images_leader_update" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'group-images' 
  AND public.is_group_leader(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Leader hoặc Admin mới xóa được
CREATE POLICY "group_images_leader_delete" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'group-images' 
  AND (
    public.is_group_leader(auth.uid(), (storage.foldername(name))[1]::uuid)
    OR public.is_admin(auth.uid())
  )
);

-- ========== TASK-SUBMISSIONS ==========
-- Ai cũng có thể xem (để member cùng nhóm xem được)
CREATE POLICY "submissions_public_select" ON storage.objects 
FOR SELECT USING (bucket_id = 'task-submissions');

-- Authenticated users có thể upload
CREATE POLICY "submissions_auth_insert" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'task-submissions'
  AND auth.role() = 'authenticated'
);

-- Authenticated users có thể update file của mình
CREATE POLICY "submissions_auth_update" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'task-submissions'
  AND auth.role() = 'authenticated'
);

-- Owner hoặc Admin mới xóa được (user_id là folder đầu tiên)
CREATE POLICY "submissions_owner_delete" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'task-submissions'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin(auth.uid())
  )
);

-- ========== TASK-NOTE-ATTACHMENTS ==========
CREATE POLICY "note_attachments_select" ON storage.objects 
FOR SELECT USING (bucket_id = 'task-note-attachments');

CREATE POLICY "note_attachments_insert" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'task-note-attachments'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "note_attachments_update" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'task-note-attachments'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "note_attachments_delete" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'task-note-attachments'
  AND auth.role() = 'authenticated'
);

-- ========== APPEAL-ATTACHMENTS ==========
CREATE POLICY "appeal_attachments_select" ON storage.objects 
FOR SELECT USING (bucket_id = 'appeal-attachments');

CREATE POLICY "appeal_attachments_insert" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'appeal-attachments'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "appeal_attachments_delete" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'appeal-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin(auth.uid())
  )
);

-- ========== PROJECT-RESOURCES ==========
-- Public select (có public URL)
CREATE POLICY "resources_public_select" ON storage.objects 
FOR SELECT USING (bucket_id = 'project-resources');

-- Group members có thể upload
CREATE POLICY "resources_member_insert" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'project-resources'
  AND public.is_group_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Leader hoặc Admin mới xóa được
CREATE POLICY "resources_leader_delete" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'project-resources'
  AND (
    public.is_group_leader(auth.uid(), (storage.foldername(name))[1]::uuid)
    OR public.is_admin(auth.uid())
  )
);
```

---

#### 3.6.5 LIÊN KẾT DATABASE VÀ STORAGE

| Bucket | Table liên kết | Cột lưu path | Cột lưu info khác |
|--------|---------------|--------------|-------------------|
| `avatars` | `profiles` | `avatar_url` (full URL) | - |
| `group-images` | `groups` | `image_url` (full URL) | - |
| `task-submissions` | `submission_history` | `file_path` | `file_name`, `file_size` |
| `task-note-attachments` | `task_note_attachments` | `file_path` | `file_name`, `storage_name`, `file_size` |
| `appeal-attachments` | `appeal_attachments` | `file_path` | `file_name`, `storage_name`, `file_size` |
| `project-resources` | `project_resources` | `file_path` (full URL) | `storage_name`, `file_size`, `file_type`, `folder_id` |

---

#### 3.6.6 NAMING CONVENTION CHI TIẾT

| Bucket | Pattern | Giải thích | Ví dụ thực tế |
|--------|---------|------------|---------------|
| `avatars` | `{user_id}/{timestamp}.{ext}` | User ID là folder, timestamp để tránh cache | `a1b2c3d4/1706198400000.png` |
| `group-images` | `{group_id}/{timestamp}.{ext}` | Group ID là folder | `x1y2z3a4/1706198400000.jpg` |
| `task-submissions` | `{user_id}/{task_id}/{uuid}.{ext}` | UUID để tên unique, giữ extension gốc | `user123/task456/550e8400-e29b.pdf` |
| `task-note-attachments` | `{task_id}/{note_id}/{timestamp}_{filename}` | Giữ tên gốc file | `task1/note2/1706198400000_screen.png` |
| `appeal-attachments` | `{user_id}/{appeal_id}/{timestamp}_{filename}` | User ID đầu tiên để RLS check | `user1/appeal2/1706198400_proof.pdf` |
| `project-resources` | `{group_id}/{timestamp}-{random}.{ext}` | Random suffix tránh trùng | `grp1/1706198400000-a7b2c3.docx` |

---

#### 3.6.7 LƯU Ý QUAN TRỌNG VỀ STORAGE

⚠️ **KHÔNG BAO GIỜ:**
- Lưu file trực tiếp vào database (base64, bytea)
- Dùng local file system
- Dùng service storage khác (S3, Firebase Storage...)

✅ **LUÔN LUÔN:**
- Sử dụng Supabase Storage
- Validate file size trước khi upload
- Validate file type (nếu cần)
- Xóa file từ storage khi xóa record trong database
- Dùng UUID hoặc timestamp trong filename để tránh trùng

📝 **KHI THAY ĐỔI STORAGE:**
1. Cập nhật phần này trong file SETUP_REBUILD_WEBSITE_GUIDE.md
2. Ghi rõ: ngày thay đổi, bucket nào, thay đổi gì, lý do
3. Cập nhật component liên quan (nếu có)
4. Test lại flow upload/download/delete

---

### 3.7 AUTH CONFIGURATION

**Vào Supabase Dashboard → Authentication → Settings:**

| Setting | Giá trị | Ghi chú |
|---------|---------|---------|
| Enable Email Signup | ✅ ON | |
| Enable Email Confirmations | ✅ ON | Bắt buộc xác minh email |
| Secure Email Change | ✅ ON | |
| Secure Password Change | ✅ ON | |
| Min Password Length | 6 | |
| Enable Anonymous Sign-ins | ❌ OFF | Không cho phép anonymous |

**Email Templates (Authentication → Email Templates):**

| Template | Customize |
|----------|-----------|
| Confirm signup | Logo UEH + Vietnamese text |
| Reset password | Logo UEH + Vietnamese text |
| Magic link | Không sử dụng |
| Change email | Logo UEH + Vietnamese text |

---

## 4. EDGE FUNCTIONS - CHI TIẾT CODE

### 4.1 `ensure-admin/index.ts`

**File:** `supabase/functions/ensure-admin/index.ts`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const adminEmail = 'khanhngh.ueh@gmail.com'
    const adminPassword = '14092005'
    const adminStudentId = '31241570562'
    const adminFullName = 'Nguyễn Hoàng Khánh'

    // Check if admin exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', adminEmail)
      .single()

    if (existingProfile) {
      return new Response(
        JSON.stringify({ message: 'Admin account already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        student_id: adminStudentId,
        full_name: adminFullName
      }
    })

    if (authError) throw authError

    // Update profile
    await supabase.from('profiles').upsert({
      id: authData.user.id,
      student_id: adminStudentId,
      full_name: adminFullName,
      email: adminEmail,
      is_approved: true,
      must_change_password: false
    })

    // Add admin role
    await supabase.from('user_roles').insert({
      user_id: authData.user.id,
      role: 'admin'
    })

    return new Response(
      JSON.stringify({ 
        message: 'Admin account created successfully',
        email: adminEmail
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
```

### 4.2 `manage-users/index.ts`

**File:** `supabase/functions/manage-users/index.ts`

(Xem file gốc trong `supabase/functions/manage-users/index.ts`)

**Actions hỗ trợ:**

| Action | Description | Required Fields |
|--------|-------------|-----------------|
| `create_member` | Tạo member mới | email, student_id, full_name |
| `setup_system_accounts` | Setup Leader + Deputy | - |
| `update_password` | Đổi password | user_id, password |
| `clear_must_change_password` | Bỏ flag đổi password | user_id |
| `delete_user` | Xóa user | user_id |
| `update_email` | Đổi email | user_id, email |

### 4.3 `team-assistant/index.ts`

**File:** `supabase/functions/team-assistant/index.ts`

(Xem file gốc)

**Features:**
- Giới hạn 100 từ/câu hỏi
- Streaming response (SSE)
- Model: `google/gemini-3-flash-preview`
- Cần secret: `LOVABLE_API_KEY`

**Dữ liệu truyền vào AI:**
- Thông tin dự án (tên, mô tả, mã lớp, GVHD)
- Giai đoạn và số task mỗi giai đoạn
- Danh sách thành viên và vai trò
- Tất cả task (trạng thái, deadline, người thực hiện)
- Tài nguyên dự án (file, link, thư mục)
- **Cuộc họp nhóm** (tiêu đề, thời gian, thời lượng, trạng thái, task liên kết)
- **Điểm quá trình** (CHỈ của user đang hỏi — task scores, stage scores, final score)

**Bảo mật điểm:**
- AI chỉ trả lời điểm của chính user đang hỏi
- Nếu hỏi điểm người khác → từ chối: "Bạn chỉ có thể xem điểm của chính mình"

---

## 5. BIẾN MÔI TRƯỜNG

### 5.1 Frontend (.env)

```env
# Copy từ Supabase Dashboard → Settings → API
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=[project-id]
```

### 5.2 Edge Functions Secrets

**Tự động có (không cần cấu hình):**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`

**Cần thêm thủ công (Supabase Dashboard → Edge Functions → Secrets):**
- `LOVABLE_API_KEY` - cho AI Assistant

---

## 6. DESIGN SYSTEM

### 6.1 Color Tokens (index.css)

```css
:root {
  /* UEH Brand */
  --ueh-teal: 183 100% 21%;
  --ueh-teal-light: 183 58% 30%;
  --ueh-teal-lighter: 183 40% 93%;
  --ueh-orange: 18 88% 58%;
  --ueh-orange-light: 18 88% 66%;
  --ueh-orange-lighter: 18 90% 97%;

  /* Semantic */
  --primary: 183 100% 21%;
  --primary-foreground: 0 0% 100%;
  --accent: 18 88% 58%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 84% 60%;
  --success: 160 84% 40%;
  --warning: 38 92% 50%;

  /* Stage Colors */
  --stage-1: 183 100% 30%;
  --stage-2: 200 80% 45%;
  --stage-3: 260 70% 55%;
  --stage-4: 320 70% 50%;
  --stage-5: 18 85% 55%;
  --stage-6: 140 60% 40%;
}
```

### 6.2 Typography

| Font | CSS Variable | Usage |
|------|--------------|-------|
| Poppins | `font-heading` | Headings (h1-h6) |
| Inter | `font-sans` | Body text |

---

## 7. CẤU TRÚC THƯ MỤC

```
teamworks-ueh/
├── public/
│   ├── favicon.ico
│   ├── favicon.png
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/
│   ├── assets/
│   │   ├── ueh-logo.png
│   │   ├── ueh-logo-new.png
│   │   ├── zalo-logo.png
│   │   └── ai-assistant-logo.png
│   │
│   ├── components/
│   │   ├── ui/                          # 40+ shadcn components
│   │   ├── layout/
│   │   │   └── DashboardLayout.tsx
│   │   ├── ai/
│   │   │   ├── AIAssistantButton.tsx
│   │   │   └── AIAssistantPanel.tsx
│   │   ├── communication/
│   │   │   ├── MentionInput.tsx
│   │   │   ├── MessageItem.tsx
│   │   │   └── TaskComments.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardProjectCard.tsx
│   │   ├── public/
│   │   │   ├── PublicActivityLog.tsx
│   │   │   ├── PublicGroupDashboard.tsx
│   │   │   ├── PublicMemberList.tsx
│   │   │   ├── PublicResourceList.tsx
│   │   │   └── PublicTaskListView.tsx
│   │   ├── scores/
│   │   │   ├── AppealDialog.tsx
│   │   │   ├── AppealReviewDialog.tsx
│   │   │   ├── ProcessScores.tsx
│   │   │   ├── ScoreAdjustmentDialog.tsx
│   │   │   ├── ScoreHistoryPanel.tsx
│   │   │   ├── StageWeightDialog.tsx
│   │   │   └── TaskScoringDialog.tsx
│   │   └── [50+ feature components]
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── FilePreviewContext.tsx
│   │   └── NavigationContext.tsx
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useAutosave.ts
│   │   └── useUserPresence.ts
│   │
│   ├── integrations/supabase/
│   │   ├── client.ts       # ⚠️ AUTO-GENERATED
│   │   └── types.ts        # ⚠️ AUTO-GENERATED
│   │
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── datetime.ts
│   │   ├── urlUtils.ts
│   │   ├── notifications.ts
│   │   ├── messageParser.ts
│   │   ├── excelExport.ts
│   │   ├── activityLogPdf.ts
│   │   ├── projectEvidencePdf.ts
│   │   ├── deleteWithUndo.ts
│   │   ├── errorLogger.ts
│   │   └── uehLogoBase64.ts
│   │
│   ├── pages/
│   │   ├── Index.tsx
│   │   ├── Landing.tsx
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Groups.tsx
│   │   ├── GroupDetail.tsx
│   │   ├── TaskDetail.tsx
│   │   ├── PersonalInfo.tsx
│   │   ├── Communication.tsx
│   │   ├── Feedback.tsx
│   │   ├── FilePreview.tsx
│   │   ├── MemberManagement.tsx
│   │   ├── PublicProjectView.tsx
│   │   ├── AdminActivity.tsx
│   │   ├── AdminBackup.tsx
│   │   ├── AdminUsers.tsx
│   │   └── NotFound.tsx
│   │
│   ├── types/
│   │   ├── database.ts
│   │   └── processScores.ts
│   │
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── supabase/
│   ├── config.toml           # ⚠️ AUTO-GENERATED
│   └── functions/
│       ├── ensure-admin/
│       │   └── index.ts
│       ├── manage-users/
│       │   └── index.ts
│       └── team-assistant/
│           └── index.ts
│
├── .env
├── .env.example
├── .gitignore
├── components.json
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── SETUP_REBUILD_WEBSITE_GUIDE.md
```

---

## 8. COMPONENTS - DANH SÁCH ĐẦY ĐỦ

### 8.1 UI Components (shadcn/ui)

| Component | File | Mục đích |
|-----------|------|----------|
| Accordion | accordion.tsx | Collapsible sections |
| Alert | alert.tsx | Alert messages |
| AlertDialog | alert-dialog.tsx | Confirmation dialogs |
| AspectRatio | aspect-ratio.tsx | Image aspect ratios |
| Avatar | avatar.tsx | User avatars |
| Badge | badge.tsx | Status badges |
| Breadcrumb | breadcrumb.tsx | Navigation breadcrumbs |
| Button | button.tsx | Action buttons |
| Calendar | calendar.tsx | Date picker calendar |
| Card | card.tsx | Content cards |
| Carousel | carousel.tsx | Image carousels |
| Chart | chart.tsx | Recharts wrapper |
| Checkbox | checkbox.tsx | Checkboxes |
| Collapsible | collapsible.tsx | Collapsible content |
| Command | command.tsx | Command palette |
| ContextMenu | context-menu.tsx | Right-click menus |
| Dialog | dialog.tsx | Modal dialogs |
| Drawer | drawer.tsx | Side drawers |
| DropdownMenu | dropdown-menu.tsx | Dropdown menus |
| Form | form.tsx | Form handling |
| HoverCard | hover-card.tsx | Hover popovers |
| Input | input.tsx | Text inputs |
| InputOTP | input-otp.tsx | OTP inputs |
| Label | label.tsx | Form labels |
| Menubar | menubar.tsx | Menu bars |
| NavigationMenu | navigation-menu.tsx | Navigation menus |
| Pagination | pagination.tsx | Page navigation |
| Popover | popover.tsx | Popovers |
| Progress | progress.tsx | Progress bars |
| RadioGroup | radio-group.tsx | Radio buttons |
| ResizablePanels | resizable.tsx | Resizable panels |
| ScrollArea | scroll-area.tsx | Custom scrollbars |
| Select | select.tsx | Select dropdowns |
| Separator | separator.tsx | Visual separators |
| Sheet | sheet.tsx | Side sheets |
| Sidebar | sidebar.tsx | App sidebar |
| Skeleton | skeleton.tsx | Loading skeletons |
| Slider | slider.tsx | Range sliders |
| Sonner | sonner.tsx | Toast notifications |
| Switch | switch.tsx | Toggle switches |
| Table | table.tsx | Data tables |
| Tabs | tabs.tsx | Tab navigation |
| Textarea | textarea.tsx | Text areas |
| Toast | toast.tsx | Toast messages |
| Toggle | toggle.tsx | Toggle buttons |
| ToggleGroup | toggle-group.tsx | Button groups |
| Tooltip | tooltip.tsx | Tooltips |

### 8.2 Feature Components

| Component | Mục đích |
|-----------|----------|
| ActivityLogFilters.tsx | Lọc activity log |
| AdminAuthForm.tsx | Form đăng nhập admin |
| AdminBackupRestore.tsx | Backup/restore UI |
| AuthForm.tsx | Form đăng nhập/đăng ký |
| AvatarUpload.tsx | Upload avatar |
| ChangePasswordDialog.tsx | Dialog đổi password |
| CompactTaskNotes.tsx | Ghi chú task (compact) |
| CountdownTimer.tsx | Countdown deadline |
| DateTimePicker.tsx | Chọn ngày giờ |
| DateTimePickerSeparate.tsx | Chọn ngày + giờ riêng |
| DeadlineHourPicker.tsx | Chọn giờ deadline |
| FileSizeLimitSelector.tsx | Chọn giới hạn file |
| FirstTimeOnboarding.tsx | Onboarding lần đầu |
| GroupDashboard.tsx | Dashboard nhóm |
| GroupInfoCard.tsx | Thông tin nhóm |
| KanbanBoard.tsx | Bảng Kanban |
| MemberAuthForm.tsx | Form đăng nhập member |
| MemberDetailDialog.tsx | Chi tiết thành viên |
| MemberManagementCard.tsx | Quản lý thành viên |
| MultiFileUploadSubmission.tsx | Upload nhiều file |
| NavLink.tsx | Navigation link |
| NotificationBell.tsx | Chuông thông báo |
| ProfileViewDialog.tsx | Xem profile |
| ProjectActivityLog.tsx | Nhật ký dự án |
| ProjectEvidenceExport.tsx | Xuất minh chứng |
| ProjectNavigation.tsx | Navigation dự án |
| ProjectResources.tsx | Tài liệu dự án |
| ResourceLinkRenderer.tsx | Render link tài liệu |
| ResourceTagTextarea.tsx | Tag tài liệu |
| ResourceUploadDialog.tsx | Dialog upload tài liệu |
| ShareSettingsCard.tsx | Cài đặt chia sẻ |
| StageEditDialog.tsx | Sửa giai đoạn |
| StageManagement.tsx | Quản lý giai đoạn |
| SubmissionButton.tsx | Nút nộp bài |
| SubmissionHistoryPopup.tsx | Lịch sử nộp bài |
| SuspendMemberDialog.tsx | Dialog đình chỉ thành viên |
| SuspendedScreen.tsx | Màn hình bị đình chỉ |
| SystemErrorLogs.tsx | Xem log lỗi hệ thống |
| TaskCard.tsx | Card task |
| TaskEditDialog.tsx | Sửa task |
| TaskFilters.tsx | Lọc task |
| TaskListView.tsx | Danh sách task |
| TaskNotes.tsx | Ghi chú task |
| TaskSubmissionDialog.tsx | Dialog nộp bài |
| UEHLogo.tsx | Logo UEH |
| UserAvatar.tsx | Avatar user |
| UserChangePasswordDialog.tsx | Đổi password |
| UserPresenceIndicator.tsx | Trạng thái online |
| ExcelMemberImport.tsx | Import thành viên từ Excel |
| GroupMeetings.tsx | Quản lý cuộc họp nhóm |
| CreateMeetingDialog.tsx | Dialog tạo cuộc họp mới |
| MeetingRoom.tsx | Phòng họp (Jitsi + chat + điểm danh) |
| MaintenanceScreen.tsx | Màn hình bảo trì hệ thống |
| MemberNavigation.tsx | Navigation cho member |
| MemberRoleManagementDialog.tsx | Quản lý vai trò thành viên |
| ProjectTransferDialog.tsx | Dialog chuyển nhượng dự án |

---

## 9. PAGES & ROUTING

### 9.1 Danh sách Routes

| Path | Component | Protected | Mô tả |
|------|-----------|-----------|-------|
| `/` | Landing.tsx | ❌ | Trang chủ công khai |
| `/auth` | Auth.tsx | ❌ | Đăng nhập/đăng ký |
| `/dashboard` | Dashboard.tsx | ✅ | Dashboard chính |
| `/groups` | Groups.tsx | ✅ | Danh sách nhóm |
| `/p/:projectSlug` | GroupDetail.tsx | ✅ | Chi tiết dự án |
| `/p/:projectSlug/t/:taskSlug` | GroupDetail.tsx | ✅ | Chi tiết task |
| `/p/:projectSlug/t/:taskSlug/f/:fileIndex` | FilePreview.tsx | ✅ | Xem file trong task |
| `/groups/:groupId` | GroupDetail.tsx | ✅ | Legacy URL |
| `/groups/:groupId/tasks/:taskId` | GroupDetail.tsx | ✅ | Legacy URL |
| `/s/:shareToken` | PublicProjectView.tsx | ❌ | Xem công khai |
| `/s/:shareToken/t/:taskSlug/f/:fileIndex` | FilePreview.tsx | ❌ | Xem file public |
| `/personal-info` | PersonalInfo.tsx | ✅ | Thông tin cá nhân |
| `/communication` | Communication.tsx | ✅ | Trò chuyện |
| `/feedback` | Feedback.tsx | ✅ | Gửi phản hồi |
| `/file-preview` | FilePreview.tsx | ❌ | Xem file (legacy) |
| `/members` | MemberManagement.tsx | ✅ | Quản lý thành viên |
| `/admin/activity` | AdminActivity.tsx | ✅ Admin | Nhật ký hệ thống |
| `/admin/backup` | AdminBackup.tsx | ✅ Admin | Backup/Restore |
| `/admin/users` | AdminUsers.tsx | ✅ Admin | Quản lý users (hidden) |
| `/admin/system` | AdminSystem.tsx | ✅ Admin | Cài đặt hệ thống (bảo trì, chính sách) |
| `*` | NotFound.tsx | ❌ | 404 |

---

## 10. QUY TẮC HỆ THỐNG BẮT BUỘC

### 10.1 🔴 Cơ chế hoàn tác xóa (Undo Delete)

**Áp dụng cho TOÀN BỘ hệ thống, bao gồm các tính năng hiện tại và tương lai.**

**Nguyên tắc:**
- Mọi thao tác xóa dữ liệu đều **PHẢI** sử dụng `deleteWithUndo()` từ `src/lib/deleteWithUndo.ts`
- Hiển thị toast "Đã xóa" kèm nút **Hoàn tác** với đếm ngược **5 giây**
- Trong 5 giây, người dùng nhấn Hoàn tác → khôi phục ngay lập tức
- Sau 5 giây → xóa vĩnh viễn
- **KHÔNG BAO GIỜ** xóa trực tiếp mà không qua cơ chế undo

**Cách sử dụng:**
```ts
import { deleteWithUndo } from '@/lib/deleteWithUndo';

deleteWithUndo({
  description: 'Đã xóa task "Tên task"',
  onDelete: async () => {
    await supabase.from('tasks').delete().eq('id', taskId);
  },
  onUndo: () => {
    // Khôi phục lại UI state nếu đã ẩn item trước đó
    onRefresh();
  },
});
```

**Đã áp dụng tại (14 files):**

| File | Thao tác xóa |
|------|---------------|
| `GroupDetail.tsx` | Xóa project |
| `StageManagement.tsx` | Xóa giai đoạn |
| `KanbanBoard.tsx` | Xóa task (Kanban) |
| `TaskListView.tsx` | Xóa task (ListView) |
| `Communication.tsx` | Xóa tin nhắn |
| `ProjectResources.tsx` | Xóa tài liệu + thư mục |
| `MemberManagementCard.tsx` | Xóa thành viên khỏi nhóm |
| `Feedback.tsx` | Xóa feedback |
| `AdminActivity.tsx` | Xóa nhật ký hệ thống |
| `NotificationBell.tsx` | Xóa thông báo |
| `TaskNotes.tsx` | Xóa ghi chú + file đính kèm |
| `SystemErrorLogs.tsx` | Xóa log lỗi |
| `AdminUsers.tsx` | Xóa user |
| `MemberManagement.tsx` | Xóa thành viên |

### 10.2 Ghi nhận lỗi hệ thống (Error Logging)

- Sử dụng `src/lib/errorLogger.ts` để ghi nhận lỗi tự động vào bảng `system_error_logs`
- Admin có thể xem lỗi tại component `SystemErrorLogs.tsx`
- Tự động đếm số lần xảy ra lỗi giống nhau (`occurrence_count`)

---

## 11. HƯỚNG DẪN SETUP STEP-BY-STEP

### 11.1 Yêu cầu hệ thống

- **Node.js:** >= 18.x (khuyến nghị 20.x)
- **Package Manager:** npm / yarn / pnpm / bun
- **Git:** Installed
- **Browser:** Chrome / Firefox / Edge (latest)
- **IDE:** VS Code (khuyến nghị)

### 11.2 Setup từ đầu

```bash
# 1. Clone repo
git clone https://github.com/your-repo/teamworks-ueh.git
cd teamworks-ueh

# 2. Cài dependencies
npm install
# hoặc
bun install

# 3. Copy env
cp .env.example .env

# 4. Điền thông tin Supabase vào .env

# 5. Chạy development
npm run dev

# 6. Mở browser
# http://localhost:5173
```

### 11.3 Setup Supabase từ đầu

1. **Tạo project mới** trên supabase.com
2. **Chạy SQL theo thứ tự:**
   - Enum types
   - Tables
   - Functions
   - Triggers
   - Enable RLS
   - RLS Policies
   - Storage buckets
   - Storage policies
3. **Cấu hình Auth settings**
4. **Tạo Edge Functions**
5. **Chạy ensure-admin**
6. **Test đăng nhập**

---

## 12. TẠO TÀI KHOẢN ADMIN

### Cách 1: Edge Function (Recommended)

```bash
curl -X POST https://[project-id].supabase.co/functions/v1/ensure-admin
```

### Cách 2: Thủ công

```sql
-- 1. Đăng ký tài khoản qua UI

-- 2. Lấy user_id
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- 3. Cập nhật profile
UPDATE public.profiles
SET is_approved = true, full_name = 'Admin Name'
WHERE id = 'your-user-id';

-- 4. Gán role admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('your-user-id', 'admin');
```

---

## 13. CHECKLIST SAU KHI SETUP

```
✅ Database
   [ ] Tất cả 28 bảng đã được tạo
   [ ] Tất cả indexes đã được tạo
   [ ] Tất cả functions đã được tạo
   [ ] Tất cả triggers đã được tạo

✅ RLS
   [ ] RLS enabled cho tất cả bảng
   [ ] Tất cả policies đã được tạo

✅ Storage
   [ ] 6 buckets đã được tạo
   [ ] Storage policies đã được tạo

✅ Auth
   [ ] Email confirmation enabled
   [ ] Password policy configured

✅ Edge Functions
   [ ] ensure-admin deployed
   [ ] manage-users deployed
   [ ] team-assistant deployed

✅ Frontend
   [ ] .env configured
   [ ] npm install thành công
   [ ] npm run dev chạy được

✅ Test
   [ ] Đăng nhập admin thành công
   [ ] Tạo nhóm thành công
   [ ] Tạo task thành công
   [ ] Nộp bài thành công
```

---

## 14. LƯU Ý QUAN TRỌNG

### 13.1 Files KHÔNG ĐƯỢC chỉnh sửa

| File | Lý do |
|------|-------|
| `src/integrations/supabase/client.ts` | Auto-generated |
| `src/integrations/supabase/types.ts` | Auto-generated từ schema |
| `supabase/config.toml` | Auto-generated |
| `.env` | Chứa secrets |

### 13.2 Bảo mật

| ⚠️ KHÔNG BAO GIỜ | Hậu quả |
|------------------|---------|
| Tắt RLS | Ai cũng đọc/ghi được data |
| Lộ service_role_key | Full access database |
| Lưu role trong profiles | User tự nâng quyền |
| Hardcode secrets | Lộ credentials |

---

## 15. TROUBLESHOOTING

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| "Invalid API key" | Sai key | Kiểm tra .env |
| "JWT expired" | Session hết hạn | Đăng nhập lại |
| "violates RLS policy" | Không có quyền | Kiểm tra RLS |
| "infinite recursion" | RLS gọi chính nó | Dùng SECURITY DEFINER |
| "Bucket not found" | Chưa tạo bucket | Tạo bucket |
| Blank page | JS error | Mở DevTools |

---

## 16. BACKUP & RESTORE

### Backup

```bash
# Export từ Supabase Dashboard → Database → Backups
# Hoặc dùng pg_dump
```

### Restore

```sql
-- Truncate tables theo thứ tự FK
-- Import data
```

---

## 17. CHANGELOG

### 17.1 General Changelog

| Version | Date | Changes |
|---------|------|---------|
| 4.0 | 02/03/2026 | **MAJOR UPDATE**: Thêm cơ chế Undo Delete toàn hệ thống (14 files), bảng `system_error_logs` (28 bảng), suspension fields cho profiles, components mới (ExcelMemberImport, MemberDetailDialog, ResourceUploadDialog, SuspendMemberDialog, SuspendedScreen, SystemErrorLogs), libs mới (deleteWithUndo, errorLogger), FilePreviewContext, cập nhật routes |
| 3.1 | 04/02/2026 | **STORAGE UPDATE**: Chi tiết hóa toàn bộ phần Supabase Storage với đầy đủ bucket, naming convention, RLS policies, liên kết DB |
| 3.0 | 04/02/2026 | Full detailed guide |
| 2.0 | 04/02/2026 | Added Edge Functions, Design System |
| 1.0 | 04/02/2026 | Initial version |

### 17.2 Storage Changelog

> 📝 **BẮT BUỘC:** Mọi thay đổi về Storage phải ghi vào bảng này

| Date | Bucket | Action | Chi tiết thay đổi | Người thực hiện |
|------|--------|--------|-------------------|-----------------|
| 04/02/2026 | `avatars` | CREATE | Tạo bucket public, 2MB limit, chỉ image | System |
| 04/02/2026 | `group-images` | CREATE | Tạo bucket public, 5MB limit, chỉ image | System |
| 04/02/2026 | `task-submissions` | CREATE | Tạo bucket public, 100MB limit, tất cả file | System |
| 04/02/2026 | `task-note-attachments` | CREATE | Tạo bucket public, 10MB limit | System |
| 04/02/2026 | `appeal-attachments` | CREATE | Tạo bucket public, 5MB limit | System |
| 04/02/2026 | `project-resources` | CREATE | Tạo bucket public, 50MB limit | System |

**Các action có thể:**
- `CREATE`: Tạo bucket mới
- `DELETE`: Xóa bucket
- `UPDATE_POLICY`: Đổi RLS policy
- `UPDATE_LIMIT`: Đổi size/type limit
- `UPDATE_PUBLIC`: Đổi public/private
- `RENAME`: Đổi tên bucket

---

> **⚠️ CẬP NHẬT FILE NÀY** mỗi khi có thay đổi về:
> - Database schema
> - **Storage buckets** (QUAN TRỌNG - ghi vào Storage Changelog)
> - Auth configuration
> - RLS policies
> - Edge Functions
> - Routes
> - Components

---

**© 2025-2026 Teamworks UEH - Đại học Kinh tế TP. Hồ Chí Minh**


# Quy tắc hệ thống

## 🔴 QUY TẮC BẮT BUỘC: Cơ chế hoàn tác xóa (Undo Delete)

**Áp dụng cho TOÀN BỘ hệ thống, bao gồm các tính năng tương lai.**

- Mọi thao tác xóa dữ liệu đều PHẢI sử dụng `deleteWithUndo()` từ `src/lib/deleteWithUndo.ts`
- Hiển thị toast "Đã xóa" kèm nút **Hoàn tác** với đếm ngược **5 giây**
- Trong 5 giây, người dùng nhấn Hoàn tác → khôi phục ngay lập tức
- Sau 5 giây → xóa vĩnh viễn
- **KHÔNG BAO GIỜ** xóa trực tiếp mà không qua cơ chế undo

### Cách sử dụng:
```ts
import { deleteWithUndo } from '@/lib/deleteWithUndo';

deleteWithUndo({
  description: 'Đã xóa task "Tên task"',
  onDelete: async () => {
    await supabase.from('tasks').delete().eq('id', taskId);
  },
  onUndo: () => {
    // Khôi phục lại UI state nếu đã ẩn item trước đó
  },
});
```

---

# Kế hoạch: Xuất Minh chứng Dự án (Evidence Export)

## Tổng quan

Thêm chức năng **"Xuất Minh chứng"** trong tab **Cài đặt** của project, cho phép Leader xuất toàn bộ dữ liệu dự án thành file PDF chuyên nghiệp với cấu trúc chương/mục rõ ràng và thương hiệu UEH.

## Cấu trúc Báo cáo Minh chứng

```text
+-------------------------------------------------------+
|                    [UEH LOGO]                          |
|                    UEH UNIVERSITY                      |
|                                                       |
|        BAO CAO MINH CHUNG DU AN                       |
|           [Ten Du An]                                 |
|                                                       |
|   Lop: [Ma lop]    |    GV HD: [Ten GV]               |
|   Ngay xuat: dd/MM/yyyy HH:mm                         |
+-------------------------------------------------------+

CHUONG 1: THONG TIN CHUNG
  1.1 Thong tin du an
  1.2 Thong tin giang vien
  1.3 Thong tin nhom

CHUONG 2: DANH SACH THANH VIEN
  [Bang: STT | MSSV | Ho ten | Vai tro | Ngay tham gia]

CHUONG 3: TIEN DO THUC HIEN
  3.1 Thong ke tong quan
  3.2 Tien do theo giai doan
    3.2.1 Giai doan 1: [Ten]
      - Task 1: [Trang thai] | [Deadline] | [Assignees]
      - Task 2: ...
    3.2.2 Giai doan 2: [Ten]
      ...

CHUONG 4: CHI TIET CONG VIEC
  [Bang: STT | Task | Giai doan | Trang thai | Deadline | Nguoi thuc hien | Ngay hoan thanh]

CHUONG 5: DIEM QUA TRINH
  5.1 Diem theo giai doan
  5.2 Diem tong ket
  [Bang: STT | MSSV | Ho ten | Diem GD1 | Diem GD2 | ... | Diem TB]

CHUONG 6: TAI NGUYEN DU AN
  [Bang: STT | Ten file | Danh muc | Nguoi upload | Ngay upload | Kich thuoc]

CHUONG 7: NHAT KY HOAT DONG
  [Bang: STT | Ngay | Gio | Nguoi thuc hien | Hanh dong | Mo ta]

+-------------------------------------------------------+
|   UEH UNIVERSITY           Trang X / Y        dd/MM/yyyy|
+-------------------------------------------------------+
```

## Thiết kế Giao diện

### Card trong Tab Cài đặt

```text
+--------------------------------------------------+
| [FileText Icon]  Xuất Minh chứng                  |
| Xuất toàn bộ dữ liệu dự án ra file PDF           |
|                                                   |
| [ ] Thông tin thành viên                          |
| [ ] Chi tiết công việc (Tasks)                    |
| [ ] Điểm quá trình                                |
| [ ] Tài nguyên dự án                              |
| [ ] Nhật ký hoạt động                             |
|                                                   |
| [======= Đang tải dữ liệu... =======] (khi xuất)  |
|                                                   |
|                    [Xuất PDF] (Button UEH teal)   |
+--------------------------------------------------+
```

## Chi tiết Kỹ thuật

### 1. File mới cần tạo

**`src/lib/projectEvidencePdf.ts`** - Logic xuất PDF minh chứng:
- Sử dụng thư viện `jspdf` + `jspdf-autotable` (đã có sẵn)
- Tái sử dụng style UEH từ `activityLogPdf.ts`:
  - Màu UEH Teal: #1A6B6D
  - Màu UEH Orange: #E07B39
  - Font helvetica (tương thích PDF, không dấu tiếng Việt)
- Cấu trúc hàm chính:
  ```typescript
  exportProjectEvidencePdf({
    project: Group,
    members: GroupMember[],
    stages: Stage[],
    tasks: Task[],
    scores: { taskScores, stageScores, finalScores },
    resources: ProjectResource[],
    activityLogs: ActivityLog[],
    options: {
      includeMembers: boolean,
      includeTasks: boolean,
      includeScores: boolean,
      includeResources: boolean,
      includeLogs: boolean,
    }
  })
  ```

**`src/components/ProjectEvidenceExport.tsx`** - Component UI:
- Card với checkboxes để chọn nội dung xuất
- Button xuất với loading state
- Fetch tất cả dữ liệu cần thiết khi click xuất

### 2. File cần chỉnh sửa

**`src/pages/GroupDetail.tsx`**:
- Import và thêm component `ProjectEvidenceExport` vào tab Settings
- Đặt trước Card "Xóa project"

### 3. Dữ liệu cần fetch khi xuất

| Dữ liệu | Bảng | Điều kiện |
|---------|------|-----------|
| Thông tin dự án | groups | id = groupId |
| Thành viên | group_members + profiles | group_id = groupId |
| Giai đoạn | stages | group_id = groupId |
| Tasks + Assignments | tasks + task_assignments | group_id = groupId |
| Điểm task | task_scores | task_id in tasks |
| Điểm giai đoạn | member_stage_scores | stage_id in stages |
| Điểm cuối | member_final_scores | group_id = groupId |
| Tài nguyên | project_resources | group_id = groupId |
| Nhật ký | activity_logs | group_id = groupId |

### 4. Format PDF từng chương

**Chương 1 - Thông tin chung:**
- Box thông tin với border teal
- Các field: Tên dự án, Mô tả, Mã lớp, GV hướng dẫn, Email GV, Link Zalo

**Chương 2 - Thành viên:**
- Bảng với header teal
- Cột: STT, MSSV, Họ tên, Vai trò, Ngày tham gia
- Highlight Leader với badge màu khác

**Chương 3 - Tiến độ:**
- Thống kê tổng: Tổng tasks, Hoàn thành, Đang làm, Chờ xử lý
- Liệt kê theo từng giai đoạn với progress bar text

**Chương 4 - Chi tiết công việc:**
- Bảng đầy đủ thông tin task
- Màu status khác nhau (TODO, IN_PROGRESS, DONE, VERIFIED)

**Chương 5 - Điểm quá trình:**
- Bảng điểm theo giai đoạn
- Bảng điểm tổng kết cuối cùng

**Chương 6 - Tài nguyên:**
- Bảng liệt kê file với metadata

**Chương 7 - Nhật ký:**
- Tái sử dụng format từ `activityLogPdf.ts`

### 5. Chi tiết Style PDF

```typescript
// UEH Colors (giống activityLogPdf.ts)
const UEH_TEAL: [number, number, number] = [26, 107, 109];
const UEH_ORANGE: [number, number, number] = [224, 123, 57];
const UEH_TEAL_LIGHT: [number, number, number] = [230, 243, 243];

// Chapter heading style
fontSize: 14, bold, color: UEH_TEAL
// Section heading style  
fontSize: 11, bold, color: gray-dark
// Table header
fillColor: UEH_TEAL, textColor: white
// Alternating rows
fillColor: UEH_TEAL_LIGHT
```

## Luồng Xuất PDF

```text
User clicks [Xuất PDF]
       |
       v
Validate at least 1 option selected
       |
       v
Show loading state + progress bar
       |
       v
Fetch all selected data in parallel
       |
       v
Generate PDF with chapters
       |
       v
Auto-download: "minh-chung-[project-slug]-[timestamp].pdf"
       |
       v
Show success toast
```

## Tóm tắt Thay đổi

| File | Hành động |
|------|-----------|
| `src/lib/projectEvidencePdf.ts` | Tạo mới - Logic xuất PDF |
| `src/components/ProjectEvidenceExport.tsx` | Tạo mới - Component UI |
| `src/pages/GroupDetail.tsx` | Chỉnh sửa - Thêm component vào Settings |

## Ghi chú Quan trọng

- Sử dụng `removeVietnameseDiacritics()` cho tất cả text (PDF không hỗ trợ font tiếng Việt)
- Mỗi chương bắt đầu trang mới để dễ đọc
- Footer mỗi trang có UEH branding + số trang
- Tên file output: `minh-chung-[project-slug]-YYYYMMDD-HHmmss.pdf`

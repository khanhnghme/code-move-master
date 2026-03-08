

# Chức năng Họp Nhóm (Group Meeting)

## Tổng quan
Thêm tab "Họp Nhóm" giữa Task và Tài nguyên, tích hợp Jitsi Meet (miễn phí, không cần API key) cho video call với cam/mic/chia sẻ màn hình/chat. Mỗi cuộc họp tự động tạo task tương ứng để tính điểm quá trình.

## Database

### Bảng mới: `meetings`
| Column | Type | Note |
|--------|------|------|
| id | uuid PK | |
| group_id | uuid FK → groups | |
| title | text | Tên cuộc họp |
| description | text | Mô tả/agenda |
| scheduled_at | timestamptz | Thời gian họp |
| duration_minutes | int | Thời lượng dự kiến |
| status | text | scheduled / in_progress / completed |
| jitsi_room_name | text | Unique room name |
| task_id | uuid FK → tasks | Task tự động tạo |
| created_by | uuid | |
| created_at / updated_at | timestamptz | |

### Bảng mới: `meeting_attendance`
| Column | Type | Note |
|--------|------|------|
| id | uuid PK | |
| meeting_id | uuid FK → meetings | |
| user_id | uuid | |
| status | text | present / absent / late |
| joined_at | timestamptz | Thời gian vào họp |
| marked_by | uuid | Ai điểm danh |
| created_at | timestamptz | |

### RLS
- Group members: SELECT meetings & attendance trong group của mình
- Group leaders: ALL trên cả 2 bảng
- Members: UPDATE attendance (chỉ joined_at khi tự check-in)

## Luồng hoạt động

```text
Leader tạo cuộc họp
  ├─ Nhập: tiêu đề, mô tả, thời gian, stage
  ├─ Hệ thống tự động:
  │   ├─ Tạo task "Họp: [tên]" gán tất cả thành viên
  │   ├─ Tạo Jitsi room name unique (group-id + meeting-id)
  │   └─ Tạo records attendance cho mỗi thành viên (status=absent)
  └─ Cuộc họp hiển thị trong tab Họp Nhóm

Khi bắt đầu họp
  ├─ Nhúng Jitsi Meet iframe (cam/mic/share/chat tích hợp sẵn)
  ├─ Leader điểm danh: tick present/absent/late cho từng thành viên
  └─ Kết thúc: Leader đánh dấu completed → task chuyển DONE

Điểm quá trình
  └─ Task meeting nằm trong stage → tính điểm như task thường
```

## Thay đổi code

### 1. Navigation
- **ProjectNavigation.tsx**: Thêm tab `meetings` (icon Video) giữa `tasks` và `resources`
- **GroupDetail.tsx**: Thêm `meetings` vào `availableTabs`, thêm `TabsContent` render component mới

### 2. Component mới: `src/components/GroupMeetings.tsx`
- Danh sách cuộc họp (scheduled/completed)
- Nút tạo cuộc họp mới (leader only)
- Card mỗi cuộc họp: tiêu đề, thời gian, trạng thái, số người tham gia
- Click vào → mở chi tiết cuộc họp

### 3. Component mới: `src/components/MeetingRoom.tsx`
- Jitsi Meet iframe nhúng: `https://meet.jit.si/{room-name}`
- Panel điểm danh bên cạnh: danh sách thành viên + checkbox present/absent/late
- Nút kết thúc cuộc họp

### 4. Component mới: `src/components/CreateMeetingDialog.tsx`
- Form: tiêu đề, mô tả, thời gian, thời lượng, chọn stage
- Submit → tạo meeting + tạo task tự động + tạo attendance records

### 5. Activity logging
- Ghi log khi tạo/bắt đầu/kết thúc cuộc họp

## Jitsi Meet Integration
- Nhúng qua iframe: `<iframe src="https://meet.jit.si/{unique-room}" allow="camera;microphone;display-capture" />`
- Room name format: `teamwork-{group-short-id}-{meeting-short-id}` để đảm bảo unique
- Không cần API key, không cần đăng ký
- Hỗ trợ sẵn: cam, mic, chia sẻ màn hình, chat trong phòng

